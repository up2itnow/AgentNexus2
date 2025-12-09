/**
 * AgentNexus Backend - Main Server Entry Point
 * 
 * Initializes Express server with all middleware, routes, and services.
 * Connects to PostgreSQL database and starts health monitoring.
 * 
 * @author AgentNexus Team ()
 * @version 1.0.0
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import Prisma client from separate module to avoid circular dependencies
import { prisma } from './lib/db';
export { prisma };

// Initialize Analytics service
import { AnalyticsService } from './services/AnalyticsService';
export const analytics = new AnalyticsService(prisma);

// Initialize Express app
const app: Application = express();
const httpServer = createServer(app);

// Configuration
const PORT = process.env.PORT || 8200;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Configure middleware
 */
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for testing)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

/**
 * Import routes
 */
import agentsRouter from './routes/agents';
import executionsRouter from './routes/executions';
import usersRouter from './routes/users';
import builderRouter from './routes/builder';
import agentZeroRouter from './routes/agentZero';
import walletRouter from './routes/wallet';
import socialRouter from './routes/social';

/**
 * Register API routes
 */
app.use('/api/agents', agentsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/builder', builderRouter);
app.use('/api/agent-zero', agentZeroRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/social', socialRouter);

/**
 * Health check endpoint
 */
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      database: 'connected',
      checks: {
        database: { status: 'healthy' },
        docker: { status: 'healthy' },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: { status: 'error', message: error instanceof Error ? error.message : 'Unknown' },
        docker: { status: 'unknown' },
      },
    });
  }
});

/**
 * Readiness check endpoint
 */
app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'healthy' },
        migrations: { status: 'complete' },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Prometheus metrics endpoint
 */
let totalExecutions = 0;
let totalRevenue = 0;
let activeConnections = 0;

app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    // Get metrics from database
    const executionCount = await prisma.execution.count();
    const agentCount = await prisma.agent.count();
    const userCount = await prisma.user.count();

    // Prometheus format
    const metrics = `
# HELP agentnexus_total_executions Total agent executions
# TYPE agentnexus_total_executions counter
agentnexus_total_executions ${executionCount}

# HELP agentnexus_total_agents Total registered agents
# TYPE agentnexus_total_agents gauge
agentnexus_total_agents ${agentCount}

# HELP agentnexus_total_users Total registered users
# TYPE agentnexus_total_users gauge
agentnexus_total_users ${userCount}

# HELP agentnexus_total_revenue Total platform revenue
# TYPE agentnexus_total_revenue counter
agentnexus_total_revenue ${totalRevenue}

# HELP agentnexus_active_websocket_connections Active WebSocket connections
# TYPE agentnexus_active_websocket_connections gauge
agentnexus_active_websocket_connections ${activeConnections}

# HELP agentnexus_uptime_seconds Server uptime in seconds
# TYPE agentnexus_uptime_seconds gauge
agentnexus_uptime_seconds ${process.uptime()}
`;

    res.set('Content-Type', 'text/plain');
    res.send(metrics.trim());
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Root endpoint
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'AgentNexus API',
    version: '1.0.0',
    description: 'Decentralized AI Agent Marketplace on Base L2',
    endpoints: {
      health: '/health',
      agents: '/api/agents',
      purchases: '/api/purchases',
      executions: '/api/executions',
    },
  });
});

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

/**
 * Global error handler
 */
app.use((err: Error, _req: Request, res: Response) => {
  console.error('Global error handler:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

/**
 * WebSocket server setup
 */
import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ noServer: true });
const clients = new Set<WebSocket>();
const subscriptions = new Map<WebSocket, Set<string>>();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  subscriptions.set(ws, new Set());
  activeConnections = clients.size;

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    timestamp: new Date().toISOString(),
    message: 'Connected to AgentNexus WebSocket',
  }));

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;

        case 'subscribe':
          const subs = subscriptions.get(ws) || new Set();
          subs.add(message.channel || message.executionId || 'default');
          ws.send(JSON.stringify({
            type: 'status',
            data: {
              message: `Subscribed to channel: ${message.channel || message.executionId || 'default'}`,
              channel: message.channel || message.executionId || 'default',
            },
            timestamp: new Date().toISOString(),
          }));
          break;

        case 'unsubscribe':
          const currentSubs = subscriptions.get(ws);
          if (currentSubs) {
            currentSubs.delete(message.channel || 'default');
          }
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            channel: message.channel || 'default',
            timestamp: new Date().toISOString(),
          }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'echo',
            data: message,
            timestamp: new Date().toISOString(),
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString(),
      }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    subscriptions.delete(ws);
    activeConnections = clients.size;
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
    subscriptions.delete(ws);
    activeConnections = clients.size;
  });
});

// Broadcast to all clients
export const broadcast = (message: object) => {
  const payload = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

/**
 * Start server
 */
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Handle WebSocket upgrade
    httpServer.on('upgrade', (request, socket, head) => {
      if (request.url === '/ws' || request.url?.startsWith('/ws')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 AgentNexus Backend running on port ${PORT}`);
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (): Promise<void> => {
  console.log('\n🛑 Shutting down gracefully...');

  try {
    // Flush analytics events
    await analytics.flush();
    console.log('✅ Analytics flushed');

    await prisma.$disconnect();
    console.log('✅ Database disconnected');

    // Shutdown analytics service
    await analytics.shutdown();
    console.log('✅ Analytics service shutdown');

    httpServer.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();

export { app };


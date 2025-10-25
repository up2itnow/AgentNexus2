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
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Initialize Prisma client
export const prisma = new PrismaClient();

// Initialize Analytics service
import { AnalyticsService } from './services/AnalyticsService';
export const analytics = new AnalyticsService();

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

/**
 * Import routes
 */
import agentsRouter from './routes/agents';
import executionsRouter from './routes/executions';
import usersRouter from './routes/users';
import builderRouter from './routes/builder';
import agentZeroRouter from './routes/agentZero';
import walletRouter from './routes/wallet';

/**
 * Register API routes
 */
app.use('/api/agents', agentsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/builder', builderRouter);
app.use('/api/agent-zero', agentZeroRouter);
app.use('/api/wallet', walletRouter);

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
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
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
 * Start server
 */
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 AgentNexus Backend running on port ${PORT}`);
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
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


/**
 * Health Check Routes
 * 
 * Provides health and readiness endpoints for monitoring and orchestration.
 * 
 * Endpoints:
 * - GET /health - Liveness probe (is service running?)
 * - GET /health/ready - Readiness probe (can service handle traffic?)
 * - GET /metrics - Prometheus metrics endpoint
 * 
 * @author AgentNexus Team ()
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Docker from 'dockerode';
import { metricsService } from '../services/MetricsService';
import { webSocketService } from '../services/WebSocketService';

const router = Router();

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'ok' | 'error';
      message?: string;
      details?: any;
    };
  };
}

/**
 * GET /health
 * 
 * Liveness probe - checks if the service is running
 * Always returns 200 OK if service is up
 */
router.get('/health', (_req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      service: {
        status: 'ok',
        message: 'Service is running'
      }
    }
  };

  res.status(200).json(response);
});

/**
 * GET /health/ready
 * 
 * Readiness probe - checks if service can handle traffic
 * Checks:
 * - Database connection
 * - Docker daemon availability
 * - Memory usage (< 90%)
 * 
 * Returns 200 OK if ready, 503 Service Unavailable if not ready
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  const checks: HealthCheckResponse['checks'] = {};
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

  // Check 1: Database connection
  try {
    const prisma = req.app.locals.prisma as PrismaClient;
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'ok',
      message: 'Database connection healthy'
    };
  } catch (error: any) {
    checks.database = {
      status: 'error',
      message: 'Database connection failed',
      details: error.message
    };
    overallStatus = 'unhealthy';
  }

  // Check 2: Docker daemon
  try {
    const docker = new Docker();
    await docker.ping();
    checks.docker = {
      status: 'ok',
      message: 'Docker daemon available'
    };
    metricsService.setDockerHealth(true);
  } catch (error: any) {
    checks.docker = {
      status: 'error',
      message: 'Docker daemon unavailable',
      details: error.message
    };
    // Docker being down is degraded, not unhealthy (service can still serve API)
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
    metricsService.setDockerHealth(false);
  }

  // Check 3: Memory usage
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  if (heapUsedPercent < 90) {
    checks.memory = {
      status: 'ok',
      message: 'Memory usage normal',
      details: {
        heapUsedPercent: heapUsedPercent.toFixed(2),
        heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2)
      }
    };
  } else {
    checks.memory = {
      status: 'error',
      message: 'Memory usage high',
      details: {
        heapUsedPercent: heapUsedPercent.toFixed(2)
      }
    };
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  }

  // Check 4: WebSocket connections
  const wsConnections = webSocketService.getActiveConnections();
  checks.websocket = {
    status: 'ok',
    message: 'WebSocket server operational',
    details: {
      activeConnections: wsConnections
    }
  };
  metricsService.setActiveConnections(wsConnections);

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks
  };

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;

  res.status(statusCode).json(response);
});

/**
 * GET /health/live
 * 
 * Kubernetes-style liveness probe (alias for /health)
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /metrics
 * 
 * Prometheus metrics endpoint
 * Returns metrics in Prometheus text format
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error: any) {
    console.error('❌ Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message
    });
  }
});

/**
 * GET /metrics/json
 * 
 * Metrics in JSON format (for debugging)
 */
router.get('/metrics/json', async (_req: Request, res: Response) => {
  try {
    const metrics = await metricsService.getMetricsJSON();
    res.json(metrics);
  } catch (error: any) {
    console.error('❌ Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message
    });
  }
});

export default router;


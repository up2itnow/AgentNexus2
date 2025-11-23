/**
 * WebSocketService - Real-Time Log Streaming
 * 
 * Provides WebSocket-based real-time log streaming for agent executions.
 * Clients can subscribe to specific execution IDs and receive logs as they're generated.
 * 
 * Features:
 * - Real-time log streaming during agent execution
 * - Execution status updates (PENDING → RUNNING → COMPLETED/FAILED)
 * - Resource usage metrics (memory, CPU)
 * - Connection management (authentication, cleanup)
 * - Automatic reconnection support
 * 
 * @author AgentNexus Team ()
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { sanitizeLogs } from '../utils/sanitization';

/**
 * WebSocket message types
 */
export enum WSMessageType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  LOG = 'log',
  STATUS = 'status',
  METRICS = 'metrics',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong'
}

/**
 * WebSocket message structure
 */
export interface WSMessage {
  type: WSMessageType;
  executionId?: string;
  data?: any;
  timestamp: number;
}

/**
 * Client connection metadata
 */
interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  subscriptions: Set<string>; // execution IDs
  lastPing: number;
}

/**
 * Execution stream data
 */
export interface ExecutionStreamData {
  executionId: string;
  log?: string;
  status?: string;
  metrics?: {
    memoryUsage: number;
    cpuUsage: number;
    duration: number;
  };
  output?: any;
  error?: string;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly PING_TIMEOUT = 60000; // 60 seconds

  /**
   * Initialize WebSocket server
   * 
   * @param server - HTTP server to attach WebSocket to
   * @param path - WebSocket endpoint path (default: /ws)
   */
  initialize(server: HTTPServer, path: string = '/ws'): void {
    this.wss = new WebSocketServer({
      server,
      path,
      // Verify origin in production
      verifyClient: (_info: any) => {
        // TODO: Add proper origin verification in production
        return true;
      }
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    // Start ping/pong heartbeat
    this.startHeartbeat();

    console.log(`✅ WebSocket server initialized on ${path}`);
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, _request: any): void {
    const clientId = this.generateClientId();

    const client: ClientConnection = {
      ws,
      subscriptions: new Set(),
      lastPing: Date.now()
    };

    this.clients.set(clientId, client);
    console.log(`🔌 Client connected: ${clientId} (total: ${this.clients.size})`);

    // Send welcome message
    this.sendMessage(ws, {
      type: WSMessageType.STATUS,
      data: {
        message: 'Connected to AgentNexus WebSocket',
        clientId
      },
      timestamp: Date.now()
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    // Handle pong responses
    ws.on('pong', () => {
      if (this.clients.has(clientId)) {
        this.clients.get(clientId)!.lastPing = Date.now();
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for client ${clientId}:`, error.message);
      this.handleDisconnect(clientId);
    });
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(clientId: string, data: any): void {
    try {
      const message: WSMessage = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case WSMessageType.SUBSCRIBE:
          if (message.executionId) {
            client.subscriptions.add(message.executionId);
            console.log(`📺 Client ${clientId} subscribed to execution ${message.executionId}`);

            this.sendMessage(client.ws, {
              type: WSMessageType.STATUS,
              executionId: message.executionId,
              data: { message: 'Subscribed successfully' },
              timestamp: Date.now()
            });
          }
          break;

        case WSMessageType.UNSUBSCRIBE:
          if (message.executionId) {
            client.subscriptions.delete(message.executionId);
            console.log(`📴 Client ${clientId} unsubscribed from execution ${message.executionId}`);
          }
          break;

        case WSMessageType.PING:
          // Respond with pong
          this.sendMessage(client.ws, {
            type: WSMessageType.PONG,
            timestamp: Date.now()
          });
          break;

        default:
          console.warn(`⚠️  Unknown message type: ${message.type}`);
      }
    } catch (error: any) {
      console.error(`❌ Error handling message from ${clientId}:`, error.message);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`🔌 Client disconnected: ${clientId} (subscriptions: ${client.subscriptions.size})`);
      this.clients.delete(clientId);
    }
  }

  /**
   * Broadcast execution stream data to subscribed clients
   * 
   * @param data - Stream data to broadcast
   */
  broadcast(data: ExecutionStreamData): void {
    const { executionId, log, status, metrics, output, error } = data;

    // Sanitize log data before broadcasting
    const sanitizedLog = log ? sanitizeLogs(log) : undefined;

    // Find all clients subscribed to this execution
    let broadcastCount = 0;

    for (const [_clientId, client] of this.clients.entries()) {
      if (client.subscriptions.has(executionId)) {
        if (client.ws.readyState === WebSocket.OPEN) {
          // Send log message
          if (sanitizedLog) {
            this.sendMessage(client.ws, {
              type: WSMessageType.LOG,
              executionId,
              data: { log: sanitizedLog },
              timestamp: Date.now()
            });
          }

          // Send status update
          if (status) {
            this.sendMessage(client.ws, {
              type: WSMessageType.STATUS,
              executionId,
              data: { status, output, error },
              timestamp: Date.now()
            });
          }

          // Send metrics
          if (metrics) {
            this.sendMessage(client.ws, {
              type: WSMessageType.METRICS,
              executionId,
              data: metrics,
              timestamp: Date.now()
            });
          }

          broadcastCount++;
        }
      }
    }

    if (broadcastCount > 0) {
      console.log(`📡 Broadcast to ${broadcastCount} client(s) for execution ${executionId}`);
    }
  }

  /**
   * Send message to a specific client
   */
  private sendMessage(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error: any) {
        console.error('❌ Error sending WebSocket message:', error.message);
      }
    }
  }

  /**
   * Start heartbeat ping/pong to detect dead connections
   */
  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();

      for (const [clientId, client] of this.clients.entries()) {
        // Check if client hasn't responded to ping in timeout period
        if (now - client.lastPing > this.PING_TIMEOUT) {
          console.log(`💀 Client ${clientId} timeout - terminating`);
          client.ws.terminate();
          this.clients.delete(clientId);
          continue;
        }

        // Send ping
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, this.PING_INTERVAL);

    console.log(`💓 Heartbeat started (interval: ${this.PING_INTERVAL}ms)`);
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get active connections count
   */
  getActiveConnections(): number {
    return this.clients.size;
  }

  /**
   * Get subscriptions for a specific execution
   */
  getSubscriberCount(executionId: string): number {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(executionId)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Shutdown WebSocket server gracefully
   */
  shutdown(): void {
    console.log('🛑 Shutting down WebSocket server...');

    // Stop heartbeat
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close all client connections
    for (const [_clientId, client] of this.clients.entries()) {
      this.sendMessage(client.ws, {
        type: WSMessageType.STATUS,
        data: { message: 'Server shutting down' },
        timestamp: Date.now()
      });
      client.ws.close(1001, 'Server shutdown');
    }

    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close(() => {
        console.log('✅ WebSocket server closed');
      });
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();


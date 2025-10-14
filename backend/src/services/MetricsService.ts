/**
 * MetricsService - Prometheus Metrics Collection
 * 
 * Collects and exposes application metrics in Prometheus format.
 * Tracks execution metrics, system health, and business KPIs.
 * 
 * Metrics Categories:
 * - Execution metrics (count, duration, success rate)
 * - Resource usage (memory, CPU)
 * - System health (active connections, Docker status)
 * - Business metrics (revenue, agent popularity)
 * 
 * @author AgentNexus Team (Built with AstraForge 5-LLM Collaboration)
 */

import { 
  Registry, 
  Counter, 
  Histogram, 
  Gauge,
  collectDefaultMetrics 
} from 'prom-client';

export class MetricsService {
  private registry: Registry;

  // Execution metrics
  private executionCounter: Counter;
  private executionDurationHistogram: Histogram;
  private executionStatusCounter: Counter;
  
  // Agent metrics
  private agentExecutionsGauge: Gauge;
  private agentRevenueCounter: Counter;
  
  // System metrics
  private activeConnectionsGauge: Gauge;
  private dockerHealthGauge: Gauge;
  
  // Resource metrics
  private containerMemoryGauge: Gauge;
  private containerCpuGauge: Gauge;

  constructor() {
    // Create custom registry
    this.registry = new Registry();

    // Collect default Node.js metrics (memory, CPU, event loop, etc.)
    collectDefaultMetrics({ register: this.registry });

    // Initialize custom metrics
    this.initializeMetrics();

    console.log('📊 Metrics service initialized');
  }

  /**
   * Initialize all custom Prometheus metrics
   */
  private initializeMetrics(): void {
    // Execution counter - total number of executions
    this.executionCounter = new Counter({
      name: 'agentnexus_executions_total',
      help: 'Total number of agent executions',
      labelNames: ['agent_id', 'agent_name', 'user_id'],
      registers: [this.registry]
    });

    // Execution duration histogram - execution time distribution
    this.executionDurationHistogram = new Histogram({
      name: 'agentnexus_execution_duration_seconds',
      help: 'Agent execution duration in seconds',
      labelNames: ['agent_id', 'agent_name', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300], // 0.1s to 5 minutes
      registers: [this.registry]
    });

    // Execution status counter - success/failure tracking
    this.executionStatusCounter = new Counter({
      name: 'agentnexus_execution_status_total',
      help: 'Total number of executions by status',
      labelNames: ['status', 'agent_id'],
      registers: [this.registry]
    });

    // Agent executions gauge - current running executions per agent
    this.agentExecutionsGauge = new Gauge({
      name: 'agentnexus_agent_running_executions',
      help: 'Number of currently running executions per agent',
      labelNames: ['agent_id', 'agent_name'],
      registers: [this.registry]
    });

    // Agent revenue counter - total revenue per agent
    this.agentRevenueCounter = new Counter({
      name: 'agentnexus_agent_revenue_wei',
      help: 'Total revenue generated per agent in Wei',
      labelNames: ['agent_id', 'agent_name'],
      registers: [this.registry]
    });

    // Active WebSocket connections
    this.activeConnectionsGauge = new Gauge({
      name: 'agentnexus_active_websocket_connections',
      help: 'Number of active WebSocket connections',
      registers: [this.registry]
    });

    // Docker health status
    this.dockerHealthGauge = new Gauge({
      name: 'agentnexus_docker_healthy',
      help: 'Docker daemon health status (1 = healthy, 0 = unhealthy)',
      registers: [this.registry]
    });

    // Container memory usage
    this.containerMemoryGauge = new Gauge({
      name: 'agentnexus_container_memory_bytes',
      help: 'Container memory usage in bytes',
      labelNames: ['execution_id', 'agent_id'],
      registers: [this.registry]
    });

    // Container CPU usage
    this.containerCpuGauge = new Gauge({
      name: 'agentnexus_container_cpu_percent',
      help: 'Container CPU usage percentage',
      labelNames: ['execution_id', 'agent_id'],
      registers: [this.registry]
    });
  }

  /**
   * Record a new execution
   */
  recordExecution(agentId: string, agentName: string, userId: string): void {
    this.executionCounter.inc({
      agent_id: agentId,
      agent_name: agentName,
      user_id: userId
    });
  }

  /**
   * Record execution duration
   */
  recordExecutionDuration(
    agentId: string,
    agentName: string,
    status: string,
    durationMs: number
  ): void {
    this.executionDurationHistogram.observe(
      {
        agent_id: agentId,
        agent_name: agentName,
        status
      },
      durationMs / 1000 // Convert to seconds
    );
  }

  /**
   * Record execution status (COMPLETED, FAILED, etc.)
   */
  recordExecutionStatus(status: string, agentId: string): void {
    this.executionStatusCounter.inc({
      status,
      agent_id: agentId
    });
  }

  /**
   * Update running executions count for an agent
   */
  setRunningExecutions(agentId: string, agentName: string, count: number): void {
    this.agentExecutionsGauge.set(
      {
        agent_id: agentId,
        agent_name: agentName
      },
      count
    );
  }

  /**
   * Record revenue for an agent
   */
  recordRevenue(agentId: string, agentName: string, amountWei: string): void {
    this.agentRevenueCounter.inc(
      {
        agent_id: agentId,
        agent_name: agentName
      },
      parseFloat(amountWei)
    );
  }

  /**
   * Update active WebSocket connections count
   */
  setActiveConnections(count: number): void {
    this.activeConnectionsGauge.set(count);
  }

  /**
   * Update Docker health status
   */
  setDockerHealth(healthy: boolean): void {
    this.dockerHealthGauge.set(healthy ? 1 : 0);
  }

  /**
   * Record container memory usage
   */
  recordContainerMemory(executionId: string, agentId: string, bytes: number): void {
    this.containerMemoryGauge.set(
      {
        execution_id: executionId,
        agent_id: agentId
      },
      bytes
    );
  }

  /**
   * Record container CPU usage
   */
  recordContainerCpu(executionId: string, agentId: string, percent: number): void {
    this.containerCpuGauge.set(
      {
        execution_id: executionId,
        agent_id: agentId
      },
      percent
    );
  }

  /**
   * Get metrics in Prometheus format
   * 
   * @returns Prometheus metrics string
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON (for debugging)
   */
  async getMetricsJSON(): Promise<any[]> {
    return this.registry.getMetricsAsJSON();
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.registry.resetMetrics();
  }

  /**
   * Get registry (for custom metric registration)
   */
  getRegistry(): Registry {
    return this.registry;
  }
}

// Export singleton instance
export const metricsService = new MetricsService();


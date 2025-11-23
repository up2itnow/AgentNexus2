/**
 * ExecutionService - Docker-Based Agent Execution Engine
 * 
 * Securely executes AI agents in isolated Docker containers with
 * resource limits, timeout enforcement, and comprehensive monitoring.
 * 
 * Design: 5-LLM Collaborative Consensus (85% agreement)
 * Architecture: Layered service with clear separation of concerns
 * 
 * @author AgentNexus Team ()
 */

import { PrismaClient, Execution, Agent } from '@prisma/client';
import Docker from 'dockerode';
import path from 'path';
import {
  ExecuteAgentDto,
  ExecutionLog,
  DockerError,
  ValidationError,
  NotFoundError,
  ForbiddenError
} from '../types';
import { AgentService } from './AgentService';
import {
  sanitizeInput,
  sanitizeLogs,
  detectInjection,
  createSafeSummary
} from '../utils/sanitization';
import { webSocketService } from './WebSocketService';
import { metricsService } from './MetricsService';
import { AgentAdapter, AgentExecutionRequest } from '../types/agent';
import { AgentZeroAdapter } from './agentZero/AgentZeroAdapter';
import { AgentZeroTierService } from './agentZero/AgentZeroTierService';
import { WalletService } from './WalletService';
import { agentZeroConfig } from '../config/agentZero';

export class ExecutionService {
  private docker: Docker | null = null;
  private readonly defaultTimeout: number = 300000; // 5 minutes
  private readonly maxMemory: number = 512 * 1024 * 1024; // 512MB
  private readonly maxCpuQuota: number = 50000; // 50% of one CPU core

  private adapters: Map<string, AgentAdapter> = new Map();
  private activeContainers: Map<string, string> = new Map(); // executionId -> containerId

  constructor(
    private prisma: PrismaClient,
    private agentService: AgentService
  ) {
    this.initializeDocker();
    this.initializeAdapters();
  }

  private initializeAdapters() {
    if (this.docker) {
      // Initialize Agent Zero Adapter
      const walletService = new WalletService();
      const tierService = new AgentZeroTierService(this.prisma, walletService, agentZeroConfig);
      const agentZeroAdapter = new AgentZeroAdapter(this.docker, this.prisma, tierService, agentZeroConfig);

      this.adapters.set('agent-zero', agentZeroAdapter);
    }
  }

  /**
   * Initialize Docker client with graceful degradation
   */
  private initializeDocker(): void {
    try {
      this.docker = new Docker();
      console.log('✅ Docker initialized successfully');
    } catch (error) {
      console.warn('⚠️  Docker not available - execution features disabled');
      console.warn('   Make sure Docker daemon is running for agent execution');
    }
  }

  /**
   * Execute an AI agent in a secure Docker container
   * 
   * This is the main entry point for agent execution. It orchestrates the entire
   * execution lifecycle from validation through cleanup.
   * 
   * Flow:
   * 1. Validate user entitlement (must own the agent)
   * 2. Retrieve agent metadata and Docker image
   * 3. Create execution record in database (PENDING status)
   * 4. Spin up isolated Docker container with resource limits
   * 5. Stream logs in real-time
   * 6. Capture output and update status (COMPLETED/FAILED)
   * 7. Cleanup container resources
   * 
   * Security Features:
   * - Entitlement verification before execution
   * - Resource limits (512MB RAM, 50% CPU)
   * - Network isolation (bridge mode)
   * - Timeout enforcement (5 min default)
   * - Read-only filesystem
   * - Non-root user execution
   * 
   * @param userId - User requesting execution (must own agent)
   * @param dto - Execution request containing agentId and input data
   * @returns Execution record with status and results
   * @throws ValidationError if input data is invalid
   * @throws NotFoundError if agent doesn't exist
   * @throws ForbiddenError if user doesn't own agent
   * @throws DockerError if container fails to start
   * 
   * @example
   * ```typescript
   * const execution = await executionService.executeAgent('user123', {
   *   agentId: 'agent456',
   *   purchaseId: 'purchase789',
   *   inputData: { query: 'analyze market trends' }
   * });
   * ```
   */
  async executeAgent(
    userId: string,
    dto: ExecuteAgentDto
  ): Promise<Execution> {
    // Step 1: Validate user has purchased agent (check entitlement on-chain or in DB)
    // This prevents unauthorized execution and ensures payment was completed
    await this.validateEntitlement(userId, dto.agentId);

    // 2. Get agent details
    const agent = await this.agentService.getAgentById(dto.agentId);

    // 3. Security: Detect command injection attempts
    const inputStr = JSON.stringify(dto.inputData);
    if (detectInjection(inputStr)) {
      throw new ValidationError('Input contains potential injection attempt');
    }

    // 4. Security: Sanitize input to remove control characters and null bytes
    const sanitizedInput = sanitizeInput(dto.inputData);
    console.log(`🔒 Input sanitized: ${createSafeSummary(sanitizedInput)}`);

    // 5. Validate input data against agent's schema
    this.validateInput(agent, sanitizedInput);

    // 6. Create execution record (status: PENDING)
    const execution = await this.prisma.execution.create({
      data: {
        userId,
        agentId: dto.agentId,
        purchaseId: dto.purchaseId,
        inputData: sanitizedInput as any,
        status: 'PENDING'
      }
    });

    try {
      // 5. Update status to RUNNING
      await this.prisma.execution.update({
        where: { id: execution.id },
        data: { status: 'RUNNING' }
      });

      // 6. WebSocket: Broadcast status update
      webSocketService.broadcast({
        executionId: execution.id,
        status: 'RUNNING'
      });

      // 7. Metrics: Record execution start
      metricsService.recordExecution(agent.id, agent.name, userId);
      metricsService.setRunningExecutions(agent.id, agent.name, 1);

      // 8. Execute
      let output: any;
      let logs: string[] = [];
      let duration = 0;

      // Check if we have a specific adapter for this agent
      const adapter = this.adapters.get(agent.id);

      if (adapter) {
        // Use adapter
        const request: AgentExecutionRequest = {
          userId,
          agentId: agent.id,
          prompt: JSON.stringify(dto.inputData), // Adapter expects prompt string
          inputData: dto.inputData,
          tier: 'BASIC', // Default to basic, entitlement check handles upgrades
        };

        const result = await adapter.execute(request);

        output = result.response ? { message: result.response } : {};
        logs = result.toolsUsed ? [`Tools used: ${result.toolsUsed.join(', ')}`] : [];
        duration = result.executionTime || 0;

        // Add any error to logs if present
        if (result.error) {
          logs.push(`Error: ${result.error}`);
        }
      } else {
        // Fallback to default Docker execution
        const result = await this.runInDocker(
          execution,
          agent,
          dto.inputData
        );
        output = result.output;
        logs = result.logs;
        duration = Date.now() - execution.startTime.getTime();
      }

      // 7. Validate output against agent's schema
      this.validateOutput(agent, output);

      // 8. Calculate execution duration
      // duration is already calculated above

      // 9. Security: Sanitize logs to remove secrets before storing
      const sanitizedLogs = logs.map(log => sanitizeLogs(log));

      // 10. Update execution record (status: COMPLETED)
      const completed = await this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          outputData: output as any,
          logs: JSON.stringify(sanitizedLogs),
          duration,
          endTime: new Date()
        }
      });

      // 11. WebSocket: Broadcast completion
      webSocketService.broadcast({
        executionId: execution.id,
        status: 'COMPLETED',
        output
      });

      // 12. Metrics: Record completion
      metricsService.recordExecutionStatus('COMPLETED', agent.id);
      metricsService.recordExecutionDuration(agent.id, agent.name, 'COMPLETED', duration);
      metricsService.setRunningExecutions(agent.id, agent.name, 0);
      metricsService.recordRevenue(agent.id, agent.name, agent.price.toString());

      // 13. Update agent statistics (total executions, revenue)
      await this.agentService.incrementExecutions(
        agent.id,
        agent.price.toString()
      );

      return completed;

    } catch (error: any) {
      // Handle execution failure
      const duration = Date.now() - execution.startTime.getTime();

      await this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorMessage: this.sanitizeErrorMessage(error),
          duration,
          endTime: new Date()
        }
      });

      // WebSocket: Broadcast failure
      webSocketService.broadcast({
        executionId: execution.id,
        status: 'FAILED',
        error: this.sanitizeErrorMessage(error)
      });

      // Metrics: Record failure
      metricsService.recordExecutionStatus('FAILED', agent.id);
      metricsService.recordExecutionDuration(agent.id, agent.name, 'FAILED', duration);
      metricsService.setRunningExecutions(agent.id, agent.name, 0);

      throw error;
    }
  }

  /**
   * Run agent in Docker container with resource limits and security
   */
  private async runInDocker(
    execution: Execution,
    agent: Agent,
    inputData: any
  ): Promise<{ output: any; logs: string[] }> {
    if (!this.docker) {
      throw new DockerError('Docker not available. Please ensure Docker daemon is running.');
    }

    const logs: string[] = [];
    const startTime = Date.now();

    try {
      // 1. Ensure Docker image is available
      logs.push(`Pulling image: ${agent.dockerImage}`);
      webSocketService.broadcast({
        executionId: execution.id,
        log: `Pulling image: ${agent.dockerImage}`
      });

      await this.ensureImage(agent.dockerImage);

      logs.push(`Image ready: ${agent.dockerImage}`);
      webSocketService.broadcast({
        executionId: execution.id,
        log: `Image ready: ${agent.dockerImage}`
      });

      // 2. Create container with comprehensive security and resource limits
      // Based on 5-LLM Security Expert recommendations
      const container = await this.docker.createContainer({
        Image: agent.dockerImage,

        // Environment variables for agent input
        Env: [
          `INPUT_DATA=${JSON.stringify(inputData)}`,
          `EXECUTION_ID=${execution.id}`,
          `AGENT_ID=${agent.id}`
        ],

        // Host configuration with security hardening
        HostConfig: {
          // RESOURCE LIMITS
          Memory: this.maxMemory,                    // 512MB RAM limit
          MemorySwap: this.maxMemory,                // No swap (prevents OOM bypass)
          CpuQuota: this.maxCpuQuota,                // 50% CPU limit
          CpuPeriod: 100000,                         // CPU quota period (100ms)
          PidsLimit: 100,                            // Prevent fork bombs

          // NETWORK ISOLATION
          NetworkMode: 'none',                       // No network access (security)

          // FILESYSTEM SECURITY
          ReadonlyRootfs: true,                      // Enforce read-only root filesystem
          Tmpfs: {
            '/tmp': 'rw,noexec,nosuid,size=100m'    // Temp dir with restrictions
          },

          // LINUX SECURITY
          SecurityOpt: [
            'no-new-privileges:true',                // Prevent privilege escalation
            `seccomp=${path.join(__dirname, '../../../agent-runtime/security/seccomp-profile.json')}`
          ],
          CapDrop: ['ALL'],                          // Drop all Linux capabilities

          // CLEANUP
          AutoRemove: true,                          // Automatic container cleanup

          // LOGGING
          LogConfig: {
            Type: 'json-file',
            Config: {
              'max-size': '10m',                     // Max log file size
              'max-file': '3'                        // Max number of log files
            }
          }
        },

        // USER SECURITY
        User: '1000:1000',                           // Run as non-root (uid:gid)

        // LABELS FOR TRACKING
        Labels: {
          'com.agentnexus.execution': execution.id,
          'com.agentnexus.agent': agent.id,
          'com.agentnexus.user': execution.userId,
          'com.agentnexus.created': new Date().toISOString()
        },

        // I/O CONFIGURATION
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        OpenStdin: false
      });

      logs.push(`Container created: ${container.id.substring(0, 12)}`);
      this.activeContainers.set(execution.id, container.id);

      // 3. Start container
      await container.start();
      logs.push('Container started');

      // 4. Wait for completion with timeout
      const result = await this.waitForContainer(container, this.defaultTimeout);
      logs.push(...result.logs);

      // 5. Extract output from container
      const output = await this.extractOutput(container, logs);

      // 6. Cleanup (AutoRemove handles this, but be explicit)
      try {
        await container.remove({ force: true });
        this.activeContainers.delete(execution.id);
        logs.push('Container cleaned up');
      } catch (e) {
        // Already auto-removed, that's fine
      }

      const duration = Date.now() - startTime;
      logs.push(`Execution completed in ${(duration / 1000).toFixed(2)}s`);

      return { output, logs };

    } catch (error: any) {
      logs.push(`❌ Error: ${error.message}`);
      throw new DockerError(`Container execution failed: ${error.message}`);
    }
  }

  /**
   * Ensure Docker image is available (pull if needed)
   */
  private async ensureImage(imageName: string): Promise<void> {
    if (!this.docker) return;

    try {
      // Check if image exists locally
      await this.docker.getImage(imageName).inspect();
    } catch (error) {
      // Image not present, pull it
      await new Promise((resolve, reject) => {
        this.docker!.pull(imageName, (err: any, stream: any) => {
          if (err) return reject(err);

          // Follow pull progress
          this.docker!.modem.followProgress(
            stream,
            (err: any) => err ? reject(err) : resolve(null)
          );
        });
      });
    }
  }

  /**
   * Wait for container to finish with timeout enforcement
   */
  private async waitForContainer(
    container: Docker.Container,
    timeout: number
  ): Promise<{ logs: string[] }> {
    const logs: string[] = [];

    return new Promise(async (resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        container.kill().catch(() => { });
        reject(new DockerError(`Execution timeout after ${timeout / 1000}s`));
      }, timeout);

      try {
        // Attach to container logs
        const stream = await container.logs({
          follow: true,
          stdout: true,
          stderr: true
        });

        stream.on('data', (chunk: Buffer) => {
          const log = chunk.toString().trim();
          if (log) logs.push(log);
        });

        // Wait for container to finish
        await container.wait();
        clearTimeout(timer);
        resolve({ logs });

      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Extract output from container
   * 
   * Agents write JSON output to stdout. This method parses the output
   * by finding valid JSON in the logs (typically the last line).
   * 
   * Agent Contract:
   * - Agents write JSON to stdout
   * - Agents write logs to stderr (not captured as output)
   * - Output format: { status: 'success'|'error', ...data }
   * 
   * @param _container - Docker container (unused in current implementation)
   * @param logs - Array of log lines from container stdout/stderr
   * @returns Parsed JSON output from agent
   */
  private async extractOutput(
    _container: Docker.Container,
    logs: string[]
  ): Promise<any> {
    // Try to find JSON output in logs (agents write JSON to stdout)
    // Start from the end since output is usually the last line
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i].trim();

      // Skip empty lines and obvious non-JSON logs (stderr messages)
      if (!log || log.startsWith('🤖') || log.startsWith('✅') || log.startsWith('❌')) {
        continue;
      }

      try {
        // Try to parse as JSON
        const output = JSON.parse(log);

        // Validate it's an object (not just a number or string)
        if (typeof output === 'object' && output !== null) {
          return output;
        }
      } catch (e) {
        // Not valid JSON, try next line
        continue;
      }
    }

    // Fallback: No valid JSON found, return logs as output
    return {
      status: 'completed',
      message: 'No JSON output found from agent',
      logs: logs.join('\n')
    };
  }

  /**
   * Validate user has valid entitlement for agent
   */
  private async validateEntitlement(
    userId: string,
    agentId: string
  ): Promise<void> {
    const entitlement = await this.prisma.entitlement.findFirst({
      where: {
        userId,
        agentId,
        expiresAt: {
          gt: new Date() // Not expired
        }
      }
    });

    if (!entitlement) {
      throw new ForbiddenError('No valid entitlement for this agent. Purchase required.');
    }
  }

  /**
   * Validate input data against agent's input schema
   */
  private validateInput(agent: Agent, inputData: any): void {
    // Basic validation - production would use JSON Schema or Zod
    if (typeof inputData !== 'object' || inputData === null) {
      throw new ValidationError('Input data must be a valid object');
    }

    // Check required fields from agent.inputSchema
    const schema = agent.inputSchema as any;
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in inputData)) {
          throw new ValidationError(`Missing required field: ${field}`);
        }
      }
    }
  }

  /**
   * Validate output data against agent's output schema
   */
  private validateOutput(_agent: Agent, outputData: any): void {
    // Basic validation
    if (typeof outputData !== 'object' || outputData === null) {
      throw new ValidationError('Agent output must be a valid object');
    }

    // Production would validate against agent.outputSchema
  }

  /**
   * Sanitize error messages for user display (remove stack traces)
   */
  /**
   * Sanitize error messages to remove secrets and sensitive data
   * 
   * @param error - Error object or string
   * @returns Sanitized error message safe for storage and display
   */
  private sanitizeErrorMessage(error: any): string {
    let message = '';

    if (typeof error === 'string') {
      message = error;
    } else if (error.message) {
      message = error.message;
    } else {
      message = 'Unknown execution error';
    }

    // Use our comprehensive log sanitization to remove secrets
    return sanitizeLogs(message);
  }

  /**
   * Get execution status and details
   */
  async getExecutionStatus(executionId: string): Promise<Execution> {
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        agent: true,
        user: true,
        purchase: true
      }
    });

    if (!execution) {
      throw new NotFoundError('Execution');
    }

    return execution;
  }

  /**
   * Get execution logs as structured log entries
   */
  async getExecutionLogs(executionId: string): Promise<ExecutionLog[]> {
    const execution = await this.getExecutionStatus(executionId);

    if (!execution.logs) {
      return [];
    }

    try {
      const logs = JSON.parse(execution.logs) as string[];
      return logs.map((message, index) => ({
        timestamp: new Date(execution.startTime.getTime() + index * 1000),
        level: message.includes('❌') || message.includes('Error') ? 'error' :
          message.includes('⚠️') || message.includes('Warning') ? 'warn' : 'info',
        message
      }));
    } catch (error) {
      return [{
        timestamp: execution.startTime,
        level: 'error',
        message: 'Failed to parse logs'
      }];
    }
  }

  /**
   * Cancel a running execution (user must own it)
   */
  async cancelExecution(
    executionId: string,
    userId: string
  ): Promise<void> {
    const execution = await this.getExecutionStatus(executionId);

    // Verify ownership
    if (execution.userId !== userId) {
      throw new ForbiddenError('Cannot cancel execution you do not own');
    }

    // Check if already finished
    if (execution.status === 'COMPLETED' || execution.status === 'FAILED') {
      throw new ValidationError(`Execution already ${execution.status.toLowerCase()}`);
    }

    // Stop running container if exists
    await this.stopContainer(executionId);

    await this.prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        errorMessage: 'Cancelled by user',
        endTime: new Date()
      }
    });
  }

  /**
   * Stop a running container for an execution
   */
  private async stopContainer(executionId: string): Promise<void> {
    const containerId = this.activeContainers.get(executionId);
    if (!containerId || !this.docker) return;

    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      await container.remove({ force: true });
      this.activeContainers.delete(executionId);
      console.log(`Stopped container ${containerId} for execution ${executionId}`);
    } catch (error) {
      console.warn(`Failed to stop container for execution ${executionId}:`, error);
    }
  }

  /**
   * List user's executions with pagination
   */
  async listUserExecutions(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ executions: Execution[]; total: number }> {
    const [executions, total] = await Promise.all([
      this.prisma.execution.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      }),
      this.prisma.execution.count({ where: { userId } })
    ]);

    return { executions, total };
  }

  /**
   * Get execution statistics for an agent
   */
  async getAgentExecutionStats(agentId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    averageDuration: number | null;
  }> {
    const executions = await this.prisma.execution.findMany({
      where: { agentId },
      select: {
        status: true,
        duration: true
      }
    });

    const completed = executions.filter(e => e.status === 'COMPLETED');
    const failed = executions.filter(e => e.status === 'FAILED');

    const avgDuration = completed.length > 0
      ? completed.reduce((sum, e) => sum + (e.duration || 0), 0) / completed.length
      : null;

    return {
      total: executions.length,
      completed: completed.length,
      failed: failed.length,
      averageDuration: avgDuration
    };
  }
}


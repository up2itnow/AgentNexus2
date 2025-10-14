/**
 * Agent Zero Adapter
 * Handles quick execution mode for Basic tier users
 * Manages ephemeral Agent Zero containers for stateless execution
 */

import Docker from 'dockerode';
import { PrismaClient, AgentZeroTier, ExecutionStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import {
  AgentZeroExecuteRequest,
  AgentZeroExecuteResponse,
  AgentZeroConfig,
  AgentZeroMessage,
  AgentZeroRequest,
} from '../../types/agentZero';
import { AgentZeroTierService } from './AgentZeroTierService';

export class AgentZeroAdapter {
  private docker: Docker;
  private prisma: PrismaClient;
  private tierService: AgentZeroTierService;
  private config: AgentZeroConfig;
  private activeContainers: Map<string, { containerId: string; httpClient: AxiosInstance }> = new Map();

  constructor(
    docker: Docker,
    prisma: PrismaClient,
    tierService: AgentZeroTierService,
    config: AgentZeroConfig
  ) {
    this.docker = docker;
    this.prisma = prisma;
    this.tierService = tierService;
    this.config = config;
  }

  /**
   * Execute Agent Zero task (quick execution for Basic tier)
   */
  async execute(request: AgentZeroExecuteRequest): Promise<AgentZeroExecuteResponse> {
    const { userId, prompt, tier = AgentZeroTier.BASIC } = request;
    
    // Verify tier access
    const tierVerification = await this.tierService.verifyTierAccess(userId, tier);
    
    if (!tierVerification.hasAccess) {
      throw new Error(tierVerification.reason || 'Access denied');
    }

    // Create execution record
    const execution = await this.prisma.agentZeroExecution.create({
      data: {
        userId,
        tier,
        prompt,
        status: ExecutionStatus.PENDING,
      },
    });

    try {
      // Update status to RUNNING
      await this.prisma.agentZeroExecution.update({
        where: { id: execution.id },
        data: { status: ExecutionStatus.RUNNING },
      });

      // Spin up ephemeral container
      const container = await this.createQuickExecutionContainer(userId, tier);
      
      // Execute prompt
      const startTime = Date.now();
      const timeout = tier === AgentZeroTier.BASIC ? this.config.basicTimeout : this.config.proTimeout;
      
      const result = await this.sendPromptToContainer(container, prompt, timeout);
      const executionTime = Date.now() - startTime;

      // Clean up container
      await this.cleanupContainer(container.containerId);

      // Update execution record
      await this.prisma.agentZeroExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.COMPLETED,
          response: result.response,
          toolsUsed: result.toolsUsed,
          tokensUsed: result.tokensUsed,
          executionTime,
          completedAt: new Date(),
        },
      });

      return {
        executionId: execution.id,
        status: 'completed',
        response: result.response,
        toolsUsed: result.toolsUsed,
        tokensUsed: result.tokensUsed,
        executionTime,
      };

    } catch (error) {
      // Update execution record with error
      await this.prisma.agentZeroExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Create ephemeral Agent Zero container for quick execution
   */
  private async createQuickExecutionContainer(
    userId: string,
    tier: AgentZeroTier
  ): Promise<{ containerId: string; httpClient: AxiosInstance }> {
    try {
      const containerName = `agent-zero-quick-${userId}-${Date.now()}`;
      const image = this.config.quickImage;

      // Pull image if not exists
      await this.pullImageIfNeeded(image);

      // Resource limits based on tier
      const limits = this.tierService.getTierLimits(tier);
      const memoryInBytes = this.parseMemoryString(limits.resources.memory);
      const cpuShares = Math.floor(parseFloat(limits.resources.cpu) * 1024);

      // Create container
      const container = await this.docker.createContainer({
        Image: image,
        name: containerName,
        Env: [
          `AGENT_ZERO_MODE=quick`,
          `USER_ID=${userId}`,
          `TIER=${tier}`,
          `TIMEOUT=${limits.timeout}`,
          // API keys from environment (passed through securely)
          `OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}`,
          `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}`,
        ],
        ExposedPorts: {
          '80/tcp': {},
        },
        HostConfig: {
          Memory: memoryInBytes,
          CpuShares: cpuShares,
          NetworkMode: 'bridge',
          AutoRemove: false, // We'll remove manually after execution
          SecurityOpt: ['no-new-privileges:true'],
          ReadonlyRootfs: false, // Agent Zero needs to write temp files
          Tmpfs: {
            '/tmp': 'rw,noexec,nosuid,size=512m',
          },
        },
        User: '1000:1000',
        WorkingDir: '/app',
      });

      // Start container
      await container.start();

      // Wait for container to be ready
      const containerInfo = await container.inspect();
      const ipAddress = containerInfo.NetworkSettings.IPAddress;

      if (!ipAddress) {
        throw new Error('Failed to get container IP address');
      }

      // Create HTTP client for communication
      const httpClient = axios.create({
        baseURL: `http://${ipAddress}:80`,
        timeout: limits.timeout,
      });

      // Wait for service to be ready
      await this.waitForContainerReady(httpClient);

      const result = {
        containerId: container.id,
        httpClient,
      };

      this.activeContainers.set(container.id, result);
      
      return result;

    } catch (error) {
      console.error('Error creating quick execution container:', error);
      throw new Error(`Failed to create container: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send prompt to Agent Zero container
   */
  private async sendPromptToContainer(
    container: { containerId: string; httpClient: AxiosInstance },
    prompt: string,
    timeout: number
  ): Promise<{ response: string; toolsUsed?: string[]; tokensUsed?: number }> {
    try {
      // Format request for Agent Zero API
      const request: AgentZeroRequest = {
        messages: [
          { role: 'user', content: prompt },
        ],
        settings: {
          temperature: 0.7,
          max_tokens: 4096,
        },
      };

      // Send to container
      const response = await container.httpClient.post('/api/chat', request, {
        timeout,
      });

      return {
        response: response.data.message || response.data.content || '',
        toolsUsed: response.data.tools_used || [],
        tokensUsed: response.data.tokens_used,
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Execution timeout');
        }
        throw new Error(`Container communication error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Wait for container to be ready
   */
  private async waitForContainerReady(httpClient: AxiosInstance, maxRetries = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await httpClient.get('/health');
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error('Container failed to become ready');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Clean up container after execution
   */
  private async cleanupContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      
      try {
        await container.stop({ t: 5 });
      } catch (stopError) {
        console.log('Container already stopped or error stopping:', stopError);
      }
      
      try {
        await container.remove({ force: true });
      } catch (removeError) {
        console.error('Error removing container:', removeError);
      }

      this.activeContainers.delete(containerId);
    } catch (error) {
      console.error('Error during container cleanup:', error);
    }
  }

  /**
   * Pull Docker image if not present
   */
  private async pullImageIfNeeded(image: string): Promise<void> {
    try {
      await this.docker.getImage(image).inspect();
    } catch (error) {
      // Image doesn't exist, pull it
      console.log(`Pulling Agent Zero image: ${image}`);
      await new Promise((resolve, reject) => {
        this.docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) {
            reject(err);
            return;
          }
          this.docker.modem.followProgress(stream, (err: Error | null, output: any[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(output);
            }
          });
        });
      });
    }
  }

  /**
   * Parse memory string to bytes
   */
  private parseMemoryString(memory: string): number {
    const units: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
    };

    const match = memory.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
    if (!match) {
      throw new Error(`Invalid memory format: ${memory}`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return Math.floor(value * units[unit]);
  }

  /**
   * Clean up all active containers (called on shutdown)
   */
  async cleanup(): Promise<void> {
    console.log(`Cleaning up ${this.activeContainers.size} active containers`);
    
    const cleanupPromises = Array.from(this.activeContainers.keys()).map(
      containerId => this.cleanupContainer(containerId)
    );
    
    await Promise.all(cleanupPromises);
  }
}


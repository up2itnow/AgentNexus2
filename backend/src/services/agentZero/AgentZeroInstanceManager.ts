/**
 * Agent Zero Instance Manager
 * Manages persistent Agent Zero containers for Pro tier users
 */

import Docker from 'dockerode';
import { PrismaClient, AgentZeroTier, AgentZeroStatus } from '@prisma/client';
import axios from 'axios';
import {
  CreateInstanceRequest,
  CreateInstanceResponse,
  InstanceStatusResponse,
  AgentZeroConfig,
  ContainerInfo,
} from '../../types/agentZero';
import { AgentZeroTierService } from './AgentZeroTierService';

export class AgentZeroInstanceManager {
  private docker: Docker;
  private prisma: PrismaClient;
  private tierService: AgentZeroTierService;
  private config: AgentZeroConfig;
  private instances: Map<string, ContainerInfo> = new Map();

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
   * Create a new persistent Agent Zero instance for a Pro user
   */
  async createInstance(request: CreateInstanceRequest): Promise<CreateInstanceResponse> {
    const { userId, tier } = request;

    // Verify Pro tier access
    if (tier === AgentZeroTier.PRO) {
      const tierVerification = await this.tierService.verifyTierAccess(userId, tier);
      if (!tierVerification.hasAccess) {
        throw new Error(tierVerification.reason || 'Pro tier access required');
      }
    }

    // Check if user already has an instance
    const existingInstance = await this.prisma.agentZeroInstance.findFirst({
      where: { userId, status: { notIn: [AgentZeroStatus.DELETED, AgentZeroStatus.ERROR] } }
    });

    if (existingInstance) {
      throw new Error('User already has an active Agent Zero instance');
    }

    try {
      // Create instance record
      const instance = await this.prisma.agentZeroInstance.create({
        data: {
          userId,
          containerId: '', // Will be updated after container creation
          status: AgentZeroStatus.CREATING,
          tier,
        },
      });

      // Create Docker container
      const containerInfo = await this.createPersistentContainer(userId, instance.id, tier);

      // Update instance with container info
      await this.prisma.agentZeroInstance.update({
        where: { id: instance.id },
        data: {
          containerId: containerInfo.containerId,
          status: AgentZeroStatus.RUNNING,
          tunnelUrl: containerInfo.tunnelUrl,
          internalPort: containerInfo.internalPort,
          memoryPath: containerInfo.memoryPath,
        },
      });

      this.instances.set(containerInfo.containerId, containerInfo);

      return {
        instanceId: instance.id,
        containerId: containerInfo.containerId,
        status: AgentZeroStatus.RUNNING,
        tunnelUrl: containerInfo.tunnelUrl,
      };
    } catch (error) {
      console.error('Error creating instance:', error);
      throw new Error(`Failed to create instance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create persistent Docker container for Pro tier
   */
  private async createPersistentContainer(
    userId: string,
    instanceId: string,
    tier: AgentZeroTier
  ): Promise<ContainerInfo> {
    const containerName = `agent-zero-${tier.toLowerCase()}-${userId}-${instanceId}`;
    const image = this.config.fullImage;
    const limits = this.tierService.getTierLimits(tier);

    // Pull image if needed
    await this.pullImageIfNeeded(image);

    // Create volume for persistent memory
    const volumeName = `agent-zero-memory-${instanceId}`;
    await this.docker.createVolume({ Name: volumeName });

    const memoryInBytes = this.parseMemoryString(limits.resources.memory);
    const cpuShares = Math.floor(parseFloat(limits.resources.cpu) * 1024);

    // Create container
    const container = await this.docker.createContainer({
      Image: image,
      name: containerName,
      Env: [
        `AGENT_ZERO_MODE=persistent`,
        `USER_ID=${userId}`,
        `INSTANCE_ID=${instanceId}`,
        `TIER=${tier}`,
        `OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}`,
        `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}`,
      ],
      ExposedPorts: {
        '50001/tcp': {}, // Agent Zero WebUI
      },
      HostConfig: {
        Memory: memoryInBytes,
        CpuShares: cpuShares,
        NetworkMode: 'bridge',
        RestartPolicy: { Name: 'unless-stopped' },
        SecurityOpt: ['no-new-privileges:true'],
        Binds: [
          `${volumeName}:/app/memory`, // Persistent memory
          `${volumeName}-logs:/app/logs`, // Persistent logs
        ],
        PortBindings: {
          '50001/tcp': [{ HostPort: '0' }], // Auto-assign host port
        },
      },
      User: '1000:1000',
      WorkingDir: '/app',
    });

    // Start container
    await container.start();

    // Get assigned port
    const containerInfo = await container.inspect();
    const hostPort = parseInt(containerInfo.NetworkSettings.Ports['50001/tcp']?.[0]?.HostPort || '50001');

    // Generate tunnel URL (in production, use ngrok/cloudflare tunnel)
    const tunnelUrl = await this.createTunnel(hostPort, instanceId);

    return {
      containerId: container.id,
      status: 'running',
      internalPort: hostPort,
      tunnelUrl,
      memoryPath: `/app/memory`,
    };
  }

  /**
   * Get instance status
   */
  async getInstanceStatus(userId: string): Promise<InstanceStatusResponse | null> {
    const instance = await this.prisma.agentZeroInstance.findFirst({
      where: { userId, status: { notIn: [AgentZeroStatus.DELETED] } },
    });

    if (!instance) {
      return null;
    }

    // Get container stats
    let resourceUsage = { memory: instance.memoryLimit, storage: Number(instance.storageUsed) };

    try {
      const container = this.docker.getContainer(instance.containerId);
      const stats = await container.stats({ stream: false });
      const memoryUsage = Math.round((stats.memory_stats.usage / stats.memory_stats.limit) * 100);
      resourceUsage.memory = `${memoryUsage}%`;
    } catch (error) {
      console.error('Error getting container stats:', error);
    }

    return {
      instanceId: instance.id,
      status: instance.status,
      tunnelUrl: instance.tunnelUrl || undefined,
      tier: instance.tier,
      totalExecutions: instance.totalExecutions,
      lastAccessedAt: instance.lastAccessedAt,
      expiresAt: instance.expiresAt || undefined,
      resourceUsage,
    };
  }

  /**
   * Stop instance
   */
  async stopInstance(userId: string): Promise<void> {
    const instance = await this.prisma.agentZeroInstance.findFirst({
      where: { userId, status: AgentZeroStatus.RUNNING },
    });

    if (!instance) {
      throw new Error('No running instance found');
    }

    const container = this.docker.getContainer(instance.containerId);
    await container.stop();

    await this.prisma.agentZeroInstance.update({
      where: { id: instance.id },
      data: { status: AgentZeroStatus.STOPPED },
    });
  }

  /**
   * Start instance
   */
  async startInstance(userId: string): Promise<void> {
    const instance = await this.prisma.agentZeroInstance.findFirst({
      where: { userId, status: AgentZeroStatus.STOPPED },
    });

    if (!instance) {
      throw new Error('No stopped instance found');
    }

    const container = this.docker.getContainer(instance.containerId);
    await container.start();

    await this.prisma.agentZeroInstance.update({
      where: { id: instance.id },
      data: { status: AgentZeroStatus.RUNNING, lastAccessedAt: new Date() },
    });
  }

  /**
   * Delete instance
   */
  async deleteInstance(userId: string): Promise<void> {
    const instance = await this.prisma.agentZeroInstance.findFirst({
      where: { userId },
    });

    if (!instance) {
      throw new Error('No instance found');
    }

    try {
      const container = this.docker.getContainer(instance.containerId);
      await container.stop({ t: 10 });
      await container.remove({ force: true });
    } catch (error) {
      console.error('Error removing container:', error);
    }

    await this.prisma.agentZeroInstance.update({
      where: { id: instance.id },
      data: { status: AgentZeroStatus.DELETED },
    });
  }

  /**
   * Create tunnel for external access (placeholder)
   */
  private async createTunnel(port: number, instanceId: string): Promise<string> {
    // In production, use ngrok, cloudflare tunnel, or traefik
    // For now, return local URL
    return `http://localhost:${port}`;
  }

  /**
   * Pull Docker image if not present
   */
  private async pullImageIfNeeded(image: string): Promise<void> {
    try {
      await this.docker.getImage(image).inspect();
    } catch (error) {
      console.log(`Pulling Agent Zero image: ${image}`);
      await new Promise((resolve, reject) => {
        this.docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) {
            reject(err);
            return;
          }
          this.docker.modem.followProgress(stream, (err: Error | null) => {
            if (err) reject(err);
            else resolve(null);
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
      'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024,
    };
    const match = memory.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
    if (!match) throw new Error(`Invalid memory format: ${memory}`);
    return Math.floor(parseFloat(match[1]) * units[match[2].toUpperCase()]);
  }
}


import { PostHog } from 'posthog-node';

export interface UserEvent {
  userId: string;
  eventType: string;
  properties: Record<string, any>;
  timestamp?: Date;
}

export interface AgentExecution {
  executionId: string;
  agentId: string;
  userId: string;
  input: any;
  output: any;
  duration: number;
  success: boolean;
  error?: string;
  chain?: string;
  gasUsed?: number;
  cost?: number;
  timestamp?: Date;
}

export class AnalyticsService {
  private posthog: PostHog;

  constructor(apiKey?: string, host?: string) {
    this.posthog = new PostHog(
      apiKey || process.env.POSTHOG_API_KEY || 'phc_placeholder',
      {
        host: host || process.env.POSTHOG_HOST || 'https://app.posthog.com',
        requestTimeout: 10000,
        maxCacheSize: 1000,
      }
    );
  }

  /**
   * Track user events for analytics
   */
  async trackUserEvent(event: UserEvent): Promise<void> {
    try {
      const eventData = {
        distinctId: event.userId,
        event: event.eventType,
        properties: {
          ...event.properties,
          timestamp: event.timestamp || new Date(),
          source: 'agentnexus-backend',
        },
      };

      await this.posthog.capture(eventData);

      // Also log to console for debugging
      console.log(`[Analytics] User Event: ${event.eventType}`, eventData);
    } catch (error) {
      console.error('Failed to track user event:', error);
      // Don't throw - analytics should not break the application
    }
  }

  /**
   * Track agent execution metrics
   */
  async trackAgentExecution(execution: AgentExecution): Promise<void> {
    try {
      const eventData = {
        distinctId: execution.agentId,
        event: 'agent_execution',
        properties: {
          executionId: execution.executionId,
          userId: execution.userId,
          duration: execution.duration,
          success: execution.success,
          error: execution.error,
          chain: execution.chain,
          gasUsed: execution.gasUsed,
          cost: execution.cost,
          timestamp: execution.timestamp || new Date(),
          source: 'agentnexus-backend',
        },
      };

      await this.posthog.capture(eventData);

      // Track user-specific events for funnel analysis
      await this.trackUserEvent({
        userId: execution.userId,
        eventType: execution.success ? 'agent_execution_success' : 'agent_execution_failure',
        properties: {
          agentId: execution.agentId,
          duration: execution.duration,
          chain: execution.chain,
          cost: execution.cost,
        },
      });

      console.log(`[Analytics] Agent Execution: ${execution.success ? 'SUCCESS' : 'FAILURE'}`, eventData);
    } catch (error) {
      console.error('Failed to track agent execution:', error);
      // Don't throw - analytics should not break the application
    }
  }

  /**
   * Track wallet creation events
   */
  async trackWalletCreation(userId: string, walletAddress: string, chainId: number): Promise<void> {
    await this.trackUserEvent({
      userId,
      eventType: 'wallet_created',
      properties: {
        walletAddress,
        chainId,
        method: 'email_to_wallet',
      },
    });
  }

  /**
   * Track agent deployment events
   */
  async trackAgentDeployment(agentId: string, deployerId: string, chainId: number): Promise<void> {
    await this.posthog.capture({
      distinctId: agentId,
      event: 'agent_deployed',
      properties: {
        deployerId,
        chainId,
        timestamp: new Date(),
        source: 'agentnexus-backend',
      },
    });
  }

  /**
   * Track grant milestone progress
   */
  async trackGrantMilestone(grantId: string, milestone: string, status: 'completed' | 'in_progress' | 'failed'): Promise<void> {
    await this.posthog.capture({
      distinctId: 'grant-tracker',
      event: 'grant_milestone',
      properties: {
        grantId,
        milestone,
        status,
        timestamp: new Date(),
        source: 'agentnexus-backend',
      },
    });
  }

  /**
   * Identify user properties for cohort analysis
   */
  async identifyUser(userId: string, properties: Record<string, any>): Promise<void> {
    try {
      await this.posthog.identify({
        distinctId: userId,
        properties: {
          ...properties,
          lastSeen: new Date(),
          source: 'agentnexus-backend',
        },
      });
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  /**
   * Track funnel conversion events for KPI monitoring
   */
  async trackFunnelEvent(userId: string, funnelStep: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackUserEvent({
      userId,
      eventType: `funnel_${funnelStep}`,
      properties: {
        funnelStep,
        ...properties,
      },
    });
  }

  /**
   * Get analytics dashboard data (for internal use)
   */
  async getDashboardData(timeRange: string = '7d'): Promise<any> {
    try {
      // In a real implementation, this would query PostHog API for dashboard data
      // For now, return mock data structure
      return {
        timeRange,
        userMetrics: {
          totalUsers: 0,
          newUsers: 0,
          activeUsers: 0,
          retentionRate: 0,
        },
        agentMetrics: {
          totalExecutions: 0,
          successfulExecutions: 0,
          averageExecutionTime: 0,
          topAgents: [],
        },
        funnelMetrics: {
          signupToWallet: 0,
          walletToFirstExecution: 0,
        },
        grantMetrics: {
          milestonesCompleted: 0,
          currentPhase: 'week1',
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Flush any pending analytics events
   */
  async flush(): Promise<void> {
    try {
      await this.posthog.flush();
    } catch (error) {
      console.error('Failed to flush analytics:', error);
    }
  }

  /**
   * Shutdown analytics service
   */
  async shutdown(): Promise<void> {
    try {
      await this.posthog.shutdown();
    } catch (error) {
      console.error('Failed to shutdown analytics:', error);
    }
  }
}

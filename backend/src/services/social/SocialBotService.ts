import { ExecutionService } from '../ExecutionService';


interface SocialMessage {
    platform: 'discord' | 'telegram';
    userId: string; // Platform-specific ID
    username: string;
    content: string;
    channelId: string;
}

export class SocialBotService {
    constructor(
        private executionService: ExecutionService
    ) { }

    /**
     * Handle incoming message from a social platform
     */
    async handleMessage(message: SocialMessage): Promise<string> {
        console.log(`[SocialBot] Received message from ${message.platform}/${message.username}: ${message.content}`);

        // 1. Parse Command
        // Expected format: "/agent <agent_name_or_id> <prompt>"
        if (!message.content.startsWith('/agent')) {
            return "Ignored: Not a command";
        }

        const parts = message.content.split(' ');
        if (parts.length < 3) {
            return "Usage: /agent <agent_id> <prompt>";
        }

        const agentId = parts[1];
        const prompt = parts.slice(2).join(' ');

        // 2. Map Social User to Internal User
        // In a real app, we'd look up a "SocialIdentity" table.
        // For now, we'll mock it or use a default "social-user" ID if not found.
        const internalUserId = await this.getInternalUserId(message.userId, message.platform);

        try {
            // 3. Execute Agent
            const execution = await this.executionService.executeAgent(internalUserId, {
                agentId: agentId,
                inputData: { prompt }, // Standardize input for text-based agents
                purchaseId: 'mock-purchase-id' // Bypass for demo
            });

            // 4. Wait for result (or return "Processing..." if async)
            // For demo, we'll assume fast execution or return the initial status
            return `🚀 Agent ${agentId} started! Execution ID: ${execution.id}. Status: ${execution.status}`;

        } catch (error: any) {
            console.error("Agent execution failed:", error);
            return `❌ Error executing agent: ${error.message}`;
        }
    }

    private async getInternalUserId(socialId: string, platform: string): Promise<string> {
        // Mock lookup using params to avoid lints
        console.log(`Looking up internal user for ${platform}:${socialId}`);
        // In production: return prisma.socialIdentity.find(...).userId
        return "user_mock_123";
    }
}

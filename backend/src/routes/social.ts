import { Router, Request, Response } from 'express';
import { SocialBotService } from '../services/social/SocialBotService';
import { ExecutionService } from '../services/ExecutionService';
import { AgentService } from '../services/AgentService';
import { prisma } from '../index';

const router: Router = Router();

// Initialize services
// In a real app, these should be singletons or injected
const agentService = new AgentService(prisma);
const executionService = new ExecutionService(prisma, agentService);
const socialBotService = new SocialBotService(executionService);

/**
 * Webhook endpoint for social platforms (Discord/Telegram)
 * POST /api/social/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const { platform, userId, username, content, channelId } = req.body;

        if (!platform || !content || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const response = await socialBotService.handleMessage({
            platform,
            userId,
            username,
            content,
            channelId
        });

        return res.json({ status: 'success', response });
    } catch (error: any) {
        console.error('Social webhook error:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;

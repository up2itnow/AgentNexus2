import express, { Request, Response } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;

// --- Configuration ---
// In production, these would come from env vars or a secure vault
const MOCK_TWITTER_CLIENT = {
    v2: {
        tweet: async (text: string) => {
            console.log(`[Twitter Mock] Tweeting: "${text}"`);
            return { data: { id: Math.floor(Math.random() * 1000000).toString(), text } };
        },
        me: async () => {
            return { data: { id: '12345', username: 'AgentNexusBot' } };
        }
    }
};

// --- Types ---
interface AgentInput {
    action: 'post_tweet' | 'boost_post' | 'analyze_sentiment';
    content?: string; // For tweets
    tweetId?: string; // For boosting
    budget?: string;  // For boosting (in ETH/USDC)
}

// --- Services ---

class SocialService {
    private client: any;

    constructor() {
        // Use real client if keys exist, otherwise mock
        if (process.env.TWITTER_API_KEY) {
            this.client = new TwitterApi({
                appKey: process.env.TWITTER_API_KEY!,
                appSecret: process.env.TWITTER_API_SECRET!,
                accessToken: process.env.TWITTER_ACCESS_TOKEN!,
                accessSecret: process.env.TWITTER_ACCESS_SECRET!,
            });
        } else {
            console.warn("⚠️ No Twitter keys found. Using Mock Client.");
            this.client = MOCK_TWITTER_CLIENT;
        }
    }

    async postTweet(content: string) {
        try {
            const result = await this.client.v2.tweet(content);
            return { success: true, tweetId: result.data.id, url: `https://twitter.com/user/status/${result.data.id}` };
        } catch (error: any) {
            console.error("Twitter Error:", error);
            throw new Error(`Failed to post tweet: ${error.message}`);
        }
    }
}

class CryptoService {
    async boostPost(tweetId: string, amount: string) {
        console.log(`[Crypto Mock] Boosting tweet ${tweetId} with budget ${amount} ETH`);

        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real scenario, this would:
        // 1. Create a transaction to a marketing agency wallet
        // 2. Sign it with the agent's Session Key
        // 3. Broadcast to network

        return {
            success: true,
            txHash: "0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
            amount,
            target: "MarketingDAO_Wallet"
        };
    }
}

// --- Agent Logic ---

const socialService = new SocialService();
const cryptoService = new CryptoService();

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', agent: 'social-growth-manager' });
});

app.post('/execute', async (req: Request, res: Response) => {
    try {
        const input: AgentInput = req.body.input || req.body;
        console.log("Received command:", input);

        let result;

        switch (input.action) {
            case 'post_tweet':
                if (!input.content) throw new Error("Content required for post_tweet");
                result = await socialService.postTweet(input.content);
                break;

            case 'boost_post':
                if (!input.tweetId || !input.budget) throw new Error("TweetId and Budget required for boost_post");
                result = await cryptoService.boostPost(input.tweetId, input.budget);
                break;

            case 'analyze_sentiment':
                // Mock analysis
                result = { sentiment: 'positive', score: 0.85, notes: "Audience is reacting well to recent crypto news." };
                break;

            default:
                throw new Error(`Unknown action: ${input.action}`);
        }

        res.json({
            status: 'success',
            data: result
        });

    } catch (error: any) {
        console.error("Execution failed:", error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Social Growth Manager running on port ${PORT}`);
});

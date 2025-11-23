import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;

// --- Types ---
interface AgentInput {
    action: 'monitor_portfolio' | 'emergency_exit';
    portfolio?: {
        assets: string[]; // e.g., ['ETH', 'USDC']
        thresholds: Record<string, number>; // e.g., { 'ETH': 1500 } (Sell if below 1500)
    };
    targetAsset?: string; // For emergency exit
}

// --- Services ---

class PriceService {
    // Mock price feed
    async getPrice(asset: string): Promise<number> {
        // Simulate price fluctuation
        const basePrice = asset === 'ETH' ? 2000 : 1;
        const fluctuation = (Math.random() - 0.5) * 100; // +/- 50
        return basePrice + fluctuation;
    }
}

class TransactionService {
    async executeSwap(asset: string, amount: string = 'MAX') {
        console.log(`[DeFi Mock] Executing EMERGENCY EXIT for ${asset}`);

        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            success: true,
            txHash: "0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
            action: `Swapped ${amount} ${asset} to USDC`,
            timestamp: new Date().toISOString()
        };
    }
}

// --- Agent Logic ---

const priceService = new PriceService();
const transactionService = new TransactionService();

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', agent: 'defi-sentinel' });
});

app.post('/execute', async (req: Request, res: Response) => {
    try {
        const input: AgentInput = req.body.input || req.body;
        console.log("Received command:", input);

        let result;

        switch (input.action) {
            case 'monitor_portfolio':
                if (!input.portfolio) throw new Error("Portfolio config required for monitoring");

                const report: any = {};
                const alerts: string[] = [];

                for (const asset of input.portfolio.assets) {
                    const price = await priceService.getPrice(asset);
                    report[asset] = price;

                    const threshold = input.portfolio.thresholds[asset];
                    if (threshold && price < threshold) {
                        alerts.push(`ALERT: ${asset} price ${price.toFixed(2)} is below threshold ${threshold}`);
                        // In a real autonomous agent, this would TRIGGER the emergency exit automatically
                        // For safety in this demo, we just report the alert
                    }
                }

                result = { report, alerts, status: alerts.length > 0 ? 'RISK_DETECTED' : 'SAFE' };
                break;

            case 'emergency_exit':
                if (!input.targetAsset) throw new Error("Target asset required for emergency exit");
                result = await transactionService.executeSwap(input.targetAsset);
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
    console.log(`DeFi Sentinel running on port ${PORT}`);
});

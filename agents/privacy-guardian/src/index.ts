import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;

// --- Types ---
interface AgentInput {
    action: 'simulate_transaction' | 'check_allowances' | 'privacy_audit';
    transaction?: {
        to: string;
        data: string;
        value: string;
    };
    walletAddress?: string;
}

// --- Services ---

class SecurityService {
    // Mock simulation engine (like Tenderly or Fire)
    async simulateTransaction(tx: any) {
        console.log(`[Privacy Guardian] Simulating transaction to ${tx.to}`);

        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock logic: Flag if interacting with a known "malicious" address
        const isMalicious = tx.to.toLowerCase().includes('dead'); // Simple mock check

        if (isMalicious) {
            return {
                status: 'DANGER',
                riskScore: 95,
                warnings: ['Interacting with a flagged phishing contract', 'High probability of asset drain']
            };
        }

        return {
            status: 'SAFE',
            riskScore: 5,
            simulationResult: 'Success: 0.05 ETH transferred'
        };
    }

    async checkAllowances(address: string) {
        console.log(`[Privacy Guardian] Scanning allowances for ${address}`);

        // Mock data
        return {
            totalApprovals: 12,
            atRisk: 2,
            details: [
                { token: 'USDC', spender: '0xUniswapRouter', amount: 'Unlimited', risk: 'Low' },
                { token: 'WETH', spender: '0xUnknownContract', amount: 'Unlimited', risk: 'High' } // Flagged
            ]
        };
    }
}

class PrivacyService {
    async auditWallet(address: string) {
        return {
            score: 72,
            recommendations: [
                "Use a mixer (e.g., Tornado Cash) for your next withdrawal to break linkability.",
                "Revoke 2 high-risk allowances.",
                "Rotate your session keys - they are >30 days old."
            ]
        };
    }
}

// --- Agent Logic ---

const securityService = new SecurityService();
const privacyService = new PrivacyService();

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', agent: 'privacy-guardian' });
});

app.post('/execute', async (req: Request, res: Response) => {
    try {
        const input: AgentInput = req.body.input || req.body;
        console.log("Received command:", input);

        let result;

        switch (input.action) {
            case 'simulate_transaction':
                if (!input.transaction) throw new Error("Transaction details required for simulation");
                result = await securityService.simulateTransaction(input.transaction);
                break;

            case 'check_allowances':
                if (!input.walletAddress) throw new Error("Wallet address required for allowance check");
                result = await securityService.checkAllowances(input.walletAddress);
                break;

            case 'privacy_audit':
                if (!input.walletAddress) throw new Error("Wallet address required for privacy audit");
                result = await privacyService.auditWallet(input.walletAddress);
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
    console.log(`Web3 Privacy Guardian running on port ${PORT}`);
});

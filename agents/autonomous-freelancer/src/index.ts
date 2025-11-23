import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;

// --- Types ---
interface AgentInput {
    action: 'perform_task' | 'check_status';
    taskType?: 'research' | 'data_analysis' | 'content_generation';
    taskDetails?: string;
    taskId?: string;
}

interface AP2Invoice {
    type: 'payment_mandate';
    id: string;
    amount: string;
    currency: string;
    recipient: string;
    description: string;
    status: 'pending' | 'paid';
}

// --- Services ---

class TaskService {
    async performTask(type: string, details: string) {
        console.log(`[Freelancer] Starting task: ${type} - ${details}`);

        // Simulate work duration
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = `Completed ${type} task. Summary: Found 5 key competitors for "${details}".`;

        return {
            taskId: uuidv4(),
            status: 'completed',
            result,
            price: '0.05' // ETH
        };
    }
}

class AP2Service {
    generateInvoice(taskId: string, amount: string, description: string): AP2Invoice {
        return {
            type: 'payment_mandate',
            id: uuidv4(),
            amount,
            currency: 'ETH',
            recipient: process.env.AGENT_WALLET || '0xFreelancerWallet',
            description: `Invoice for Task ${taskId}: ${description}`,
            status: 'pending'
        };
    }
}

// --- Agent Logic ---

const taskService = new TaskService();
const ap2Service = new AP2Service();

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', agent: 'autonomous-freelancer' });
});

app.post('/execute', async (req: Request, res: Response) => {
    try {
        const input: AgentInput = req.body.input || req.body;
        console.log("Received command:", input);

        let result;

        switch (input.action) {
            case 'perform_task':
                if (!input.taskType || !input.taskDetails) throw new Error("Task type and details required");

                // 1. Perform the work
                const workResult = await taskService.performTask(input.taskType, input.taskDetails);

                // 2. Generate Invoice (AP2)
                const invoice = ap2Service.generateInvoice(
                    workResult.taskId,
                    workResult.price,
                    `Service fee for ${input.taskType}`
                );

                result = {
                    work: workResult,
                    invoice,
                    message: "Task completed. Please pay the attached invoice to release full report."
                };
                break;

            case 'check_status':
                // Mock status check
                result = { status: 'idle', activeTasks: 0 };
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
    console.log(`Autonomous Freelancer running on port ${PORT}`);
});

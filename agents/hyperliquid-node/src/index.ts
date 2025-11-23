import express from 'express';
import { randomUUID } from 'crypto';

const app = express();
app.use(express.json());

// --- Types ---
interface OrderRequest {
  coin: string;
  is_buy: boolean;
  sz: number;
  limit_px: number;
  order_type: { limit: { tif: 'Gtc' } };
  reduce_only: boolean;
}

interface OrderResponse {
  status: 'ok' | 'err';
  response: {
    type: 'order';
    data: {
      statuses: Array<{
        resting: {
          oid: number;
        };
      }>;
    };
  };
}

// --- Simulated Hyperliquid SDK ---
class HyperliquidClient {
  private privateKey: string;
  private userAddress: string;

  constructor(privateKey: string, userAddress: string) {
    this.privateKey = privateKey;
    this.userAddress = userAddress;
  }

  async placeOrder(request: OrderRequest): Promise<OrderResponse> {
    console.log(`[Hyperliquid] Placing order: ${request.is_buy ? 'BUY' : 'SELL'} ${request.sz} ${request.coin} @ ${request.limit_px}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate success response
    return {
      status: 'ok',
      response: {
        type: 'order',
        data: {
          statuses: [{
            resting: {
              oid: Math.floor(Math.random() * 1000000000)
            }
          }]
        }
      }
    };
  }

  async cancelOrder(oid: number): Promise<any> {
    console.log(`[Hyperliquid] Cancelling order: ${oid}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { status: 'ok', data: { statuses: ['canceled'] } };
  }
}

// --- Agent Logic ---

// Initialize client (mock keys if env missing)
const client = new HyperliquidClient(
  process.env.HYPERLIQUID_PRIVATE_KEY || '0x...',
  process.env.USER_ADDRESS || '0x...'
);

app.get('/health', (_: express.Request, res: express.Response) => res.json({ status: 'ok' }));

app.post('/execute', async (req: express.Request, res: express.Response) => {
  try {
    const { input } = req.body; // Expecting { input: "buy ETH 100" } or structured data

    // Simple command parser for demo purposes
    // In production, use an LLM or structured input schema
    let command = '';
    if (typeof input === 'string') {
      command = input;
    } else if (input && input.command) {
      command = input.command;
    }

    if (command.toLowerCase().startsWith('buy') || command.toLowerCase().startsWith('sell')) {
      const parts = command.split(' ');
      const isBuy = parts[0].toLowerCase() === 'buy';
      const coin = parts[1] || 'ETH';
      const size = parseFloat(parts[2]) || 1;
      const price = parseFloat(parts[3]) || 2000; // Default mock price

      const result = await client.placeOrder({
        coin,
        is_buy: isBuy,
        sz: size,
        limit_px: price,
        order_type: { limit: { tif: 'Gtc' } },
        reduce_only: false
      });

      return res.json({
        status: 'success',
        action: 'place_order',
        details: result
      });
    }

    if (command.toLowerCase().startsWith('cancel')) {
      const parts = command.split(' ');
      const oid = parseInt(parts[1]);

      if (isNaN(oid)) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }

      const result = await client.cancelOrder(oid);
      return res.json({
        status: 'success',
        action: 'cancel_order',
        details: result
      });
    }

    // Default echo if command not recognized
    res.json({
      status: 'success',
      message: 'Command not recognized, echoed input',
      output: { echo: req.body }
    });

  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(process.env.PORT || 8000, () => console.log('hyperliquid-node-agent up'));


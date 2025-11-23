import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { createModularAccountAlchemyClient } from '@alchemy/aa-alchemy';
import { baseSepolia, base } from 'viem/chains';
import { LocalAccountSigner } from '@alchemy/aa-core';
import { generatePrivateKey } from 'viem/accounts';

const router: Router = Router();

// Validation middleware
const validateWalletCreation = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('salt')
    .isString()
    .withMessage('Salt must be a string')
    .isLength({ min: 1 })
    .withMessage('Salt is required'),
  body('chainId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Chain ID must be a positive integer'),
];

// Helper to get chain object
const getChain = (chainId: number) => {
  switch (chainId) {
    case 8453: return base;
    case 84532: return baseSepolia;
    default: return baseSepolia;
  }
};

// POST /api/wallet/create - Create email-based smart wallet
router.post('/create', validateWalletCreation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { email, chainId = 84532 } = req.body;
    const chain = getChain(chainId);

    // In a real app, we would derive a signer from the email/auth provider (e.g. Turnkey, Magic)
    // For this demo/MVP, we generate a random signer if one isn't provided, 
    // OR we deterministically generate one from the salt (NOT SECURE FOR PRODUCTION)
    // To make it deterministic for the "same email = same wallet" effect in a demo:
    // We'll use a mock signer for now since we don't have a real OIDC provider setup here.

    // Generate a random signer for this session (in production this comes from the auth provider)
    const privateKey = generatePrivateKey();
    const signer = LocalAccountSigner.privateKeyToAccountSigner(privateKey);

    // Create the smart account client
    const client = await createModularAccountAlchemyClient({
      apiKey: process.env.ALCHEMY_API_KEY!,
      chain,
      signer,
    });

    const address = client.getAddress();

    res.json({
      address,
      chainId,
      owner: email,
      deployed: false, // Smart accounts are deployed on first transaction
      message: 'Smart wallet address generated successfully'
    });

  } catch (error) {
    console.error('Wallet creation error:', error);
    res.status(500).json({
      error: 'Failed to create wallet',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/wallet/info/:address - Get wallet information
router.get('/info/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // In a real implementation, we would query the blockchain to see if code exists at this address
    // and fetch its balance.

    // Mock response for now to enable the endpoint
    res.json({
      address,
      isDeployed: false, // TODO: Check code at address
      balance: '0', // TODO: Fetch balance
      type: 'ModularAccount'
    });

  } catch (error) {
    console.error('Wallet info error:', error);
    res.status(500).json({
      error: 'Failed to get wallet information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

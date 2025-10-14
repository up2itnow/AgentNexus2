import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { ethers } from 'ethers';
import { AlchemyAccountKit } from '@alchemy/aa-alchemy';

const router = Router();

// Initialize Alchemy Account Kit for Base mainnet
const alchemy = new AlchemyAccountKit({
  apiKey: process.env.ALCHEMY_API_KEY!,
  chainId: 8453, // Base mainnet
});

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

// POST /api/wallet/create - Create email-based smart wallet
router.post('/create', validateWalletCreation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, salt, chainId = 8453 } = req.body;

    // Validate chain ID is supported
    if (![8453, 84532].includes(chainId)) { // Base mainnet or Sepolia
      return res.status(400).json({
        error: 'Unsupported chain ID. Only Base mainnet (8453) and Sepolia (84532) are supported.'
      });
    }

    // Generate deterministic salt from email for reproducible wallet addresses
    const deterministicSalt = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(email + salt)
    );

    // Create smart account using Alchemy Account Kit
    const smartAccount = await alchemy.createSmartAccount({
      salt: deterministicSalt,
      signers: [], // Will be configured with session keys later
    });

    const walletAddress = await smartAccount.getAddress();

    // Fund the wallet for initial transactions (in production, this would be done by a paymaster)
    if (chainId === 84532) { // Base Sepolia testnet
      // For testnet, we could fund with test ETH if needed
      // In production, this would be handled by the paymaster
    }

    res.json({
      success: true,
      walletAddress,
      chainId,
      message: 'Smart wallet created successfully'
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
router.get('/info/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Validate Ethereum address
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid wallet address'
      });
    }

    // Get smart account instance
    const smartAccount = await alchemy.getSmartAccount(address);

    const walletInfo = {
      address,
      isDeployed: await smartAccount.isAccountDeployed(),
      nonce: await smartAccount.getNonce(),
      owner: await smartAccount.getOwner(),
    };

    res.json({
      success: true,
      wallet: walletInfo
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

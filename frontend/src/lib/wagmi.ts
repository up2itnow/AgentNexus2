/**
 * Wagmi Configuration for Base L2 Integration
 * 
 * Configures wallet connectors and Base network support
 * for AgentNexus marketplace.
 */

import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Get WalletConnect project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will be disabled.');
}

/**
 * Wagmi configuration with Base L2 support
 * 
 * Features:
 * - Base mainnet and Base Sepolia testnet
 * - Multiple wallet connectors (MetaMask, WalletConnect, Coinbase Wallet)
 * - HTTP transports for RPC calls
 */
export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    // Browser extension wallets (MetaMask, etc.)
    injected({
      target: 'metaMask',
    }),
    
    // WalletConnect (mobile wallets, etc.)
    ...(projectId ? [
      walletConnect({
        projectId,
        metadata: {
          name: 'AgentNexus',
          description: 'Decentralized AI Agent Marketplace on Base',
          url: 'https://agentnexus.io',
          icons: ['https://agentnexus.io/icon.png'],
        },
      }),
    ] : []),
    
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'AgentNexus',
      appLogoUrl: 'https://agentnexus.io/icon.png',
    }),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC),
  },
});

// Export chain info for easy access
export { base, baseSepolia };

// Helper to get current chain based on environment
export function getDefaultChain() {
  return process.env.NODE_ENV === 'production' ? base : baseSepolia;
}


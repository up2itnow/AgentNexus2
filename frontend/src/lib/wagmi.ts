/**
 * Wagmi Configuration for Multi-Chain Support
 * 
 * Configures wallet connectors and network support
 * for AgentNexus marketplace across multiple EVM chains.
 */

import { createConfig, http } from 'wagmi';
import {
  base,
  baseSepolia,
  arbitrum,
  polygon,
  optimism,
  bsc,
  avalanche
} from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Get WalletConnect project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will be disabled.');
}

/**
 * Supported chains for AgentNexus
 * Priority order: Base (primary), then L2s, then L1s
 */
export const supportedChains = [
  baseSepolia,
  base,
  arbitrum,
  polygon,
  optimism,
  bsc,
  avalanche,
] as const;

/**
 * Wagmi configuration with multi-chain support
 * 
 * Features:
 * - Base mainnet and Base Sepolia (primary)
 * - Arbitrum, Polygon, Optimism (Tier 1 L2s)
 * - BNB Chain, Avalanche (Tier 2)
 * - Multiple wallet connectors (MetaMask, WalletConnect, Coinbase Wallet)
 * - HTTP transports for RPC calls
 */
export const config = createConfig({
  chains: supportedChains,
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
          description: 'Decentralized AI Agent Marketplace',
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
    // Primary chains
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC),
    // Tier 1 L2s
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC),
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC),
    [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC),
    // Tier 2 chains
    [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC),
    [avalanche.id]: http(process.env.NEXT_PUBLIC_AVALANCHE_RPC),
  },
});

// Export chain info for easy access
export { base, baseSepolia, arbitrum, polygon, optimism, bsc, avalanche };

// Helper to get current chain based on environment
export function getDefaultChain() {
  const defaultChainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID;
  if (defaultChainId) {
    const chain = supportedChains.find(c => c.id === parseInt(defaultChainId));
    if (chain) return chain;
  }
  return process.env.NODE_ENV === 'production' ? base : baseSepolia;
}

// Chain ID to name mapping for display
export const chainNames: Record<number, string> = {
  [base.id]: 'Base',
  [baseSepolia.id]: 'Base Sepolia',
  [arbitrum.id]: 'Arbitrum',
  [polygon.id]: 'Polygon',
  [optimism.id]: 'Optimism',
  [bsc.id]: 'BNB Chain',
  [avalanche.id]: 'Avalanche',
};

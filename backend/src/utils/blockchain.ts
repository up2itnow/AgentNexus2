/**
 * Blockchain Utilities - Multi-Chain Viem Client Setup
 * 
 * Configures Viem clients for interacting with multiple EVM chains
 * 
 * Supported Chains:
 * - Base (Primary)
 * - Arbitrum, Polygon, Optimism (Tier 1)
 * - BNB Chain, Avalanche (Tier 2)
 * 
 * @author AgentNexus Team
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  stringToBytes,
  type PublicClient,
  type WalletClient,
  type Address,
  type Chain
} from 'viem';
import { base, baseSepolia, arbitrum, polygon, optimism, bsc, avalanche, mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { BlockchainError } from '../types';

/**
 * Chain registry mapping chain IDs to chain configs and RPC env vars
 */
interface ChainConfig {
  chain: Chain;
  rpcEnvVar: string;
  contractEnvPrefix: string;
}

export const CHAIN_REGISTRY: Record<number, ChainConfig> = {
  // Base (Primary)
  8453: {
    chain: base,
    rpcEnvVar: 'BASE_RPC_URL',
    contractEnvPrefix: 'BASE'
  },
  84532: {
    chain: baseSepolia,
    rpcEnvVar: 'BASE_SEPOLIA_RPC_URL',
    contractEnvPrefix: 'BASE_SEPOLIA'
  },
  // Tier 1 networks
  1: {
    chain: mainnet,
    rpcEnvVar: 'ETHEREUM_RPC_URL',
    contractEnvPrefix: 'ETHEREUM'
  },
  42161: {
    chain: arbitrum,
    rpcEnvVar: 'ARBITRUM_RPC_URL',
    contractEnvPrefix: 'ARBITRUM'
  },
  137: {
    chain: polygon,
    rpcEnvVar: 'POLYGON_RPC_URL',
    contractEnvPrefix: 'POLYGON'
  },
  10: {
    chain: optimism,
    rpcEnvVar: 'OPTIMISM_RPC_URL',
    contractEnvPrefix: 'OPTIMISM'
  },
  // Tier 2
  56: {
    chain: bsc,
    rpcEnvVar: 'BSC_RPC_URL',
    contractEnvPrefix: 'BSC'
  },
  43114: {
    chain: avalanche,
    rpcEnvVar: 'AVALANCHE_RPC_URL',
    contractEnvPrefix: 'AVALANCHE'
  },
};

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(CHAIN_REGISTRY).map(Number);
}

/**
 * Check if a chain ID is supported
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_REGISTRY;
}

/**
 * Get the default chain based on environment
 */
export function getDefaultChainId(): number {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? 8453 : 84532; // Base mainnet or Base Sepolia
}

/**
 * Get chain config by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig {
  const config = CHAIN_REGISTRY[chainId];
  if (!config) {
    throw new BlockchainError(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

/**
 * Get chain by chain ID (legacy compatibility)
 */
export function getChain(chainId?: number): Chain {
  const id = chainId ?? getDefaultChainId();
  return getChainConfig(id).chain;
}

/**
 * Get RPC URL for a chain
 */
export function getRpcUrl(chainId: number): string {
  const config = getChainConfig(chainId);
  const rpcUrl = process.env[config.rpcEnvVar];

  if (!rpcUrl) {
    throw new BlockchainError(`${config.rpcEnvVar} not configured for chain ${chainId}`);
  }

  return rpcUrl;
}

/**
 * Create a public client for reading blockchain data
 * @param chainId - Chain ID to connect to (defaults to environment chain)
 */
export function createPublicViemClient(chainId?: number): PublicClient {
  const id = chainId ?? getDefaultChainId();
  const config = getChainConfig(id);
  const rpcUrl = getRpcUrl(id);

  return createPublicClient({
    chain: config.chain,
    transport: http(rpcUrl)
  }) as PublicClient;
}

/**
 * Create a wallet client for sending transactions
 * @param chainId - Chain ID to connect to (defaults to environment chain)
 */
export function createWalletViemClient(chainId?: number, privateKeyOverride?: string): WalletClient {
  const id = chainId ?? getDefaultChainId();
  const config = getChainConfig(id);
  const rpcUrl = getRpcUrl(id);
  const privateKey = privateKeyOverride ?? process.env.DEPLOYER_PRIVATE_KEY;

  if (!privateKey) {
    throw new BlockchainError('DEPLOYER_PRIVATE_KEY not configured');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  return createWalletClient({
    account,
    chain: config.chain,
    transport: http(rpcUrl)
  });
}

/**
 * Contract addresses per chain
 */
interface ChainContracts {
  escrow: Address;
  entitlements: Address;
}

/**
 * Get contract addresses for a specific chain
 * Falls back to generic env vars if chain-specific not found
 */
export function getContractAddresses(chainId?: number): ChainContracts {
  const id = chainId ?? getDefaultChainId();
  const config = CHAIN_REGISTRY[id];
  const prefix = config?.contractEnvPrefix || '';

  // Try chain-specific addresses first
  let escrowAddress = process.env[`${prefix}_ESCROW_CONTRACT_ADDRESS`];
  let entitlementsAddress = process.env[`${prefix}_ENTITLEMENTS_CONTRACT_ADDRESS`];

  // Fall back to generic addresses
  if (!escrowAddress) {
    escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  }
  if (!entitlementsAddress) {
    entitlementsAddress = process.env.ENTITLEMENTS_CONTRACT_ADDRESS;
  }

  if (!escrowAddress || !entitlementsAddress) {
    throw new BlockchainError(`Contract addresses not configured for chain ${id}`);
  }

  return {
    escrow: escrowAddress as Address,
    entitlements: entitlementsAddress as Address
  };
}

/**
 * Format wei to ether string
 */
export function formatEther(wei: bigint): string {
  return (Number(wei) / 1e18).toString();
}

/**
 * Parse ether string to wei
 */
export function parseEther(ether: string): bigint {
  return BigInt(Math.floor(parseFloat(ether) * 1e18));
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  client: PublicClient,
  hash: `0x${string}`,
  confirmations: number = 1
) {
  try {
    const receipt = await client.waitForTransactionReceipt({
      hash,
      confirmations
    });

    return receipt;
  } catch (error) {
    throw new BlockchainError(`Transaction failed: ${error}`);
  }
}

/**
 * Check if address is valid
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Generate payment ID (deterministic)
 */
export function generatePaymentId(
  userAddress: string,
  agentId: string,
  timestamp: number
): `0x${string}` {
  const payload = `${userAddress.toLowerCase()}:${agentId}:${timestamp}`;
  const hash = keccak256(stringToBytes(payload));
  return hash as `0x${string}`;
}

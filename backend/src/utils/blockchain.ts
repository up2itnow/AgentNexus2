/**
 * Blockchain Utilities - Viem Client Setup
 * 
 * Configures Viem clients for interacting with Base L2 and smart contracts
 * 
 * @author AgentNexus Team (Built with AstraForge 5-LLM Collaboration)
 */

import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient, type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { BlockchainError } from '../types';

/**
 * Get the appropriate chain based on environment
 */
export function getChain() {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? base : baseSepolia;
}

/**
 * Create a public client for reading blockchain data
 */
export function createPublicViemClient(): PublicClient {
  const chain = getChain();
  const rpcUrl = process.env.BASE_RPC_URL;
  
  if (!rpcUrl) {
    throw new BlockchainError('BASE_RPC_URL not configured');
  }
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl)
  }) as PublicClient;
}

/**
 * Create a wallet client for sending transactions
 */
export function createWalletViemClient(): WalletClient {
  const chain = getChain();
  const rpcUrl = process.env.BASE_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!rpcUrl) {
    throw new BlockchainError('BASE_RPC_URL not configured');
  }
  
  if (!privateKey) {
    throw new BlockchainError('DEPLOYER_PRIVATE_KEY not configured');
  }
  
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl)
  });
}

/**
 * Get contract addresses from environment
 */
export function getContractAddresses() {
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  const entitlementsAddress = process.env.ENTITLEMENTS_CONTRACT_ADDRESS;
  
  if (!escrowAddress || !entitlementsAddress) {
    throw new BlockchainError('Contract addresses not configured');
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
  const data = `${userAddress}-${agentId}-${timestamp}`;
  // In production, use proper keccak256 hashing
  // For now, simple implementation
  const hash = Buffer.from(data).toString('hex').padEnd(64, '0');
  return `0x${hash.slice(0, 64)}` as `0x${string}`;
}


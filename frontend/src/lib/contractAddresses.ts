/**
 * Contract Addresses Registry
 * 
 * Maps chain IDs to deployed contract addresses.
 * Update these addresses after deploying to each chain.
 */

import { Address } from 'viem';

export interface ChainContracts {
    entitlements: Address;
    escrow: Address;
}

/**
 * Deployed contract addresses per chain
 * 
 * NOTE: Addresses with 0x0...0 are placeholders.
 * Update with actual deployed addresses.
 */
export const CONTRACT_ADDRESSES: Record<number, ChainContracts> = {
    // Base Sepolia (Testnet) - Deployed Dec 10, 2025
    84532: {
        entitlements: '0x5358AaD0a9dC39DFA95c4B0cC7e8D2b76c08E1c9' as Address,
        escrow: '0xCbE3582d7A83C55d9C4a7C6f0C9c1e30cA6a71b5' as Address,
    },
    // Arbitrum Sepolia (Testnet)
    421614: {
        entitlements: '0x0000000000000000000000000000000000000000' as Address,
        escrow: '0x0000000000000000000000000000000000000000' as Address,
    },
    // Base Mainnet - Primary chain
    8453: {
        entitlements: '0x3c8f32F9cF41Dc255129d6Add447218053743b33' as Address,
        escrow: '0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC' as Address,
    },
    // Arbitrum One
    42161: {
        entitlements: '0x0000000000000000000000000000000000000000' as Address,
        escrow: '0x0000000000000000000000000000000000000000' as Address,
    },
    // Polygon Mainnet
    137: {
        entitlements: '0x0000000000000000000000000000000000000000' as Address,
        escrow: '0x0000000000000000000000000000000000000000' as Address,
    },
    // Optimism
    10: {
        entitlements: '0x0000000000000000000000000000000000000000' as Address,
        escrow: '0x0000000000000000000000000000000000000000' as Address,
    },
    // BNB Chain
    56: {
        entitlements: '0x0000000000000000000000000000000000000000' as Address,
        escrow: '0x0000000000000000000000000000000000000000' as Address,
    },
    // Avalanche C-Chain
    43114: {
        entitlements: '0x0000000000000000000000000000000000000000' as Address,
        escrow: '0x0000000000000000000000000000000000000000' as Address,
    },
};

/**
 * Get contract addresses for a specific chain
 * @param chainId - The chain ID to get addresses for
 * @returns Contract addresses or undefined if chain not supported
 */
export function getContractAddresses(chainId: number): ChainContracts | undefined {
    return CONTRACT_ADDRESSES[chainId];
}

/**
 * Check if contracts are deployed on a chain
 * @param chainId - The chain ID to check
 * @returns true if contracts are deployed (non-zero addresses)
 */
export function isChainDeployed(chainId: number): boolean {
    const addresses = CONTRACT_ADDRESSES[chainId];
    if (!addresses) return false;

    const zeroAddress = '0x0000000000000000000000000000000000000000';
    return addresses.entitlements !== zeroAddress && addresses.escrow !== zeroAddress;
}

/**
 * Get all chains with deployed contracts
 * @returns Array of chain IDs with deployed contracts
 */
export function getDeployedChains(): number[] {
    return Object.keys(CONTRACT_ADDRESSES)
        .map(Number)
        .filter(isChainDeployed);
}

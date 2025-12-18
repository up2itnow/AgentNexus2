/**
 * Circle CCTP Configuration
 * 
 * Official contract addresses and domain IDs for Cross-Chain Transfer Protocol.
 * Source: https://developers.circle.com/stablecoins/docs/cctp-protocol-contract-addresses
 */

export interface CctpChainConfig {
    caip2: string;              // eip155:10 etc
    chainId: number;            // 10, 42161, 8453
    cctpDomain: number;         // Circle CCTP Domain ID
    usdcAddress: string;        // USDC Token Contract
    tokenMessenger: string;     // TokenMessengerV2
    messageTransmitter: string; // MessageTransmitterV2
    rpcUrlEnv: string;          // Env var name for RPC URL
}

export const CCTP_CONFIG: Record<string, CctpChainConfig> = {
    // ============================================
    // MAINNETS
    // ============================================
    base: {
        caip2: 'eip155:8453',
        chainId: 8453,
        cctpDomain: 6,
        usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // V2
        messageTransmitter: '0x19B620929f97B7b990801496c3b361CA5dC8E088',
        rpcUrlEnv: 'BASE_RPC_URL'
    },
    arbitrum: {
        caip2: 'eip155:42161',
        chainId: 42161,
        cctpDomain: 3,
        usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // V2
        messageTransmitter: '0x19B620929f97B7b990801496c3b361CA5dC8E088',
        rpcUrlEnv: 'ARBITRUM_RPC_URL'
    },
    optimism: {
        caip2: 'eip155:10',
        chainId: 10,
        cctpDomain: 2,
        usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // V2
        messageTransmitter: '0x19B620929f97B7b990801496c3b361CA5dC8E088',
        rpcUrlEnv: 'OPTIMISM_RPC_URL'
    },

    // ============================================
    // TESTNETS (Sepolia)
    // ============================================
    'base-sepolia': {
        caip2: 'eip155:84532',
        chainId: 84532,
        cctpDomain: 6,
        usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
        messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD', // V1/Testnet address
        rpcUrlEnv: 'BASE_SEPOLIA_RPC_URL'
    },
    'arbitrum-sepolia': {
        caip2: 'eip155:421614',
        chainId: 421614,
        cctpDomain: 3,
        usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
        messageTransmitter: '0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872',
        rpcUrlEnv: 'ARBITRUM_RPC_URL' // Usually same var name, diff value in env
    },
    'optimism-sepolia': {
        caip2: 'eip155:11155420',
        chainId: 11155420,
        cctpDomain: 2,
        usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D5',
        tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
        messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
        rpcUrlEnv: 'OPTIMISM_RPC_URL'
    }
};

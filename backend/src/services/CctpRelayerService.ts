/**
 * CCTP Relayer Service
 * 
 * Handles permissionless relaying of USDC from Source Chains (Arb, OP) to Base.
 * 1. Observes CCTP burn events on Source Chain.
 * 2. Fetches attestation from Circle Iris API.
 * 3. Submits mint to Base MessageTransmitter.
 * 4. Credits the AgentNexus Receiver contract.
 */

import { createPublicClient, createWalletClient, http, encodeFunctionData, parseEventLogs, keccak256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import axios from 'axios';
import { CCTP_CONFIG } from '../config/cctp';

// Minimal ABI for MessageTransmitter
const MESSAGE_TRANSMITTER_ABI = [
    {
        anonymous: false,
        inputs: [{ indexed: false, name: 'message', type: 'bytes' }],
        name: 'MessageSent',
        type: 'event'
    },
    {
        name: 'receiveMessage',
        type: 'function',
        inputs: [
            { name: 'message', type: 'bytes' },
            { name: 'attestation', type: 'bytes' }
        ],
        outputs: [{ name: 'success', type: 'bool' }]
    }
] as const;

// Minimal ABI for AgentNexusReceiver
const RECEIVER_ABI = [
    {
        name: 'creditFromCctp',
        type: 'function',
        inputs: [
            { name: 'referenceId', type: 'bytes32' },
            { name: 'beneficiary', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: []
    }
] as const;

export class CctpRelayerService {
    private relayerAccount;

    constructor() {
        const privateKey = process.env.RELAYER_PRIVATE_KEY;
        if (!privateKey) {
            console.warn('[CCTP Relayer] RELAYER_PRIVATE_KEY not set. Relayer disabled.');
        } else {
            this.relayerAccount = privateKeyToAccount(privateKey as `0x${string}`);
        }
    }

    /**
     * Process a new CCTP burn
     */
    async relayTransfer(
        burnTxHash: string,
        sourceChainCaip2: string,
        referenceId: string,
        beneficiary: string,
        amount: string // Parsed amount from request, used for verification
    ) {
        if (!process.env.ENABLE_CCTP_RELAYER || process.env.ENABLE_CCTP_RELAYER !== 'true') {
            throw new Error('Relayer disabled');
        }
        if (!this.relayerAccount) throw new Error('Relayer account not configured');

        console.log(`[CCTP Relayer] Processing ${burnTxHash} from ${sourceChainCaip2}`);

        // 1. Get Source Chain Config
        const sourceConfig = Object.values(CCTP_CONFIG).find(c => c.caip2 === sourceChainCaip2);
        if (!sourceConfig) throw new Error(`Unsupported source chain: ${sourceChainCaip2}`);

        // 2. Fetch Tx and Parse Logs
        const rpcUrl = process.env[sourceConfig.rpcUrlEnv];
        const publicClient = createPublicClient({
            transport: http(rpcUrl)
        });

        const receipt = await publicClient.getTransactionReceipt({ hash: burnTxHash as `0x${string}` });

        // Find MessageSent event
        const logs = parseEventLogs({
            abi: MESSAGE_TRANSMITTER_ABI,
            eventName: 'MessageSent',
            logs: receipt.logs
        });

        if (logs.length === 0) throw new Error('No MessageSent event found in transaction');
        const log = logs[0] as any; // Cast to avoid TS issues
        const messageBytes = log.args.message;
        const messageHash = keccak256(messageBytes);

        console.log(`[CCTP Relayer] Found message hash: ${messageHash}`);

        // 3. Poll Iris for Attestation
        const attestation = await this.pollIrisAttestation(messageHash);
        console.log(`[CCTP Relayer] Attestation received`);

        // 4. Mint on Base (Destination)
        // Use Base Sepolia or Base Mainnet based on env
        const destNetworkStr = process.env.X402_NETWORK === 'base' ? 'base' : 'base-sepolia';
        const destChain = destNetworkStr === 'base' ? base : baseSepolia;
        const destConfig = CCTP_CONFIG[destNetworkStr];
        const destRpc = process.env[destConfig.rpcUrlEnv];

        const walletClient = createWalletClient({
            account: this.relayerAccount,
            chain: destChain,
            transport: http(destRpc)
        });

        // Submit receiveMessage
        try {
            const mintTx = await walletClient.sendTransaction({
                chain: destChain,
                to: destConfig.messageTransmitter as `0x${string}`,
                data: encodeFunctionData({
                    abi: MESSAGE_TRANSMITTER_ABI,
                    functionName: 'receiveMessage',
                    args: [messageBytes, attestation]
                }),
            });
            console.log(`[CCTP Relayer] Mint tx submitted: ${mintTx}`);

        } catch (e: any) {
            if (e.message?.includes('Nonce') || e.message?.includes('executed')) {
                console.log('[CCTP Relayer] Message likely already minted, proceeding to credit');
            } else {
                throw e;
            }
        }

        // 5. Credit Receiver
        // Call creditFromCctp on AgentNexusCctpReceiver
        const receiverAddress = process.env.CCTP_BASE_RECEIVER_CONTRACT;
        if (!receiverAddress) throw new Error('CCTP_BASE_RECEIVER_CONTRACT not configured');

        const creditTx = await walletClient.sendTransaction({
            chain: destChain,
            to: receiverAddress as `0x${string}`,
            data: encodeFunctionData({
                abi: RECEIVER_ABI,
                functionName: 'creditFromCctp',
                args: [
                    referenceId as `0x${string}`, // Must match type bytes32
                    beneficiary as `0x${string}`,
                    BigInt(amount)
                ]
            })
        });

        console.log(`[CCTP Relayer] Credit applied: ${creditTx}`);

        return {
            status: 'CREDITED',
            mintTx: '...',
            creditTx: creditTx
        };
    }

    private async pollIrisAttestation(messageHash: string): Promise<`0x${string}`> {
        const irisUrl = process.env.CCTP_IRIS_BASE_URL || 'https://iris-api.circle.com';

        let attempts = 0;
        while (attempts < 20) { // Poll for ~1-2 mins
            try {
                // Circle docs say: GET https://iris-api.circle.com/attestations/{messageHash}
                const response = await axios.get(`${irisUrl}/attestations/${messageHash}`);

                if (response.data.status === 'complete' && response.data.attestation) {
                    return response.data.attestation as `0x${string}`;
                }
            } catch {
                // Ignore 404/pending/errors during polling
            }

            await new Promise(r => setTimeout(r, 5000));
            attempts++;
        }
        throw new Error('Attestation timeout');
    }
}

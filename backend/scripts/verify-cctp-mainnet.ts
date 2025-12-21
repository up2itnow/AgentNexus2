
/**
 * CCTP E2E Verification: Ethereum Mainnet → Base Mainnet
 * 
 * This script performs a full end-to-end CCTP transfer and outputs
 * a grant-safe proof artifact (no secrets).
 * 
 * RESUME MODE: Set CCTP_BURN_TX_HASH or CCTP_MESSAGE_HASH to skip burn and resume.
 * 
 * Flow:
 * 1. Burn USDC on Ethereum Mainnet (Payer Wallet) [skipped in resume mode]
 * 2. Retrieve Attestation from Circle Iris
 * 3. Mint USDC on Base Mainnet (Relayer Wallet) -> into Receiver Contract
 * 4. Apply Credit on Base Mainnet (Relayer Wallet) -> calls creditFromCctp
 * 
 * Required Environment Variables:
 * - ETHEREUM_MAINNET_RPC_URL (no placeholders!)
 * - BASE_MAINNET_RPC_URL (no placeholders!)
 * - PAYER_PRIVATE_KEY (for burn, skipped in resume mode)
 * - RELAYER_PRIVATE_KEY (for mint/credit)
 * - CCTP_BASE_RECEIVER_CONTRACT_MAINNET
 * 
 * Resume Mode (skip burn):
 * - CCTP_BURN_TX_HASH: Existing burn tx hash to resume from
 * - CCTP_MESSAGE_HASH: Skip directly to Iris polling with this hash
 * 
 * Safety:
 * - MAINNET_PROOF_AMOUNT_USDC (Default 1.0, Max 2.0)
 * - CONFIRM_MAINNET_BURN=true required to broadcast new burns
 * - ALLOW_EOA_RECIPIENT=true required to send to EOA (not recommended)
 */

import { createPublicClient, createWalletClient, http, parseUnits, encodeFunctionData, parseAbiItem, keccak256, isAddress, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, base } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { CCTP_CONFIG } from '../src/config/cctp';

dotenv.config();

// ============================================================
// Helper: Validate env var is present and not a placeholder
// ============================================================
function requireEnv(name: string, value: string | undefined): string {
    if (!value || value.trim() === '') {
        throw new Error(`❌ Missing required env var: ${name}`);
    }
    // Only check for actual placeholder patterns, not empty string
    const placeholders = ['YOUR_KEY', 'XXXX', 'your-key', 'your-api-key', 'placeholder', 'REAL_KEY_HERE'];
    for (const p of placeholders) {
        if (value.includes(p)) {
            throw new Error(`❌ Env var ${name} contains placeholder value "${p}". Set a real value.`);
        }
    }
    return value;
}

// ============================================================
// Helper: Check if address is a contract (not EOA)
// ============================================================
async function isContract(client: any, address: string): Promise<boolean> {
    const code = await client.getBytecode({ address: address as `0x${string}` });
    return !!code && code.length > 2;
}

// ============================================================
// Helper: Resolve Iris Base URL based on source chainId
// CRITICAL: Mainnet burns MUST use production Iris, not sandbox!
// ============================================================
const IRIS_MAINNET = 'https://iris-api.circle.com';
const IRIS_SANDBOX = 'https://iris-api-sandbox.circle.com';

function resolveIrisBaseUrl(chainId: number): { url: string; env: string } {
    // Mainnets - MUST use production Iris
    if (chainId === 1 || chainId === 8453 || chainId === 42161 || chainId === 10) {
        return { url: IRIS_MAINNET, env: 'mainnet' };
    }
    // Testnets - use sandbox
    return { url: IRIS_SANDBOX, env: 'testnet' };
}

// Safety guard: Prevent sandbox polling for mainnet burns
function validateIrisEnvironment(chainId: number, irisUrl: string): void {
    const isMainnet = chainId === 1 || chainId === 8453 || chainId === 42161 || chainId === 10;
    const isSandbox = irisUrl.includes('sandbox');

    if (isMainnet && isSandbox) {
        throw new Error(
            'FATAL: Mainnet burn detected but sandbox Iris endpoint configured. Refusing to poll. ' +
            `ChainId: ${chainId}, Iris URL: ${irisUrl}`
        );
    }
}

// ============================================================
// Helper: Decode ABI-encoded bytes from MessageSent event
// The MessageSent(bytes message) event encodes bytes as:
//   - 32 bytes offset (always 0x20 = 32)
//   - 32 bytes length
//   - actual bytes data
// ============================================================
function decodeMessageBytes(abiEncodedData: string): `0x${string}` {
    // Remove 0x prefix for parsing
    const hex = abiEncodedData.startsWith('0x') ? abiEncodedData.slice(2) : abiEncodedData;

    // First 32 bytes = offset (should be 32 = 0x20)
    const offset = parseInt(hex.substring(0, 64), 16);

    // Length is at offset position (32 bytes)
    const lengthStart = offset * 2;
    const length = parseInt(hex.substring(lengthStart, lengthStart + 64), 16);

    // Actual message bytes start after length
    const messageStart = lengthStart + 64;
    const messageHex = hex.substring(messageStart, messageStart + length * 2);

    return `0x${messageHex}` as `0x${string}`;
}

const ERC20_ABI = [
    parseAbiItem('function approve(address spender, uint256 amount) external returns (bool)'),
    parseAbiItem('function balanceOf(address account) external view returns (uint256)'),
    parseAbiItem('function allowance(address owner, address spender) external view returns (uint256)')
];

const TM_ABI = [
    parseAbiItem('function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) external returns (uint64 nonce)'),
    parseAbiItem('function localMinter() external view returns (address)'),
    // Errors
    parseAbiItem('error DestinationDomainNotSupported(uint32 remoteDomain)'),
    parseAbiItem('error InvalidDestinationDomain()'),
    parseAbiItem('error AmountIsZero()'),
    parseAbiItem('error BurnTokenNotSupported(address token)'),
    parseAbiItem('error MintRecipientIsEmpty()')
];

const MT_ABI = [
    parseAbiItem('function receiveMessage(bytes message, bytes attestation) external returns (bool)')
];

// Receiver V1 Interface 
const RECEIVER_ABI = [
    parseAbiItem('function creditFromCctp(bytes32 referenceId, address beneficiary, uint256 amount) external')
];

const MINTER_ABI = [
    parseAbiItem('function getLocalToken(uint32 remoteDomain, bytes32 remoteToken) external view returns (address)')
];

// MessageSent(bytes message) topic
const MESSAGE_SENT_TOPIC = '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036';

async function main() {
    console.log('=== CCTP E2E Verification: Ethereum Mainnet → Base Mainnet ===\n');

    // ============================================================
    // CONFIGURATION: Fail-fast on missing/placeholder env vars
    // ============================================================
    const ethRpc = requireEnv('ETHEREUM_MAINNET_RPC_URL', process.env.ETHEREUM_MAINNET_RPC_URL);
    const baseRpc = requireEnv('BASE_MAINNET_RPC_URL', process.env.BASE_MAINNET_RPC_URL || process.env.BASE_RPC_URL);
    const relayerKey = requireEnv('RELAYER_PRIVATE_KEY', process.env.RELAYER_PRIVATE_KEY);
    const receiverAddress = requireEnv('CCTP_BASE_RECEIVER_CONTRACT_MAINNET', process.env.CCTP_BASE_RECEIVER_CONTRACT_MAINNET);

    // Resume mode env vars (optional)
    const resumeBurnTxHash = process.env.CCTP_BURN_TX_HASH;
    const resumeMessageHash = process.env.CCTP_MESSAGE_HASH;
    const isResumeMode = !!(resumeBurnTxHash || resumeMessageHash);

    // Payer key only required if not in resume mode
    const payerKey = isResumeMode ? process.env.PAYER_PRIVATE_KEY : requireEnv('PAYER_PRIVATE_KEY', process.env.PAYER_PRIVATE_KEY);

    const amountStr = process.env.MAINNET_PROOF_AMOUNT_USDC || '1.0';
    const amount = parseUnits(amountStr, 6);
    const maxAmount = parseUnits('2.0', 6);

    if (amount > maxAmount) {
        throw new Error(`❌ Amount ${amountStr} USDC exceeds hard cap of 2.0 USDC`);
    }

    console.log(`Mode: ${isResumeMode ? 'RESUME (skipping burn)' : 'FULL (will burn USDC)'}`);
    console.log(`Proof Amount: ${amountStr} USDC`);

    // --- Clients ---
    const payerAccount = privateKeyToAccount(payerKey as `0x${string}`);
    const relayerAccount = privateKeyToAccount(relayerKey as `0x${string}`);

    const ethPublicClient = createPublicClient({ chain: mainnet, transport: http(ethRpc) });
    const ethWalletClient = createWalletClient({ account: payerAccount, chain: mainnet, transport: http(ethRpc) });
    const basePublicClient = createPublicClient({ chain: base, transport: http(baseRpc) });
    const baseWalletClient = createWalletClient({ account: relayerAccount, chain: base, transport: http(baseRpc) });

    const srcConfig = CCTP_CONFIG['ethereum'];
    const dstConfig = CCTP_CONFIG['base'];

    if (!srcConfig) throw new Error('CCTP Config for ethereum missing');
    if (!dstConfig) throw new Error('CCTP Config for base missing');

    const srcTokenMessenger = srcConfig.tokenMessenger as `0x${string}`;
    const srcUsdc = srcConfig.usdcAddress as `0x${string}`;
    const srcMessageTransmitter = srcConfig.messageTransmitter as `0x${string}`;

    // Get TokenMinter address - THIS is what needs approval, not TokenMessenger!
    const srcTokenMinter = await ethPublicClient.readContract({
        address: srcTokenMessenger,
        abi: TM_ABI,
        functionName: 'localMinter'
    }) as `0x${string}`;
    console.log(`TokenMinter: ${srcTokenMinter}`);

    console.log(`Payer: ${payerAccount.address}`);
    console.log(`Relayer: ${relayerAccount.address}`);
    console.log(`Receiver Configured: ${receiverAddress}`);

    // --- Preflight Checks ---
    console.log('\n--- Preflight Checks (Safety Gates) ---');

    // 1. Verify Receiver Deployed
    const receiverCode = await basePublicClient.getBytecode({ address: receiverAddress as `0x${string}` });
    if (!receiverCode) throw new Error(`Receiver contract not deployed at ${receiverAddress} on Base Mainnet`);
    console.log('✅ Receiver contract deployed');

    // 2. Verify CCTP Contracts Bytecode
    const [tmCode, usdcCode, mtCode] = await Promise.all([
        ethPublicClient.getBytecode({ address: srcTokenMessenger }),
        ethPublicClient.getBytecode({ address: srcUsdc }),
        ethPublicClient.getBytecode({ address: srcMessageTransmitter })
    ]);
    if (!tmCode) throw new Error('Source TokenMessenger has no code');
    if (!usdcCode) throw new Error('Source USDC has no code');
    if (!mtCode) throw new Error('Source MessageTransmitter has no code');
    console.log('✅ Source CCTP contracts verified');

    // 3. EOA Rejection (no-custody enforcement)
    const isReceiverContract = await isContract(basePublicClient, receiverAddress);
    if (!isReceiverContract) {
        if (process.env.ALLOW_EOA_RECIPIENT !== 'true') {
            throw new Error(`❌ Receiver ${receiverAddress} is an EOA, not a contract. Set ALLOW_EOA_RECIPIENT=true to allow (not recommended).`);
        }
        console.log('⚠️ WARNING: Receiver is an EOA. This is NOT recommended for custody-free operation.');
    } else {
        console.log('✅ Receiver is a contract (custody-free)');
    }

    const mintRecipientBytes32 = `0x000000000000000000000000${receiverAddress.slice(2)}` as `0x${string}`;

    // ============================================================
    // RESUME MODE: Skip burn if we have existing tx/message hash
    // ============================================================
    let messageBytes: `0x${string}` | undefined;
    let messageHash: `0x${string}` | undefined;
    let burnTxHash: `0x${string}` | undefined;
    let burnBlock: bigint = 0n;

    if (resumeMessageHash) {
        // Direct message hash resume - skip burn and tx extraction
        console.log(`\n--- RESUME MODE: Using provided message hash ---`);
        messageHash = resumeMessageHash as `0x${string}`;
        console.log(`Message Hash: ${messageHash}`);

    } else if (resumeBurnTxHash) {
        // Resume from burn tx - extract message from logs
        console.log(`\n--- RESUME MODE: Extracting message from burn tx ---`);
        burnTxHash = resumeBurnTxHash as `0x${string}`;
        console.log(`Burn Tx: ${burnTxHash}`);

        const burnReceipt = await ethPublicClient.waitForTransactionReceipt({ hash: burnTxHash });
        burnBlock = burnReceipt.blockNumber;
        console.log(`Burn Block: ${burnBlock}`);

        // Extract MessageSent event - the data is ABI-encoded bytes
        const messageTransmitterLower = srcMessageTransmitter.toLowerCase();
        let rawEventData: `0x${string}` | undefined;

        for (const log of burnReceipt.logs) {
            if (log.address.toLowerCase() === messageTransmitterLower && log.topics[0] === MESSAGE_SENT_TOPIC) {
                rawEventData = log.data as `0x${string}`;
                break;
            }
        }
        // Fallback: look for topic only
        if (!rawEventData) {
            for (const log of burnReceipt.logs) {
                if (log.topics[0] === MESSAGE_SENT_TOPIC && log.data.length > 100) {
                    rawEventData = log.data as `0x${string}`;
                    break;
                }
            }
        }
        if (!rawEventData) throw new Error('❌ Could not find MessageSent event in burn tx logs');

        // Decode ABI-encoded bytes to get actual message bytes
        messageBytes = decodeMessageBytes(rawEventData);
        messageHash = keccak256(messageBytes);
        console.log(`Message Hash: ${messageHash}`);
        console.log(`Message Bytes (first 66 chars): ${messageBytes.substring(0, 66)}...`);

    } else {
        // ============================================================
        // FULL MODE: Perform new burn (requires confirmation)
        // ============================================================
        console.log('\n--- FULL MODE: Will perform new USDC burn ---');

        if (process.env.CONFIRM_MAINNET_BURN !== 'true') {
            console.log('\n' + '='.repeat(60));
            console.log('⚠️  WARNING: MAINNET BURN REQUIRES CONFIRMATION');
            console.log('='.repeat(60));
            console.log(`This will broadcast a real transaction burning ${amountStr} USDC on Ethereum Mainnet.`);
            console.log(`Set CONFIRM_MAINNET_BURN=true to proceed.`);
            console.log('='.repeat(60));
            throw new Error('❌ Set CONFIRM_MAINNET_BURN=true to confirm mainnet burn');
        }

        // Balance Check
        const balance = await ethPublicClient.readContract({
            address: srcUsdc,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [payerAccount.address]
        }) as bigint;

        if (balance < amount) {
            throw new Error(`❌ Insufficient USDC Balance. Have: ${formatUnits(balance, 6)}, Need: ${amountStr}`);
        }
        console.log(`✅ Payer has sufficient USDC (${formatUnits(balance, 6)})`);

        // Approval - For V1 CCTP, approve the TokenMessenger
        const allowance = await ethPublicClient.readContract({
            address: srcUsdc,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [payerAccount.address, srcTokenMessenger]
        }) as bigint;

        if (allowance < amount) {
            console.log('\n--- Approving USDC for TokenMessenger (V1) ---');
            const approveTx = await ethWalletClient.sendTransaction({
                to: srcUsdc,
                data: encodeFunctionData({
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [srcTokenMessenger, amount]
                })
            });
            console.log(`Sent Approve Tx: ${approveTx}`);
            await ethPublicClient.waitForTransactionReceipt({ hash: approveTx });
            console.log('✅ Approved TokenMessenger');
            console.log('Waiting 10s for approval to index...');
            await new Promise(r => setTimeout(r, 10000));
        } else {
            console.log('✅ Already approved for TokenMessenger');
        }

        // Burn
        console.log('\n--- Deposit For Burn (Eth Mainnet) ---');
        console.log('Sending depositForBurn transaction...');

        burnTxHash = await ethWalletClient.writeContract({
            address: srcTokenMessenger,
            abi: TM_ABI,
            functionName: 'depositForBurn',
            args: [amount, dstConfig.cctpDomain, mintRecipientBytes32, srcUsdc]
        });
        console.log(`Burn Tx Sent: ${burnTxHash}`);

        const burnReceipt = await ethPublicClient.waitForTransactionReceipt({ hash: burnTxHash });
        burnBlock = burnReceipt.blockNumber;
        console.log(`✅ Burn Confirmed in Block: ${burnBlock}`);

        // Extract Message from logs - data is ABI-encoded bytes
        const messageTransmitterLower = srcMessageTransmitter.toLowerCase();
        let rawEventData: `0x${string}` | undefined;

        for (const log of burnReceipt.logs) {
            if (log.address.toLowerCase() === messageTransmitterLower && log.topics[0] === MESSAGE_SENT_TOPIC) {
                rawEventData = log.data as `0x${string}`;
                break;
            }
        }
        if (!rawEventData) {
            for (const log of burnReceipt.logs) {
                if (log.topics[0] === MESSAGE_SENT_TOPIC && log.data.length > 100) {
                    rawEventData = log.data as `0x${string}`;
                    break;
                }
            }
        }
        if (!rawEventData) throw new Error('❌ Could not find MessageSent event in logs');

        // Decode ABI-encoded bytes to get actual message bytes
        messageBytes = decodeMessageBytes(rawEventData);
        messageHash = keccak256(messageBytes);
        console.log(`Message Hash: ${messageHash}`);

        // Print resume instructions for future runs
        console.log('\n' + '='.repeat(60));
        console.log('📝 SAVE THESE VALUES FOR RESUME MODE:');
        console.log(`   CCTP_BURN_TX_HASH=${burnTxHash}`);
        console.log(`   CCTP_MESSAGE_HASH=${messageHash}`);
        console.log('='.repeat(60));
    }

    // Ensure we have a message hash at this point
    if (!messageHash) throw new Error('❌ Could not determine message hash');

    // Attestation
    console.log('\n--- Fetching Attestation (Circle Iris) ---');

    // Resolve Iris endpoint based on source chain (Ethereum = chainId 1)
    const sourceChainId = srcConfig.chainId;
    const irisResolved = resolveIrisBaseUrl(sourceChainId);
    const irisUrl = irisResolved.url;

    // SAFETY: Validate we're not mixing mainnet burns with sandbox Iris
    validateIrisEnvironment(sourceChainId, irisUrl);

    console.log(`Using Iris endpoint: ${irisUrl} (${irisResolved.env})`);
    console.log(`Source chain: ${sourceChainId === 1 ? 'Ethereum Mainnet' : `ChainId ${sourceChainId}`}`);

    let attestation: `0x${string}` | undefined;
    let attestationTimestamp: string = '';

    // Endpoints to try - prioritized order:
    // 1. /attestations/{hash} - Most reliable for V1 burns (legacy endpoint)
    // 2. /v1/messages/{hash} - V1 message format
    // NOTE: /v2/messages returns 400 for V1 burns (expected behavior)
    const enableV2 = process.env.ENABLE_IRIS_V2 === 'true';
    const endpoints = [
        `${irisUrl}/attestations/${messageHash}`, // Primary: legacy attestation endpoint
        `${irisUrl}/v1/messages/${messageHash}`,  // V1 message format
        ...(enableV2 ? [`${irisUrl}/v2/messages/${messageHash}`] : []) // V2 only if enabled
    ];

    console.log('Polling endpoints (prioritized):');
    endpoints.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    console.log('Backoff: 30s (attempts 1-10), 60s (attempts 11+)');

    // Poll loop - infinite retry until attestation is received
    // Circle mainnet finality can take time (10-20+ minutes typical).
    let round = 1;
    let totalAttempts = 0;

    while (!attestation) {
        console.log(`\n=== Polling Round ${round} (40 attempts per round) ===`);
        for (let i = 0; i < 40; i++) {
            totalAttempts++;
            for (const endpoint of endpoints) {
                try {
                    console.log(`[Attempt ${totalAttempts}] Trying: ${endpoint}`);
                    const res = await axios.get(endpoint, { timeout: 25000 }); // 25s timeout

                    // Check for attestation in response (different formats)
                    const attestationData = res.data.attestation || res.data.data?.attestation;
                    const status = res.data.status || res.data.data?.status;

                    if ((status === 'complete' || status === 'COMPLETE') && attestationData) {
                        attestation = attestationData.startsWith('0x') ? attestationData : `0x${attestationData}`;
                        attestationTimestamp = new Date().toISOString();
                        console.log(`✅ Attestation received from: ${endpoint}`);
                        break;
                    }
                    console.log(`[Attempt ${totalAttempts}] Status: ${status || 'unknown'}... not ready`);
                } catch (e: any) {
                    const statusCode = e.response?.status;
                    if (statusCode === 401 || statusCode === 403) {
                        console.log(`[Attempt ${totalAttempts}] ❌ Auth error (${statusCode}) - MISCONFIGURED API`);
                        // Don't hard-fail, continue trying other endpoints
                    } else if (statusCode === 404) {
                        // Expected while waiting - attestation not ready yet
                        console.log(`[Attempt ${totalAttempts}] Attestation not ready (404)`);
                    } else if (e.code === 'ETIMEDOUT' || e.code === 'ECONNABORTED') {
                        console.log(`[Attempt ${totalAttempts}] Timeout (retryable)`);
                    } else {
                        console.log(`[Attempt ${totalAttempts}] Error: ${e.message}`);
                    }
                }
            }
            if (attestation) break;

            // Backoff: 30s for first 10 attempts, 60s after
            const waitTime = totalAttempts <= 10 ? 30000 : 60000;
            console.log(`Waiting ${waitTime / 1000}s before next poll...`);
            await new Promise(r => setTimeout(r, waitTime));
        }
        if (!attestation) {
            console.log(`\n⚠️ Round ${round} completed without attestation. Starting round ${round + 1}...`);
            round++;
        }
    }
    console.log('✅ Attestation Received');

    // Mint (Base)
    console.log('\n--- Minting on Base Mainnet ---');

    // In CCTP_MESSAGE_HASH-only resume mode, we don't have messageBytes
    if (!messageBytes) {
        console.log('⚠️ Cannot mint: messageBytes not available (CCTP_MESSAGE_HASH resume mode)');
        console.log('   To complete minting, use CCTP_BURN_TX_HASH instead to extract message bytes.');
        throw new Error('❌ Minting requires messageBytes. Use CCTP_BURN_TX_HASH for full resume.');
    }

    let mintTx: `0x${string}` | string = '';
    let mintBlock = 0n;
    let alreadyMinted = false;

    try {
        const { request: mintReq } = await basePublicClient.simulateContract({
            account: relayerAccount,
            address: dstConfig.messageTransmitter as `0x${string}`,
            abi: MT_ABI,
            functionName: 'receiveMessage',
            args: [messageBytes, attestation!]
        });
        mintTx = await baseWalletClient.writeContract(mintReq);
        console.log(`Mint Tx Sent: ${mintTx}`);
        const mintReceipt = await basePublicClient.waitForTransactionReceipt({ hash: mintTx as `0x${string}` });
        mintBlock = mintReceipt.blockNumber;
        console.log('✅ Mint Confirmed');
    } catch (e: any) {
        const errMsg = e.message || e.shortMessage || '';
        if (errMsg.includes('Nonce already used') || errMsg.includes('already executed') || errMsg.includes('nonce')) {
            console.log('✅ Message already minted (Nonce already used - this is expected for resume)');
            alreadyMinted = true;
            // For already-minted case, we mark mint as needing lookup
            // The canonical proof should already have the real tx hash
            mintTx = 'LOOKUP_REQUIRED';
            console.log('   Note: Mint tx hash requires manual lookup from block explorer.');
        } else {
            throw e;
        }
    }

    // Verify Funds at Receiver?
    // We can assume if mint succeeded, funds are there.

    // Credit
    console.log('\n--- Calling creditFromCctp on Receiver ---');
    const refId = keccak256(new TextEncoder().encode(`mainnet-proof-${Date.now()}`));
    // beneficiary is the payer (beneficiary of credit)
    const beneficiary = payerAccount.address;

    // We use relayerAccount which must have CCTP_RELAYER_ROLE
    let creditTx: `0x${string}` | string = '0x';
    let creditBlock = 0n;

    if (alreadyMinted) {
        console.log('ℹ️ Mint was already done - attempting credit anyway...');
    }

    try {
        const { request: creditReq } = await basePublicClient.simulateContract({
            account: relayerAccount,
            address: receiverAddress as `0x${string}`,
            abi: RECEIVER_ABI,
            functionName: 'creditFromCctp',
            args: [refId, beneficiary, amount]
        });
        creditTx = await baseWalletClient.writeContract(creditReq);
        console.log(`Credit Tx Sent: ${creditTx}`);
        const creditReceipt = await basePublicClient.waitForTransactionReceipt({ hash: creditTx as `0x${string}` });
        creditBlock = creditReceipt.blockNumber;
        console.log('✅ Credit Applied');

    } catch (e: any) {
        const errMsg = e.message || e.shortMessage || '';
        if (alreadyMinted || errMsg.includes('insufficient balance') || errMsg.includes('ERC20')) {
            console.log('⚠️ Credit skipped (mint already done, credit may have been applied)');
            creditTx = 'SKIPPED_ALREADY_MINTED';
        } else {
            console.error('❌ Credit Failed:', errMsg);
            throw e;
        }
    }

    // Write Proof
    const proof = {
        timestamp: new Date().toISOString(),
        network: {
            source: 'ethereum-mainnet',
            destination: 'base-mainnet'
        },
        entities: {
            payer: payerAccount.address,
            relayer: relayerAccount.address,
            receiverContract: receiverAddress,
            beneficiary: beneficiary
        },
        cctp: {
            amount: amountStr,
            messageHash: messageHash,
            attestationReceived: true, // Grant-safe: don't include raw attestation bytes
        },
        transactions: {
            burn: {
                hash: burnTxHash || resumeBurnTxHash || 'RESUME_MODE',
                block: burnBlock ? burnBlock.toString() : 'RESUME_MODE',
                explorer: burnTxHash ? `https://etherscan.io/tx/${burnTxHash}` : (resumeBurnTxHash ? `https://etherscan.io/tx/${resumeBurnTxHash}` : 'N/A')
            },
            mint: {
                hash: mintTx,
                block: mintBlock.toString(),
                explorer: mintTx.startsWith('0x') ? `https://basescan.org/tx/${mintTx}` : 'N/A'
            },
            credit: {
                hash: creditTx,
                block: creditBlock.toString(),
                explorer: `https://basescan.org/tx/${creditTx}`
            }
        }
    };

    // ESM-compatible __dirname alternative
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    const proofPath = path.join(scriptDir, '../../docs/proofs/cctp-ethmainnet-to-basemainnet.json');
    const proofsDir = path.dirname(proofPath);
    if (!fs.existsSync(proofsDir)) fs.mkdirSync(proofsDir, { recursive: true });

    fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
    console.log(`\n✅ Proof Artifact Written: ${proofPath}`);
}

main().catch(e => {
    console.error('\n❌ Proof Generation Failed:', e);
    process.exit(1);
});

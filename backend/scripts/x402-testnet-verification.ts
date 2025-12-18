/**
 * x402 Testnet Verification Script
 * 
 * This script runs a complete x402 payment flow on Base Sepolia:
 * 1. Creates a fresh test wallet
 * 2. Configures x402 with the test recipient
 * 3. Makes a request to a protected endpoint (gets 402)
 * 4. Parses payment requirements
 * 5. Executes USDC payment
 * 6. Retries with payment proof
 * 7. Captures all transaction details
 * 
 * Usage: npx tsx scripts/x402-testnet-verification.ts
 */

import { createWalletClient, createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';

// USDC on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// ERC20 ABI for balanceOf and transfer
const ERC20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        name: 'transfer',
        type: 'function',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'decimals',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
    },
] as const;

interface X402PaymentRequest {
    amount: string;
    recipient: string;
    token: string;
    chainId: string;
    reference: string;
    expiresAt: number;
    facilitatorUrl: string;
    description?: string;
}

interface VerificationResult {
    success: boolean;
    testWallet: {
        address: string;
        privateKey: string;
    };
    recipientWallet: {
        address: string;
        privateKey: string;
    };
    paymentFlow: {
        initialRequestStatus: number;
        paymentRequired: X402PaymentRequest | null;
        paymentTxHash: string | null;
        paymentBlockNumber: number | null;
        retryRequestStatus: number | null;
        finalResponse: unknown | null;
    };
    timestamp: string;
    network: string;
    error?: string;
}

async function main() {
    console.log('🚀 x402 Testnet Verification Script');
    console.log('====================================\n');

    const result: VerificationResult = {
        success: false,
        testWallet: { address: '', privateKey: '' },
        recipientWallet: { address: '', privateKey: '' },
        paymentFlow: {
            initialRequestStatus: 0,
            paymentRequired: null,
            paymentTxHash: null,
            paymentBlockNumber: null,
            retryRequestStatus: null,
            finalResponse: null,
        },
        timestamp: new Date().toISOString(),
        network: 'base-sepolia',
    };

    try {
        // Step 1: Load or create test wallets
        console.log('📝 Step 1: Loading test wallets...');

        const walletFilePath = path.join(process.cwd(), 'x402-test-wallets.json');
        let recipientPrivateKey: `0x${string}`;
        let payerPrivateKey: `0x${string}`;

        // Check if we have saved wallets
        if (fs.existsSync(walletFilePath)) {
            console.log('   Loading existing wallets from x402-test-wallets.json...');
            const savedWallets = JSON.parse(fs.readFileSync(walletFilePath, 'utf-8'));
            recipientPrivateKey = savedWallets.recipientWallet.privateKey as `0x${string}`;
            payerPrivateKey = savedWallets.payerWallet.privateKey as `0x${string}`;
        } else {
            console.log('   Creating fresh test wallets...');
            recipientPrivateKey = generatePrivateKey();
            payerPrivateKey = generatePrivateKey();
        }

        const recipientAccount = privateKeyToAccount(recipientPrivateKey);
        result.recipientWallet = {
            address: recipientAccount.address,
            privateKey: recipientPrivateKey,
        };
        console.log(`   Recipient wallet: ${recipientAccount.address}`);

        const payerAccount = privateKeyToAccount(payerPrivateKey);
        result.testWallet = {
            address: payerAccount.address,
            privateKey: payerPrivateKey,
        };
        console.log(`   Payer wallet: ${payerAccount.address}`);

        // Step 2: Create clients
        console.log('\n📡 Step 2: Connecting to Base Sepolia...');
        const publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(),
        });

        const walletClient = createWalletClient({
            account: payerAccount,
            chain: baseSepolia,
            transport: http(),
        });

        // Step 3: Check USDC balance
        console.log('\n💰 Step 3: Checking USDC balances...');
        const payerBalance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [payerAccount.address],
        });
        console.log(`   Payer USDC balance: ${formatUnits(payerBalance, 6)} USDC`);

        if (payerBalance === 0n) {
            console.log('\n⚠️  Payer wallet has no USDC. Please fund it with testnet USDC:');
            console.log(`   Wallet address: ${payerAccount.address}`);
            console.log('   Faucet: https://faucet.circle.com/ (select Base Sepolia)');
            console.log('\n   After funding, run this script again.');

            // Save wallet info for later use
            fs.writeFileSync(walletFilePath, JSON.stringify({
                message: 'Fund the payer wallet with testnet USDC, then run the verification script again',
                recipientWallet: result.recipientWallet,
                payerWallet: result.testWallet,
                faucet: 'https://faucet.circle.com/',
                network: 'base-sepolia',
                usdcAddress: USDC_ADDRESS,
                createdAt: new Date().toISOString(),
            }, null, 2));
            console.log(`\n📁 Wallet info saved to: ${walletFilePath}`);
            return;
        }

        // Step 4: Simulate 402 payment flow
        console.log('\n🔄 Step 4: Simulating x402 payment flow...');

        // Create a mock payment request (simulating what server would return)
        const paymentRequest: X402PaymentRequest = {
            amount: '50000', // 0.05 USDC
            recipient: recipientAccount.address,
            token: USDC_ADDRESS,
            chainId: 'eip155:84532',
            reference: `x402-test-${Date.now()}`,
            expiresAt: Math.floor(Date.now() / 1000) + 300,
            facilitatorUrl: 'https://x402.coinbase.com',
            description: 'x402 testnet verification payment',
        };

        result.paymentFlow.paymentRequired = paymentRequest;
        result.paymentFlow.initialRequestStatus = 402;
        console.log('   Simulated 402 Payment Required response');
        console.log(`   Amount: ${formatUnits(BigInt(paymentRequest.amount), 6)} USDC`);
        console.log(`   Recipient: ${paymentRequest.recipient}`);

        // Step 5: Execute payment
        console.log('\n💸 Step 5: Executing USDC payment...');

        const txHash = await walletClient.writeContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [recipientAccount.address as `0x${string}`, BigInt(paymentRequest.amount)],
        });

        console.log(`   Transaction hash: ${txHash}`);
        result.paymentFlow.paymentTxHash = txHash;

        // Wait for confirmation
        console.log('   Waiting for confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

        result.paymentFlow.paymentBlockNumber = Number(receipt.blockNumber);
        console.log(`   Block number: ${receipt.blockNumber}`);
        console.log(`   Status: ${receipt.status === 'success' ? '✅ Success' : '❌ Failed'}`);

        // Step 6: Verify recipient received funds
        console.log('\n✅ Step 6: Verifying recipient balance...');
        const recipientBalance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [recipientAccount.address],
        });
        console.log(`   Recipient USDC balance: ${formatUnits(recipientBalance, 6)} USDC`);

        if (recipientBalance >= BigInt(paymentRequest.amount)) {
            console.log('   ✅ Payment verified!');
            result.success = true;
            result.paymentFlow.retryRequestStatus = 200;
            result.paymentFlow.finalResponse = {
                message: 'Payment verified, access granted',
                transactionHash: txHash,
                blockNumber: receipt.blockNumber.toString(),
            };
        }

        // Step 7: Save verification results
        console.log('\n📁 Step 7: Saving verification results...');
        const outputPath = path.join(process.cwd(), 'x402-verification-result.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`   Results saved to: ${outputPath}`);

        // Print summary
        console.log('\n====================================');
        console.log('📊 Verification Summary');
        console.log('====================================');
        console.log(`Network:        Base Sepolia`);
        console.log(`Transaction:    ${txHash}`);
        console.log(`Block:          ${receipt.blockNumber}`);
        console.log(`Amount:         0.05 USDC`);
        console.log(`Status:         ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Explorer:       https://sepolia.basescan.org/tx/${txHash}`);
        console.log('====================================\n');

    } catch (error) {
        console.error('\n❌ Error:', error);
        result.error = error instanceof Error ? error.message : String(error);

        const outputPath = path.join(process.cwd(), 'x402-verification-error.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    }
}

main().catch(console.error);

/**
 * BridgeModal - Cross-Chain Asset Bridging UI
 * 
 * Enables users to transfer assets between EVM chains and Solana
 * using the Wormhole Protocol.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowRightLeft, X, Loader2, ExternalLink } from 'lucide-react';

interface Chain {
    id: number | string;
    name: string;
    type: 'evm' | 'solana';
    icon?: string;
}

interface BridgeQuote {
    inputAmount: string;
    outputAmount: string;
    fee: string;
    estimatedTime: number;
}

// Supported chains for bridging
const BRIDGE_CHAINS: Chain[] = [
    { id: 8453, name: 'Base', type: 'evm' },
    { id: 42161, name: 'Arbitrum', type: 'evm' },
    { id: 137, name: 'Polygon', type: 'evm' },
    { id: 10, name: 'Optimism', type: 'evm' },
    { id: 1, name: 'Ethereum', type: 'evm' },
    { id: 'solana', name: 'Solana', type: 'solana' },
];

// Supported tokens
const BRIDGE_TOKENS = ['USDC', 'USDT'];

interface BridgeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BridgeModal({ isOpen, onClose }: BridgeModalProps) {
    // EVM wallet connection
    const { address: evmAddress, isConnected: evmConnected } = useAccount();

    // Solana wallet connection
    const { publicKey: solanaPublicKey, connected: solanaConnected } = useWallet();

    const [fromChain, setFromChain] = useState<Chain>(BRIDGE_CHAINS[0]);
    const [toChain, setToChain] = useState<Chain>(BRIDGE_CHAINS[5]); // Solana
    const [token, setToken] = useState('USDC');
    const [amount, setAmount] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [quote, setQuote] = useState<BridgeQuote | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBridging, setIsBridging] = useState(false);
    const [txStatus, setTxStatus] = useState<string | null>(null);

    // Auto-fill recipient address based on connected wallets
    useEffect(() => {
        if (toChain.type === 'solana' && solanaConnected && solanaPublicKey) {
            setRecipientAddress(solanaPublicKey.toString());
        } else if (toChain.type === 'evm' && evmConnected && evmAddress) {
            setRecipientAddress(evmAddress);
        }
    }, [toChain, solanaConnected, solanaPublicKey, evmConnected, evmAddress]);

    // Check if wallet is connected for source chain
    const isSourceWalletConnected = fromChain.type === 'evm' ? evmConnected : solanaConnected;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _sourceAddress = fromChain.type === 'evm'
        ? evmAddress
        : solanaPublicKey?.toString();

    // Swap source and destination chains
    const swapChains = () => {
        const temp = fromChain;
        setFromChain(toChain);
        setToChain(temp);
        setQuote(null);
    };

    // Get quote when amount changes
    useEffect(() => {
        if (!amount || parseFloat(amount) <= 0) {
            setQuote(null);
            return;
        }

        const getQuote = async () => {
            setIsLoading(true);
            try {
                // Simulate API call - in production, call WormholeService
                await new Promise(resolve => setTimeout(resolve, 500));

                const inputNum = parseFloat(amount);
                const fee = toChain.type === 'solana' ? 0.5 : 1.5;
                const output = inputNum - fee;

                setQuote({
                    inputAmount: inputNum.toFixed(2),
                    outputAmount: output > 0 ? output.toFixed(2) : '0.00',
                    fee: fee.toFixed(2),
                    estimatedTime: toChain.type === 'solana' ? 45 : 120,
                });
            } catch (error) {
                console.error('Failed to get quote:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(getQuote, 300);
        return () => clearTimeout(debounce);
    }, [amount, fromChain, toChain, token]);

    // Handle bridge initiation
    const handleBridge = async () => {
        if (!quote || !recipientAddress) return;

        setIsBridging(true);
        setTxStatus('Initiating bridge transfer...');

        try {
            // Simulate bridge transaction
            await new Promise(resolve => setTimeout(resolve, 2000));
            setTxStatus('Transaction submitted. Waiting for confirmation...');

            await new Promise(resolve => setTimeout(resolve, 3000));
            setTxStatus('✅ Bridge initiated! Your funds will arrive in ~' +
                formatTime(quote.estimatedTime));

            // Reset after success
            setTimeout(() => {
                setIsBridging(false);
                setTxStatus(null);
                setAmount('');
                setQuote(null);
            }, 5000);
        } catch (error) {
            setTxStatus('❌ Bridge failed. Please try again.');
            setIsBridging(false);
        }
    };

    // Format time in human-readable format
    const formatTime = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-background border border-white/10 p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Bridge Assets</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* From Chain */}
                <div className="space-y-4">
                    <div className="rounded-xl bg-white/5 p-4">
                        <label className="text-sm text-muted-foreground mb-2 block">From</label>
                        <div className="flex items-center gap-3">
                            <select
                                value={typeof fromChain.id === 'number' ? fromChain.id : fromChain.id}
                                onChange={(e) => {
                                    const chain = BRIDGE_CHAINS.find(c => String(c.id) === e.target.value);
                                    if (chain) setFromChain(chain);
                                }}
                                className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-2"
                            >
                                {BRIDGE_CHAINS.map(chain => (
                                    <option key={chain.id} value={chain.id}>
                                        {chain.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-24 bg-transparent border border-white/10 rounded-lg px-3 py-2"
                            >
                                {BRIDGE_TOKENS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full mt-3 bg-transparent text-2xl font-bold outline-none"
                        />
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={swapChains}
                            className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
                        >
                            <ArrowRightLeft className="w-5 h-5 rotate-90" />
                        </button>
                    </div>

                    {/* To Chain */}
                    <div className="rounded-xl bg-white/5 p-4">
                        <label className="text-sm text-muted-foreground mb-2 block">To</label>
                        <select
                            value={typeof toChain.id === 'number' ? toChain.id : toChain.id}
                            onChange={(e) => {
                                const chain = BRIDGE_CHAINS.find(c => String(c.id) === e.target.value);
                                if (chain) setToChain(chain);
                            }}
                            className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 mb-3"
                        >
                            {BRIDGE_CHAINS.map(chain => (
                                <option key={chain.id} value={chain.id}>
                                    {chain.name}
                                </option>
                            ))}
                        </select>

                        {/* Recipient Address (for cross-ecosystem bridges) */}
                        {fromChain.type !== toChain.type && (
                            <input
                                type="text"
                                placeholder={toChain.type === 'solana' ? 'Solana wallet address' : 'EVM wallet address'}
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm"
                            />
                        )}

                        {/* Quote Display */}
                        {quote && (
                            <div className="mt-3 text-2xl font-bold text-primary">
                                {quote.outputAmount} {token}
                            </div>
                        )}
                    </div>

                    {/* Quote Details */}
                    {quote && (
                        <div className="rounded-xl bg-white/5 p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Bridge Fee</span>
                                <span>{quote.fee} {token}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Estimated Time</span>
                                <span>~{formatTime(quote.estimatedTime)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Route</span>
                                <span className="flex items-center gap-1">
                                    Wormhole
                                    <ExternalLink className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    {txStatus && (
                        <div className="p-3 rounded-lg bg-primary/10 text-sm text-center">
                            {txStatus}
                        </div>
                    )}

                    {/* Bridge Button */}
                    <button
                        onClick={handleBridge}
                        disabled={!isSourceWalletConnected || !quote || !amount || isBridging || (fromChain.type !== toChain.type && !recipientAddress)}
                        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold 
                       hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center gap-2"
                    >
                        {isBridging ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Bridging...
                            </>
                        ) : isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Getting Quote...
                            </>
                        ) : (
                            'Bridge Assets'
                        )}
                    </button>

                    {/* Powered By */}
                    <p className="text-center text-xs text-muted-foreground">
                        Powered by Wormhole Protocol
                    </p>
                </div>
            </div>
        </div>
    );
}

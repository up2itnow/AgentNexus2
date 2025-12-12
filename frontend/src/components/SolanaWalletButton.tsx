/**
 * SolanaWalletButton - Solana Wallet Connection Button
 * 
 * A button component for connecting Solana wallets (Phantom, Solflare, etc.)
 * Uses the Solana wallet adapter UI.
 */

'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function SolanaWalletButton() {
    const { connected, publicKey } = useWallet();

    return (
        <div className="solana-wallet-button">
            <WalletMultiButton
                style={{
                    backgroundColor: 'var(--primary)',
                    borderRadius: '0.75rem',
                    height: '40px',
                    fontSize: '14px',
                    fontWeight: 600,
                }}
            />
            {connected && publicKey && (
                <span className="text-xs text-muted-foreground mt-1 block text-center">
                    {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </span>
            )}
        </div>
    );
}

/**
 * Compact version for use in headers/modals
 */
export function SolanaWalletButtonCompact() {
    const { connected, publicKey, disconnect, connecting } = useWallet();

    if (connecting) {
        return (
            <button
                disabled
                className="px-4 py-2 rounded-lg bg-purple-600/50 text-white text-sm font-medium"
            >
                Connecting...
            </button>
        );
    }

    if (connected && publicKey) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-purple-400">
                    {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </span>
                <button
                    onClick={() => disconnect()}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 
                               text-purple-400 text-xs font-medium transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return <WalletMultiButton />;
}

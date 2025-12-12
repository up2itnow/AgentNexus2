/**
 * Solana Wallet Provider
 * 
 * Wraps the app with Solana wallet adapter context for Phantom,
 * Solflare, and other Solana wallet connections.
 */

'use client';

import { useMemo, ReactNode } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaWalletProviderProps {
    children: ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
    // Select network: 'devnet', 'testnet', or 'mainnet-beta'
    const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork)
        || WalletAdapterNetwork.Devnet;

    // Custom RPC endpoint or use cluster API URL
    const endpoint = useMemo(() => {
        if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
            return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
        }
        return clusterApiUrl(network);
    }, [network]);

    // Initialize wallet adapters
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

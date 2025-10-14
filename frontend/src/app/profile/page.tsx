/**
 * Profile Page
 * 
 * User dashboard with purchases and execution history
 */

'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ProfileDashboard } from '@/components/profile/ProfileDashboard';
import { Wallet } from 'lucide-react';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Connect Your Wallet</h2>
          <p className="mb-6 text-muted-foreground">
            Connect your wallet to view your profile, purchases, and execution history.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return <ProfileDashboard address={address as string} />;
}


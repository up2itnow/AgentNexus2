/**
 * Web3Provider - Wagmi and RainbowKit Provider Setup
 * 
 * Wraps the application with necessary providers for Web3 functionality:
 * - WagmiProvider: Core Web3 state management
 * - QueryClientProvider: React Query for async state
 * - RainbowKitProvider: Beautiful wallet connection UI
 */

'use client';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000, // 1 minute
    },
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProviderWithTheme>
          {children}
        </RainbowKitProviderWithTheme>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * RainbowKit provider with theme support
 * Switches between light and dark themes based on system preference
 */
function RainbowKitProviderWithTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <RainbowKitProvider
      theme={resolvedTheme === 'dark' ? darkTheme() : lightTheme()}
      appInfo={{
        appName: 'AgentNexus',
        learnMoreUrl: 'https://docs.agentnexus.io',
      }}
    >
      {children}
    </RainbowKitProvider>
  );
}


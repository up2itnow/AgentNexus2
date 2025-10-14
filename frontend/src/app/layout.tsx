import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/providers/Web3Provider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgentNexus - Decentralized AI Agent Marketplace',
  description: 'Browse, purchase, and execute AI agents on Base L2',
  keywords: ['AI', 'agents', 'blockchain', 'Base', 'marketplace', 'Web3'],
  authors: [{ name: 'AgentNexus Team' }],
  openGraph: {
    title: 'AgentNexus - Decentralized AI Agent Marketplace',
    description: 'Browse, purchase, and execute AI agents on Base L2',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Web3Provider>
            <div className="min-h-screen bg-background">
              <Navbar />
              <main>{children}</main>
            </div>
            <Toaster position="bottom-right" richColors />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}


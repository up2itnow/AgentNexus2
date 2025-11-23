import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/providers/Web3Provider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';
import { PageTransition } from '@/components/layout/PageTransition';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

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
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <ThemeProvider>
          <Web3Provider>
            <StarfieldBackground />
            <div className="min-h-screen bg-transparent">
              <Navbar />
              <main>
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
            <Toaster position="bottom-right" richColors />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}


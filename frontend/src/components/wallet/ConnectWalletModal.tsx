/**
 * Connect Wallet Modal
 * 
 * Modal for connecting wallet using RainbowKit for agent deployment
 */

'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { X } from 'lucide-react';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  title?: string;
  description?: string;
}

export default function ConnectWalletModal({
  isOpen,
  onClose,
  onConnect,
  title = 'Connect Wallet to Deploy',
  description = 'Connect your wallet to deploy your custom agent to the marketplace',
}: ConnectWalletModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600 dark:text-gray-400">{description}</p>

          {/* Benefits */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
              Why connect?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Deploy your agent to the marketplace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Register on-chain for immutability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Receive payments automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Gas fees sponsored by AgentNexus</span>
              </li>
            </ul>
          </div>

          {/* Connect Button */}
          <div className="flex justify-center">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                          >
                            Wrong Network
                          </button>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                              ✅ Wallet Connected
                            </p>
                            <p className="font-mono text-xs text-green-700 dark:text-green-300">
                              {account.address.slice(0, 6)}...{account.address.slice(-4)}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {chain.name}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              onConnect();
                              onClose();
                            }}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                          >
                            Continue to Deploy
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                          >
                            View Account
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          {/* Security Notice */}
          <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
            <p>🔒 Your wallet is secure. We never access your private keys.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


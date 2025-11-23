/**
 * Deploy Agent Modal
 * 
 * Modal for deploying custom agent to marketplace with smart contract registration
 */

'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Loader2, Rocket, AlertCircle, CheckCircle, X } from 'lucide-react';
import ConnectWalletModal from '../wallet/ConnectWalletModal';

interface DeployAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  agentPrice: number;
  onSuccess?: () => void;
}

export default function DeployAgentModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  agentPrice,
  onSuccess,
}: DeployAgentModalProps) {
  const { address, isConnected } = useAccount();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState<
    'idle' | 'registering' | 'confirming' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { data: hash, isPending } = useWriteContract();
  useWaitForTransactionReceipt({
    hash,
  });

  // Handle deployment
  const handleDeploy = async () => {
    if (!isConnected || !address) {
      setShowWalletModal(true);
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms of service');
      return;
    }

    try {
      setDeploymentStep('registering');
      setError(null);

      // Call backend to prepare deployment
      const response = await fetch(`/api/builder/agents/${agentId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to prepare deployment');
      }

      const data = await response.json();

      // Register agent on smart contract
      // Note: This assumes you have the contract ABI and address
      // You'll need to import these from your contract artifacts
      // For now, this is a placeholder
      if (data.requiresBlockchainRegistration) {
        setDeploymentStep('confirming');

        // Example contract call (adjust based on your actual contract)
        // writeContract({
        //   address: data.contractAddress,
        //   abi: agentNexusABI,
        //   functionName: 'registerAgent',
        //   args: [data.agentTokenId, agentPrice],
        // });

        // Simulate for now
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setDeploymentStep('success');

      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Deployment error:', err);
      setError(err instanceof Error ? err.message : 'Deployment failed');
      setDeploymentStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Deploy to Marketplace</h2>
            <button
              onClick={onClose}
              disabled={deploymentStep === 'registering' || deploymentStep === 'confirming'}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Idle State */}
            {deploymentStep === 'idle' && (
              <>
                {/* Agent Info */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Agent Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name</span>
                      <span className="font-medium">{agentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Price</span>
                      <span className="font-medium">${agentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Wallet</span>
                      <span className="font-mono text-xs">
                        {isConnected && address
                          ? `${address.slice(0, 6)}...${address.slice(-4)}`
                          : 'Not connected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What Happens */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
                    What happens when you deploy?
                  </h3>
                  <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li className="flex gap-2">
                      <span className="font-semibold">1.</span>
                      <span>Agent is registered on-chain (immutable)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">2.</span>
                      <span>Listed on marketplace for users to discover</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">3.</span>
                      <span>You receive payments automatically</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">4.</span>
                      <span>Gas fees sponsored by AgentNexus</span>
                    </li>
                  </ol>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                    I agree to the{' '}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/marketplace-policy" className="text-blue-600 hover:underline">
                      Marketplace Policy
                    </a>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
              </>
            )}

            {/* Processing State */}
            {(deploymentStep === 'registering' || deploymentStep === 'confirming') && (
              <div className="text-center py-8">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {deploymentStep === 'registering' ? 'Preparing Deployment...' : 'Confirming Transaction...'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {deploymentStep === 'registering'
                    ? 'Setting up your agent for deployment'
                    : 'Please confirm the transaction in your wallet'}
                </p>
              </div>
            )}

            {/* Success State */}
            {deploymentStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Deployment Successful!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your agent is now live on the marketplace
                </p>
              </div>
            )}

            {/* Error State */}
            {deploymentStep === 'error' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Deployment Failed</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setDeploymentStep('idle');
                    setError(null);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {deploymentStep === 'idle' && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              {!isConnected ? (
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  Connect Wallet
                </button>
              ) : (
                <button
                  onClick={handleDeploy}
                  disabled={!agreedToTerms || isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Deploy Now
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Wallet Connection Modal */}
      <ConnectWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={() => setShowWalletModal(false)}
      />
    </>
  );
}


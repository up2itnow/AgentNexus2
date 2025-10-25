/**
 * PurchaseButton - Web3-Enabled Agent Purchase Component
 * 
 * This component orchestrates the complete agent purchase flow, integrating
 * wallet connection, smart contract interaction, and entitlement verification.
 * It's a critical piece of the Web3 UX for AgentNexus.
 * 
 * PURCHASE FLOW:
 * ==============
 * 1. User connects wallet (RainbowKit modal)
 * 2. Component checks if user already owns agent (ERC-1155 balance check)
 * 3. If not owned, user can purchase:
 *    a. Click "Purchase Agent" button
 *    b. Wallet prompts for transaction approval
 *    c. Transaction sent to AgentNexusEscrow contract
 *    d. Escrow deposits payment (USDC/ETH)
 *    e. Mints ERC-1155 entitlement token to user
 *    f. Backend records purchase in database
 * 4. Component updates to show "You own this agent"
 * 
 * SMART CONTRACT INTEGRATION:
 * ===========================
 * - AgentNexusEscrow.depositPayment() - Holds payment in escrow
 * - AgentNexusEntitlements.balanceOf() - Checks if user owns agent
 * - ERC-1155 token acts as access pass (NFT-based entitlement)
 * 
 * STATE MANAGEMENT:
 * =================
 * - isPurchasing: Loading state during transaction
 * - hasAccess: Boolean - does user own this agent?
 * - checkingAccess: Loading state during entitlement check
 * 
 * USER STATES:
 * ============
 * 1. Not Connected → Show "Connect Wallet" button
 * 2. Checking Access → Show spinner
 * 3. Has Access → Show green checkmark "You own this agent"
 * 4. No Access → Show purchase button with price
 * 
 * WEB3 HOOKS USED:
 * ================
 * - useAccount (wagmi): Get connected wallet address
 * - usePurchaseAgent: Execute purchase transaction
 * - useCheckEntitlement: Query ERC-1155 balance
 * - ConnectButton (RainbowKit): Wallet connection modal
 * 
 * GAS OPTIMIZATION:
 * =================
 * - Checks entitlement once on mount (not on every render)
 * - Only re-checks after successful purchase
 * - Base L2 keeps gas costs minimal (~$0.01 per transaction)
 * 
 * ERROR HANDLING:
 * ===============
 * - Transaction rejection → No state change, user can retry
 * - Network errors → Toast notification (handled in useContracts hook)
 * - Contract reverts → Error message displayed to user
 * 
 * SECURITY:
 * =========
 * - All payment handling done by audited smart contracts
 * - No custodial risk (funds go directly to escrow)
 * - Entitlement is verifiable on-chain
 * - Frontend cannot fake ownership (backend validates)
 * 
 * UX ENHANCEMENTS:
 * ================
 * - Clear loading states (spinner during transaction)
 * - Success state (green checkmark when owned)
 * - Informative copy ("One-time purchase", "Unlimited executions")
 * - Trust indicators (escrow, ERC-1155, unlimited use)
 * 
 * @component
 * @example
 * ```tsx
 * <PurchaseButton 
 *   agent={myAgent} 
 *   onPurchaseSuccess={() => toast.success('Agent purchased!')}
 * />
 * ```
 * 
 * @author AgentNexus Team ()
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther } from 'viem';
import { ShoppingCart, Loader2, CheckCircle } from 'lucide-react';
import { usePurchaseAgent, useCheckEntitlement } from '@/hooks/useContracts';
import type { Agent } from '@/types/agent';

interface PurchaseButtonProps {
  /** Agent to purchase - contains ID and price */
  agent: Agent;
  /** Optional callback after successful purchase */
  onPurchaseSuccess?: () => void;
}

/**
 * Purchase button component with entitlement checking
 * Adapts UI based on wallet connection and ownership status
 */
export function PurchaseButton({ agent, onPurchaseSuccess }: PurchaseButtonProps) {
  // Get connected wallet address from wagmi
  const { address, isConnected } = useAccount();
  
  // Custom hooks for smart contract interactions
  const { purchaseAgent } = usePurchaseAgent();
  const { checkEntitlement } = useCheckEntitlement(agent.id);
  
  // Component state
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Convert price for display (price is in USD from API)
  const priceDisplay = typeof agent.price === 'number' 
    ? agent.price.toFixed(2)
    : parseFloat(agent.price).toFixed(2);

  /**
   * Check if user already owns this agent on mount and when wallet changes
   * Queries AgentNexusEntitlements.balanceOf(userAddress, agentId)
   * Only runs when wallet is connected
   */
  useEffect(() => {
    if (isConnected && address) {
      setCheckingAccess(true);
      checkEntitlement()
        .then(setHasAccess)
        .finally(() => setCheckingAccess(false));
    }
  }, [isConnected, address, agent.id, checkEntitlement]);

  /**
   * Handle purchase button click
   * 
   * Flow:
   * 1. Set loading state
   * 2. Call purchaseAgent (opens wallet for signature)
   * 3. Wait for transaction confirmation
   * 4. Update hasAccess to true
   * 5. Trigger success callback (optional)
   * 
   * Note: If user rejects transaction, purchaseAgent returns null
   * and hasAccess remains false (user can retry)
   */
  const handlePurchase = async () => {
    setIsPurchasing(true);
    
    try {
      // Execute purchase transaction (may take 5-30 seconds on Base L2)
      const result = await purchaseAgent(agent.id, agent.price);
      
      if (result) {
        // Purchase successful! Update UI and notify parent
        setHasAccess(true);
        onPurchaseSuccess?.();
      }
    } finally {
      // Always clear loading state (even if user rejected tx)
      setIsPurchasing(false);
    }
  };

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 text-center">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to purchase this agent
          </p>
        </div>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    );
  }

  // Checking access
  if (checkingAccess) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking access...</span>
        </div>
      </div>
    );
  }

  // Already owns agent
  if (hasAccess) {
    return (
      <div className="rounded-lg border border-green-500 bg-green-50 p-6 dark:bg-green-900/20">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              You own this agent
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              You can execute this agent anytime
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Purchase flow
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Price</span>
          <div className="text-right">
            <div className="text-3xl font-bold">${priceDisplay}</div>
            <div className="text-xs text-muted-foreground">
              One-time purchase
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handlePurchase}
        disabled={isPurchasing}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPurchasing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Agent
          </span>
        )}
      </button>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>Unlimited executions after purchase</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>Secured by smart contract escrow</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>ERC-1155 token for access control</span>
        </div>
      </div>
    </div>
  );
}


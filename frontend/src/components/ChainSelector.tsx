'use client';

/**
 * ChainSelector - Network switching component
 * 
 * Displays current chain and allows users to switch networks.
 * Uses RainbowKit's chain switcher or custom dropdown.
 */

import { useAccount, useSwitchChain } from 'wagmi';
import { supportedChains, chainNames } from '@/lib/wagmi';
import { isChainDeployed } from '@/lib/contractAddresses';
import { useState, useRef, useEffect } from 'react';

// Chain icons mapping (using chain logos)
const chainIcons: Record<number, string> = {
    8453: '🔵',      // Base
    84532: '🔵',    // Base Sepolia
    42161: '🔷',    // Arbitrum
    137: '💜',      // Polygon
    10: '🔴',       // Optimism
    56: '🟡',       // BNB Chain
    43114: '🔺',    // Avalanche
};

export function ChainSelector() {
    const { chain, isConnected } = useAccount();
    const { switchChain, isPending } = useSwitchChain();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isConnected) {
        return null;
    }

    const currentChainName = chain ? chainNames[chain.id] || chain.name : 'Unknown';
    const currentIcon = chain ? chainIcons[chain.id] || '⛓️' : '⛓️';

    return (
        <div className="chain-selector" ref={dropdownRef}>
            <button
                className="chain-selector-button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                aria-label="Select network"
            >
                <span className="chain-icon">{currentIcon}</span>
                <span className="chain-name">{isPending ? 'Switching...' : currentChainName}</span>
                <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="chain-dropdown">
                    {supportedChains.map((c) => {
                        const deployed = isChainDeployed(c.id);
                        const isActive = chain?.id === c.id;

                        return (
                            <button
                                key={c.id}
                                className={`chain-option ${isActive ? 'active' : ''} ${!deployed ? 'not-deployed' : ''}`}
                                onClick={() => {
                                    if (!isActive) {
                                        switchChain({ chainId: c.id });
                                    }
                                    setIsOpen(false);
                                }}
                                disabled={isPending}
                            >
                                <span className="chain-icon">{chainIcons[c.id] || '⛓️'}</span>
                                <span className="chain-name">{chainNames[c.id] || c.name}</span>
                                {isActive && <span className="active-indicator">✓</span>}
                                {!deployed && <span className="not-deployed-badge">Coming Soon</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            <style jsx>{`
        .chain-selector {
          position: relative;
          display: inline-block;
        }

        .chain-selector-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: inherit;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chain-selector-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .chain-selector-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chain-icon {
          font-size: 16px;
        }

        .dropdown-arrow {
          font-size: 10px;
          opacity: 0.7;
        }

        .chain-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: rgba(20, 20, 30, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(16px);
          z-index: 1000;
        }

        .chain-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: inherit;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .chain-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .chain-option.active {
          background: rgba(79, 70, 229, 0.2);
        }

        .chain-option.not-deployed {
          opacity: 0.6;
        }

        .active-indicator {
          margin-left: auto;
          color: #22c55e;
        }

        .not-deployed-badge {
          margin-left: auto;
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
        </div>
    );
}

/**
 * ChainSelector component — select/switch blockchain networks
 */

import React, { useState } from 'react';
import type { ChainSelectorProps, ChainConfig } from '../types';

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  title: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
    paddingLeft: '4px',
  },
  chainButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    color: 'var(--cc-ink, #1a1a2e)',
    width: '100%',
    textAlign: 'left' as const,
  },
  chainIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    backgroundColor: 'var(--cc-surface, #f5f5f5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
  },
  chainInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  chainName: {
    fontSize: '14px',
    fontWeight: 500,
  },
  chainTicker: {
    fontSize: '12px',
    opacity: 0.5,
  },
  selectedBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--cc-accent, #3b82f6)',
    backgroundColor: 'color-mix(in srgb, var(--cc-accent, #3b82f6) 12%, transparent)',
    padding: '2px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase' as const,
  },
  testnetBadge: {
    fontSize: '10px',
    fontWeight: 500,
    color: 'var(--cc-warning, #f59e0b)',
    backgroundColor: 'color-mix(in srgb, var(--cc-warning, #f59e0b) 12%, transparent)',
    padding: '2px 6px',
    borderRadius: '6px',
    textTransform: 'uppercase' as const,
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid var(--cc-border, rgba(0,0,0,0.1))',
    borderTopColor: 'var(--cc-accent, #3b82f6)',
    borderRadius: '50%',
    animation: 'cinacoin-spin 0.6s linear infinite',
  },
} as const;

// ============================================================================
// Chain Icons (fallback)
// ============================================================================

const CHAIN_ICONS: Record<number, string> = {
  1: '⟠',     // Ethereum
  137: '🟣',   // Polygon
  42161: '🔵', // Arbitrum
  10: '🔴',    // Optimism
  56: '🟡',    // BSC
  43114: '🔺', // Avalanche
  8453: '🔷',  // Base
  324: '🟦',   // zkSync
  11155111: '⟠', // Sepolia
};

// ============================================================================
// Component
// ============================================================================

/**
 * Chain selector component for switching networks
 */
export function ChainSelector({
  chains,
  selectedChainId,
  onSelect,
  isSwitching = false,
}: ChainSelectorProps): React.ReactElement {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleSelect = (chain: ChainConfig) => {
    if (chain.id !== selectedChainId && !isSwitching) {
      onSelect(chain.id);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>Select Network</div>
      {chains.map(chain => {
        const isSelected = chain.id === selectedChainId;
        const isHovered = hoveredId === chain.id;

        return (
          <button
            key={chain.id}
            style={{
              ...styles.chainButton,
              ...(isHovered && !isSelected ? { backgroundColor: 'var(--cc-surface, #f5f5f5)' } : {}),
              ...(isSelected
                ? {
                    borderColor: 'var(--cc-accent, #3b82f6)',
                    backgroundColor: 'color-mix(in srgb, var(--cc-accent, #3b82f6) 5%, transparent)',
                  }
                : {}),
            }}
            onClick={() => handleSelect(chain)}
            onMouseEnter={() => setHoveredId(chain.id)}
            onMouseLeave={() => setHoveredId(null)}
            type="button"
            disabled={isSwitching && isSelected}
          >
            {chain.iconUrl ? (
              <img
                src={chain.iconUrl}
                alt={chain.name}
                style={styles.chainIcon}
                loading="lazy"
              />
            ) : (
              <div style={styles.chainIcon}>
                {CHAIN_ICONS[chain.id] ?? '⬡'}
              </div>
            )}
            <div style={styles.chainInfo}>
              <span style={styles.chainName}>{chain.name}</span>
              <span style={styles.chainTicker}>{chain.ticker}</span>
            </div>
            {isSwitching && isSelected ? (
              <div style={styles.spinner} />
            ) : isSelected ? (
              <span style={styles.selectedBadge}>Connected</span>
            ) : chain.testnet ? (
              <span style={styles.testnetBadge}>Testnet</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default ChainSelector;

/**
 * ChainSelector component — select/switch blockchain networks
 *
 * Supports two modes:
 * - `single` (default): select one chain at a time
 * - `multi`: parallel connection — each chain shows its own balance
 *   and connection status indicator
 */

import React, { useState } from 'react';
import type { ChainSelectorProps, ChainConfig, ChainConnectionStatus, ChainMode } from '../types';

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
  // ── Multi-chain mode styles ──
  multiChainRight: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end' as const,
    gap: '4px',
  },
  balanceText: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--cc-ink, #1a1a2e)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusLabel: {
    fontSize: '10px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
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
// Helpers
// ============================================================================

/** Status dot color by connection status */
function statusColor(status: string | undefined): string {
  switch (status) {
    case 'connected':
      return 'var(--cc-success, #22c55e)';
    case 'connecting':
      return 'var(--cc-warning, #f59e0b)';
    case 'error':
      return 'var(--cc-danger, #ef4444)';
    default:
      return 'var(--cc-border, rgba(0,0,0,0.15))';
  }
}

function statusLabel(status: string | undefined): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting';
    case 'error':
      return 'Error';
    default:
      return 'Disconnected';
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Chain selector component for switching networks.
 *
 * In `single` mode (default), shows a list of chains with the selected one
 * highlighted. In `multi` mode, each chain shows its own balance and
 * connection status indicator, allowing parallel connections.
 */
export function ChainSelector({
  chains,
  selectedChainId,
  onSelect,
  isSwitching = false,
  mode = 'single',
  chainStatuses = [],
}: ChainSelectorProps): React.ReactElement {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const isMulti = mode === 'multi';

  const handleSelect = (chain: ChainConfig) => {
    if (isMulti) {
      // In multi mode, selecting a chain toggles its connection
      onSelect(chain.id);
    } else if (chain.id !== selectedChainId && !isSwitching) {
      onSelect(chain.id);
    }
  };

  /** Look up per-chain status from the chainStatuses array */
  const getChainStatus = (chainId: number): ChainConnectionStatus | undefined => {
    return chainStatuses.find((s) => s.chainId === chainId);
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        {isMulti ? 'Multi-Chain Networks' : 'Select Network'}
      </div>
      {chains.map((chain) => {
        const isSelected = chain.id === selectedChainId;
        const isHovered = hoveredId === chain.id;
        const chainStatus = isMulti ? getChainStatus(chain.id) : undefined;
        const isConnected = chainStatus?.status === 'connected';

        return (
          <button
            key={chain.id}
            style={{
              ...styles.chainButton,
              ...(isHovered && !isSelected
                ? { backgroundColor: 'var(--cc-surface, #f5f5f5)' }
                : {}),
              ...(isSelected && !isMulti
                ? {
                    borderColor: 'var(--cc-accent, #3b82f6)',
                    backgroundColor:
                      'color-mix(in srgb, var(--cc-accent, #3b82f6) 5%, transparent)',
                  }
                : {}),
              ...(isMulti && isConnected
                ? {
                    borderColor: 'var(--cc-success, #22c55e)',
                    backgroundColor:
                      'color-mix(in srgb, var(--cc-success, #22c55e) 4%, transparent)',
                  }
                : {}),
            }}
            onClick={() => handleSelect(chain)}
            onMouseEnter={() => setHoveredId(chain.id)}
            onMouseLeave={() => setHoveredId(null)}
            type="button"
            disabled={!isMulti && isSwitching && isSelected}
          >
            {/* Chain Icon */}
            {chain.iconUrl ? (
              <img
                src={chain.iconUrl}
                alt={chain.name}
                style={styles.chainIcon}
                loading="lazy"
              />
            ) : (
              <div style={styles.chainIcon}>{CHAIN_ICONS[chain.id] ?? '⬡'}</div>
            )}

            {/* Chain Info */}
            <div style={styles.chainInfo}>
              <span style={styles.chainName}>{chain.name}</span>
              <span style={styles.chainTicker}>{chain.ticker}</span>
            </div>

            {/* Right side: status / balance / badges */}
            {isMulti ? (
              <div style={styles.multiChainRight}>
                {/* Balance (shown when connected) */}
                {chainStatus?.balance && (
                  <span style={styles.balanceText}>
                    {chainStatus.balance} {chain.ticker}
                  </span>
                )}
                {/* Status indicator row */}
                <div style={styles.statusRow}>
                  <div
                    style={{
                      ...styles.statusDot,
                      backgroundColor: statusColor(chainStatus?.status),
                      ...(chainStatus?.status === 'connecting'
                        ? { animation: 'cinacoin-pulse 1.2s ease-in-out infinite' }
                        : {}),
                    }}
                  />
                  <span
                    style={{
                      ...styles.statusLabel,
                      color: statusColor(chainStatus?.status),
                    }}
                  >
                    {statusLabel(chainStatus?.status)}
                  </span>
                </div>
                {/* Error message */}
                {chainStatus?.error && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--cc-danger, #ef4444)',
                    }}
                  >
                    {chainStatus.error}
                  </span>
                )}
              </div>
            ) : (
              /* Single-mode badges */
              <>
                {isSwitching && isSelected ? (
                  <div style={styles.spinner} />
                ) : isSelected ? (
                  <span style={styles.selectedBadge}>Connected</span>
                ) : chain.testnet ? (
                  <span style={styles.testnetBadge}>Testnet</span>
                ) : null}
              </>
            )}
          </button>
        );
      })}

      {/* Multi-mode footer hint */}
      {isMulti && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--cc-muted, #6b7280)',
            textAlign: 'center',
            marginTop: '8px',
            padding: '0 4px',
          }}
        >
          Click a chain to connect or switch. Multiple chains can be active
          simultaneously.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CSS: pulse animation for connecting status dot
// ============================================================================

if (typeof document !== 'undefined') {
  const styleId = 'cinacoin-chain-selector-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes cinacoin-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
  }
}

export default ChainSelector;

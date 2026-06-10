/**
 * WalletSearch component — search input for filtering wallets
 */

import React, { useRef, useEffect } from 'react';
import type { WalletSearchProps } from '../types';

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    position: 'relative' as const,
    marginBottom: '12px',
  },
  icon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.4,
    fontSize: '14px',
    pointerEvents: 'none' as const,
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    borderRadius: '12px',
    border: '1px solid var(--cc-border, rgba(0,0,0,0.08))',
    backgroundColor: 'var(--cc-surface, #f5f5f5)',
    color: 'var(--cc-ink, #1a1a2e)',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    boxSizing: 'border-box' as const,
  },
  clearButton: {
    position: 'absolute' as const,
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--cc-border, rgba(0,0,0,0.1))',
    cursor: 'pointer',
    color: 'var(--cc-ink, #1a1a2e)',
    fontSize: '12px',
    padding: 0,
    opacity: 0.6,
    transition: 'opacity 0.15s ease',
  },
} as const;

// ============================================================================
// Component
// ============================================================================

/**
 * Search input for filtering the wallet list
 */
export function WalletSearch({
  value,
  onChange,
  placeholder = 'Search wallets',
}: WalletSearchProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    // Small delay to allow modal animation to complete
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--cc-accent, #3b82f6)';
    e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--cc-accent, #3b82f6) 15%, transparent)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--cc-border, rgba(0,0,0,0.08))';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={styles.container}>
      <span style={styles.icon}>🔍</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={styles.input}
        aria-label="Search wallets"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      {value && (
        <button
          style={styles.clearButton}
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default WalletSearch;

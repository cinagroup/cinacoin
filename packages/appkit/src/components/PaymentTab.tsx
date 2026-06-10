/**
 * PaymentTab — Buy crypto tab for AppKit modal
 *
 * Provides a quick purchase entry point within the AppKit modal.
 * Features:
 * - Quick buy presets (common amounts)
 * - Payment method selection
 * - Integration with onramp providers
 *
 * @example
 * ```tsx
 * <PaymentTab
 *   walletAddress={address}
 *   onPaymentComplete={(result) => console.log(result)}
 *   themeMode="dark"
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import type { ConnectedAccount, ThemeMode, ThemeVariables } from '../types';
import type { OnRampProviderId, OnRampResult } from '@cinacoin/onramp-sdk';

// ============================================================================
// Types
// ============================================================================

export interface PaymentTabProps {
  /** Connected account information */
  account: ConnectedAccount | null;
  /** Callback when payment completes */
  onPaymentComplete?: (result: OnRampResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Theme mode */
  themeMode?: ThemeMode;
  /** Theme variables */
  themeVariables?: ThemeVariables;
  /** Default fiat currency */
  defaultCurrency?: string;
  /** Default crypto token */
  defaultCryptoToken?: string;
  /** Enabled providers */
  enabledProviders?: OnRampProviderId[];
}

interface QuickAmount {
  value: number;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const QUICK_AMOUNTS: QuickAmount[] = [
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
  { value: 1000, label: '$1000' },
  { value: 2500, label: '$2500' },
];

const POPULAR_TOKENS = ['ETH', 'USDC', 'USDT', 'BTC', 'MATIC'];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
  { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
  { id: 'apple_pay', label: 'Apple Pay', icon: '' },
  { id: 'google_pay', label: 'Google Pay', icon: '🔵' },
];

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    padding: '0',
  },
  section: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-body-sm)',
    fontWeight: "var(--weight-medium)",
    color: 'var(--cc-ink, #1a1a2e)',
    marginBottom: '8px',
    opacity: 0.7,
  },
  quickAmounts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  quickAmountButton: {
    padding: '12px 8px',
    fontSize: 'var(--text-body-sm)',
    fontWeight: "var(--weight-semibold)",
    border: '1px solid var(--cc-border, rgba(0,0,0,0.1))',
    borderRadius: '8px',
    background: 'var(--cc-surface, #f5f5f5)',
    color: 'var(--cc-ink, #1a1a2e)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'center' as const,
  },
  quickAmountButtonSelected: {
    background: 'var(--cc-accent, #6366f1)',
    color: 'white',
    borderColor: 'var(--cc-accent, #6366f1)',
  },
  customAmountInput: {
    width: '100%',
    padding: '12px',
    fontSize: 'var(--text-body-md)',
    fontWeight: "var(--weight-semibold)",
    border: '1px solid var(--cc-border, rgba(0,0,0,0.1))',
    borderRadius: '8px',
    background: 'var(--cc-surface, #f5f5f5)',
    color: 'var(--cc-ink, #1a1a2e)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  tokenSelect: {
    width: '100%',
    padding: '12px',
    fontSize: 'var(--text-body-sm)',
    border: '1px solid var(--cc-border, rgba(0,0,0,0.1))',
    borderRadius: '8px',
    background: 'var(--cc-surface, #f5f5f5)',
    color: 'var(--cc-ink, #1a1a2e)',
    cursor: 'pointer',
    outline: 'none',
  },
  paymentMethods: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  paymentMethodButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    fontSize: 'var(--text-body-sm)',
    fontWeight: "var(--weight-medium)",
    border: '2px solid var(--cc-border, rgba(0,0,0,0.1))',
    borderRadius: '8px',
    background: 'var(--cc-surface, #f5f5f5)',
    color: 'var(--cc-ink, #1a1a2e)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left' as const,
    width: '100%',
  },
  paymentMethodButtonSelected: {
    borderColor: 'var(--cc-accent, #6366f1)',
    background: 'var(--cc-accent, #6366f1)',
    color: 'white',
  },
  paymentMethodIcon: {
    fontSize: 'var(--text-display-sm)',
  },
  buyButton: {
    width: '100%',
    padding: '12px',
    fontSize: 'var(--text-body-md)',
    fontWeight: "var(--weight-semibold)",
    border: 'none',
    borderRadius: '12px',
    background: 'var(--cc-accent, #6366f1)',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    marginTop: '8px',
  },
  buyButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  notConnected: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.6,
  },
  notConnectedIcon: {
    fontSize: 'var(--text-display-xl)',
    marginBottom: '12px',
  },
  notConnectedText: {
    fontSize: 'var(--text-body-sm)',
    lineHeight: 1.5,
  },
};

// ============================================================================
// Component
// ============================================================================

/**
 * PaymentTab component for AppKit modal.
 *
 * Provides a quick buy interface with preset amounts and payment method selection.
 */
export function PaymentTab({
  account,
  onPaymentComplete,
  onError,
  themeMode = 'auto',
  themeVariables,
  defaultCurrency = 'USD',
  defaultCryptoToken = 'ETH',
  enabledProviders,
}: PaymentTabProps): React.ReactElement {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<string>(defaultCryptoToken);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Handlers ───────────────────────────────────────────
  const handleQuickAmountClick = useCallback((amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  }, []);

  const handleCustomAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    setSelectedAmount(null);
  }, []);

  const handlePaymentMethodSelect = useCallback((methodId: string) => {
    setSelectedPaymentMethod(methodId);
  }, []);

  const handleBuyClick = useCallback(async () => {
    const amount = selectedAmount ?? parseFloat(customAmount);
    
    if (!amount || amount <= 0) {
      onError?.(new Error('Please enter a valid amount'));
      return;
    }

    if (!account) {
      onError?.(new Error('Wallet not connected'));
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment flow (in production, integrate with OnRampWidget)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result: OnRampResult = {
        completed: true,
        orderId: `order_${Date.now()}`,
        cryptoAmount: amount / 2000, // Simulated exchange rate
        fiatAmount: amount,
        provider: enabledProviders?.[0] ?? 'moonpay',
      };

      onPaymentComplete?.(result);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Payment failed'));
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAmount, customAmount, account, onPaymentComplete, onError, enabledProviders]);

  // ── Not Connected State ────────────────────────────────
  if (!account) {
    return (
      <div style={styles.notConnected}>
        <div style={styles.notConnectedIcon}>🔒</div>
        <div style={styles.notConnectedText}>
          Connect your wallet to buy crypto
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────
  const finalAmount = selectedAmount ?? parseFloat(customAmount) ?? 0;
  const canBuy = finalAmount > 0 && !isProcessing;

  return (
    <div style={styles.container}>
      {/* Quick Amount Selection */}
      <div style={styles.section}>
        <label style={styles.label}>Amount ({defaultCurrency})</label>
        <div style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount.value}
              onClick={() => handleQuickAmountClick(amount.value)}
              style={{
                ...styles.quickAmountButton,
                ...(selectedAmount === amount.value ? styles.quickAmountButtonSelected : {}),
              }}
            >
              {amount.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Custom amount"
          value={customAmount}
          onChange={handleCustomAmountChange}
          min="0"
          step="0.01"
          style={{
            ...styles.customAmountInput,
            marginTop: '8px',
          }}
        />
      </div>

      {/* Token Selection */}
      <div style={styles.section}>
        <label style={styles.label}>Receive</label>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          style={styles.tokenSelect}
        >
          {POPULAR_TOKENS.map((token) => (
            <option key={token} value={token}>
              {token}
            </option>
          ))}
        </select>
      </div>

      {/* Payment Method Selection */}
      <div style={styles.section}>
        <label style={styles.label}>Payment Method</label>
        <div style={styles.paymentMethods}>
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => handlePaymentMethodSelect(method.id)}
              style={{
                ...styles.paymentMethodButton,
                ...(selectedPaymentMethod === method.id
                  ? styles.paymentMethodButtonSelected
                  : {}),
              }}
            >
              <span style={styles.paymentMethodIcon}>{method.icon}</span>
              <span>{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={handleBuyClick}
        disabled={!canBuy}
        style={{
          ...styles.buyButton,
          ...(!canBuy ? styles.buyButtonDisabled : {}),
        }}
      >
        {isProcessing
          ? 'Processing...'
          : finalAmount > 0
            ? `Buy ${selectedToken} with $${finalAmount}`
            : 'Enter amount'}
      </button>
    </div>
  );
}

export default PaymentTab;

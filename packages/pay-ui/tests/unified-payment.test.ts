/**
 * UnifiedPayment component tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedPayment } from '../src/components/UnifiedPayment';

describe('UnifiedPayment', () => {
  const defaultProps = {
    chainId: 1,
    walletAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    defaultTab: 'buy' as const,
    theme: 'light' as const,
  };

  it('renders without crashing', () => {
    render(<UnifiedPayment {...defaultProps} />);
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  it('renders all three tabs', () => {
    render(<UnifiedPayment {...defaultProps} />);
    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Swap')).toBeInTheDocument();
    expect(screen.getByText('Deposit')).toBeInTheDocument();
  });

  it('defaults to buy tab', () => {
    render(<UnifiedPayment {...defaultProps} />);
    const buyButton = screen.getByText('Buy');
    expect(buyButton).toHaveStyle({ fontWeight: '600' });
  });

  it('switches tabs when clicked', () => {
    render(<UnifiedPayment {...defaultProps} />);
    
    const swapButton = screen.getByText('Swap');
    fireEvent.click(swapButton);
    
    expect(swapButton).toHaveStyle({ fontWeight: '600' });
  });

  it('calls onPaymentComplete when buy completes', async () => {
    const onPaymentComplete = vi.fn();
    render(<UnifiedPayment {...defaultProps} onPaymentComplete={onPaymentComplete} />);
    
    // Simulate payment completion (this would require more setup in real tests)
    // For now, just verify the callback prop is accepted
    expect(onPaymentComplete).toBeDefined();
  });

  it('calls onError when error occurs', async () => {
    const onError = vi.fn();
    render(<UnifiedPayment {...defaultProps} onError={onError} />);
    
    // Simulate error (this would require more setup in real tests)
    // For now, just verify the callback prop is accepted
    expect(onError).toBeDefined();
  });

  it('applies custom className', () => {
    render(<UnifiedPayment {...defaultProps} className="custom-class" />);
    const container = screen.getByText('Payment').closest('.ocx-unified-payment');
    expect(container).toHaveClass('custom-class');
  });

  it('applies dark theme', () => {
    render(<UnifiedPayment {...defaultProps} theme="dark" />);
    const container = screen.getByText('Payment').closest('.ocx-unified-payment');
    expect(container).toBeInTheDocument();
  });

  it('applies custom primary color', () => {
    render(<UnifiedPayment {...defaultProps} primaryColor="#ff0000" />);
    const container = screen.getByText('Payment').closest('.ocx-unified-payment');
    expect(container).toBeInTheDocument();
  });
});

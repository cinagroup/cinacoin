/**
 * Tests for TransactionToast component.
 * Tests rendering for all statuses, actions, events, and progress bar.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

describe('TransactionToast component', () => {
  let TransactionToast: any;

  beforeAll(async () => {
    const mod = await import('../../src/components/transaction-toast.js');
    TransactionToast = mod.TransactionToast;
  });

  it('should have correct default property values', () => {
    const toast = document.createElement('ocx-transaction-toast');
    expect(toast.hash).toBe('');
    expect(toast.chainId).toBe(1);
    expect(toast.status).toBe('pending');
    expect(toast.confirmations).toBe(0);
    expect(toast.targetConfirmations).toBe(12);
    expect(toast.autoDismiss).toBe(8000);
    expect(toast.explorerUrl).toBe('');
  });

  it('should accept transaction data', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    toast.chainId = 137;
    toast.status = 'confirmed';
    toast.confirmations = 12;
    toast.targetConfirmations = 12;
    toast.autoDismiss = 5000;
    toast.explorerUrl = 'https://polygonscan.com/tx/0xabc';

    expect(toast.hash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    expect(toast.chainId).toBe(137);
    expect(toast.status).toBe('confirmed');
    expect(toast.confirmations).toBe(12);
  });

  it('should render pending status with correct icon', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234567890abcdef';
    toast.status = 'pending';
    toast.confirmations = 3;
    toast.targetConfirmations = 12;
    const result = toast.render();
    const rendered = String(result);
    expect(rendered).toContain('⏳');
    expect(rendered).toContain('transaction_pending');
    expect(rendered).toContain('(3/12)');
  });

  it('should render confirmed status with correct icon', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234567890abcdef';
    toast.status = 'confirmed';
    const result = toast.render();
    expect(String(result)).toContain('✅');
    expect(String(result)).toContain('transaction_confirmed');
  });

  it('should render failed status with retry button', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234567890abcdef';
    toast.status = 'failed';
    const result = toast.render();
    const rendered = String(result);
    expect(rendered).toContain('❌');
    expect(rendered).toContain('transaction_failed');
    expect(rendered).toContain('retry');
  });

  it('should render replaced status with correct icon', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234567890abcdef';
    toast.status = 'replaced';
    const result = toast.render();
    expect(String(result)).toContain('🔄');
    expect(String(result)).toContain('transaction_replaced');
  });

  it('should truncate long transaction hashes', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234567890abcdef1234567890abcdef12345678';
    toast.status = 'pending';
    const result = toast.render();
    expect(String(result)).toContain('0x1234...5678');
  });

  it('should not truncate short transaction hashes', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234';
    toast.status = 'pending';
    const result = toast.render();
    expect(String(result)).toContain('0x1234');
    expect(String(result)).not.toContain('...');
  });

  it('should render explorer link when explorerUrl is set', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234';
    toast.status = 'confirmed';
    toast.explorerUrl = 'https://etherscan.io/tx/0x1234';
    const result = toast.render();
    expect(String(result)).toContain('view');
  });

  it('should not render explorer link when explorerUrl is empty', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234';
    toast.status = 'confirmed';
    toast.explorerUrl = '';
    const result = toast.render();
    expect(String(result)).not.toContain('↗');
  });

  it('should dispatch ocx-dismiss event on dismiss', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    const handler = vi.fn();
    toast.addEventListener('ocx-dismiss', handler);

    toast._dismiss();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should dispatch ocx-retry event on retry', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    const handler = vi.fn();
    toast.addEventListener('ocx-retry', handler);

    toast._retry();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should dispatch ocx-view-explorer event with hash and url', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    const handler = vi.fn();
    toast.addEventListener('ocx-view-explorer', handler);
    toast.hash = '0xabc123';
    toast.explorerUrl = 'https://etherscan.io/tx/0xabc123';

    toast._viewExplorer();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      hash: '0xabc123',
      explorerUrl: 'https://etherscan.io/tx/0xabc123',
    });
  });

  it('should render progress bar for pending status', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234';
    toast.status = 'pending';
    const result = toast.render();
    expect(String(result)).toContain('progress-bar');
  });

  it('should not render progress bar for confirmed status', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234';
    toast.status = 'confirmed';
    const result = toast.render();
    expect(String(result)).not.toContain('progress-bar');
  });

  it('should have role="alert" for accessibility', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.hash = '0x1234';
    toast.status = 'pending';
    const result = toast.render();
    expect(String(result)).toContain('role="alert"');
    expect(String(result)).toContain('aria-live="polite"');
  });

  it('should define CSS styles', () => {
    const styles = (TransactionToast as any).styles;
    expect(Array.isArray(styles)).toBe(true);
    expect(styles.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty status message for confirmed status', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.status = 'confirmed';
    toast.confirmations = 12;
    toast.targetConfirmations = 12;
    expect(toast._statusMessage).toBe('');
  });

  it('should have correct default status icon fallback', () => {
    const toast = document.createElement('ocx-transaction-toast') as any;
    toast.status = 'unknown' as any;
    expect(toast._statusIcon).toBe('⏳');
    expect(toast._statusTitle).toBe('transaction_pending');
  });
});

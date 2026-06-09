/**
 * Tests for AccountModal component.
 * Tests rendering, address formatting, actions, and events.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
describe('AccountModal component', () => {
    let AccountModal;
    beforeAll(async () => {
        const mod = await import('../../src/components/account-modal.js');
        AccountModal = mod.AccountModal;
    });
    it('should have correct default property values', () => {
        const modal = document.createElement('ocx-account-modal');
        expect(modal.address).toBe('');
        expect(modal.chainId).toBe(1);
        expect(modal.balance).toBe('0.00');
        expect(modal.chainSymbol).toBe('ETH');
        expect(modal.allAccounts).toEqual([]);
        expect(modal.connectedApps).toEqual([]);
        expect(modal.isOpen).toBe(false);
    });
    it('should accept account data properties', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.address = '0x1234567890abcdef1234567890abcdef12345678';
        modal.chainId = 137;
        modal.balance = '2.5';
        modal.chainSymbol = 'MATIC';
        modal.allAccounts = [
            { address: '0xabcdef1234567890abcdef1234567890abcdef12', balance: '1.0', chainSymbol: 'ETH' },
        ];
        modal.connectedApps = [{ name: 'Uniswap', lastUsed: '2 days ago' }];
        expect(modal.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
        expect(modal.chainId).toBe(137);
        expect(modal.balance).toBe('2.5');
        expect(modal.chainSymbol).toBe('MATIC');
        expect(modal.allAccounts).toHaveLength(1);
        expect(modal.connectedApps).toHaveLength(1);
    });
    it('should not render when isOpen is false', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.isOpen = false;
        const result = modal.render();
        expect(result).toBe(undefined);
    });
    it('should render when isOpen is true', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.isOpen = true;
        modal.address = '0x1234567890abcdef1234567890abcdef12345678';
        modal.balance = '1.5';
        modal.chainSymbol = 'ETH';
        const result = modal.render();
        expect(result).toBeTruthy();
    });
    it('should render formatted address', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.isOpen = true;
        modal.address = '0x1234567890abcdef1234567890abcdef12345678';
        modal.balance = '0.00';
        modal.chainSymbol = 'ETH';
        const result = modal.render();
        expect(String(result)).toContain('0x12');
        expect(String(result)).toContain('...');
    });
    it('should render balance with chain symbol', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.isOpen = true;
        modal.address = '0x1234567890abcdef1234567890abcdef12345678';
        modal.balance = '3.14159';
        modal.chainSymbol = 'ETH';
        const result = modal.render();
        expect(String(result)).toContain('3.14159');
        expect(String(result)).toContain('ETH');
    });
    it('should format address using inherited formatAddress', () => {
        const modal = document.createElement('ocx-account-modal');
        const formatted = modal.formatAddress('0x1234567890abcdef1234567890abcdef12345678');
        expect(formatted).toBe('0x12...5678');
    });
    it('should dispatch ocx-close event on close', () => {
        const modal = document.createElement('ocx-account-modal');
        const handler = vi.fn();
        modal.addEventListener('ocx-close', handler);
        modal.isOpen = true;
        modal._close();
        expect(handler).toHaveBeenCalledTimes(1);
        expect(modal.isOpen).toBe(false);
    });
    it('should dispatch ocx-copy-address event on copy', () => {
        const modal = document.createElement('ocx-account-modal');
        const handler = vi.fn();
        modal.addEventListener('ocx-copy-address', handler);
        modal.isOpen = true;
        modal.address = '0x1234567890abcdef1234567890abcdef12345678';
        modal._copyAddress();
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it('should dispatch ocx-view-explorer event on view explorer', () => {
        const modal = document.createElement('ocx-account-modal');
        const handler = vi.fn();
        modal.addEventListener('ocx-view-explorer', handler);
        modal.isOpen = true;
        modal._viewExplorer();
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it('should dispatch ocx-disconnect event on disconnect', () => {
        const modal = document.createElement('ocx-account-modal');
        const handler = vi.fn();
        modal.addEventListener('ocx-disconnect', handler);
        modal.isOpen = true;
        modal._disconnect();
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it('should dispatch ocx-switch-account event on account switch', () => {
        const modal = document.createElement('ocx-account-modal');
        const handler = vi.fn();
        modal.addEventListener('ocx-switch-account', handler);
        modal.isOpen = true;
        const newAddr = '0xabcdef1234567890abcdef1234567890abcdef12';
        modal._switchAccount(newAddr);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail).toEqual({ address: newAddr });
    });
    it('should close on Escape key when open', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.isOpen = true;
        modal.connectedCallback();
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(event);
        expect(modal.isOpen).toBe(false);
        modal.disconnectedCallback();
    });
    it('should render allAccounts section when provided', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.isOpen = true;
        modal.address = '0x1234567890abcdef1234567890abcdef12345678';
        modal.allAccounts = [
            { address: '0xabcdef1234567890abcdef1234567890abcdef12', balance: '1.0', chainSymbol: 'ETH' },
        ];
        const result = modal.render();
        expect(String(result)).toContain('switch_account');
        expect(String(result)).toContain('0xabc');
    });
    it('should not render allAccounts section when empty', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.isOpen = true;
        modal.address = '0x1234567890abcdef1234567890abcdef12345678';
        modal.allAccounts = [];
        const result = modal.render();
        expect(String(result)).not.toContain('switch_account');
    });
    it('should render connectedApps section when provided', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.isOpen = true;
        modal.address = '0x1234567890abcdef1234567890abcdef12345678';
        modal.connectedApps = [{ name: 'Uniswap', lastUsed: '2 days ago' }];
        const result = modal.render();
        expect(String(result)).toContain('connected_apps');
        expect(String(result)).toContain('Uniswap');
    });
    it('should render disconnect button', () => {
        const modal = document.createElement('ocx-account-modal');
        modal.isOpen = true;
        modal.address = '0x1234567890abcdef1234567890abcdef12345678';
        const result = modal.render();
        expect(String(result)).toContain('disconnect-btn');
        expect(String(result)).toContain('disconnect');
    });
    it('should define CSS styles', () => {
        const styles = AccountModal.styles;
        expect(Array.isArray(styles)).toBe(true);
        expect(styles.length).toBeGreaterThanOrEqual(1);
    });
    it('should handle short address without truncation', () => {
        const modal = document.createElement('ocx-account-modal');
        const formatted = modal.formatAddress('0x1234');
        expect(formatted).toBe('0x1234');
    });
});
//# sourceMappingURL=account-modal.test.js.map
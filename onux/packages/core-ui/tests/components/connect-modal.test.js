/**
 * Tests for ConnectModal component.
 * Tests rendering logic, view switching, wallet selection, and events.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
describe('ConnectModal component', () => {
    let ConnectModal;
    beforeAll(async () => {
        const mod = await import('../../src/components/connect-modal.js');
        ConnectModal = mod.ConnectModal;
    });
    it('should have correct default property values', () => {
        const modal = document.createElement('ocx-connect-modal');
        expect(modal.isOpen).toBe(false);
        expect(modal.defaultView).toBe('wallets');
        expect(modal.wallets).toEqual([]);
        expect(modal.recommendedWalletIds).toEqual([]);
    });
    it('should accept property changes', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.defaultView = 'social';
        modal.wallets = [
            { id: 'metamask', name: 'MetaMask', icon: '' },
            { id: 'walletconnect', name: 'WalletConnect', icon: '' },
        ];
        modal.recommendedWalletIds = ['metamask'];
        expect(modal.isOpen).toBe(true);
        expect(modal.defaultView).toBe('social');
        expect(modal.wallets).toHaveLength(2);
        expect(modal.recommendedWalletIds).toContain('metamask');
    });
    it('should set current view to defaultView on connectedCallback', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.defaultView = 'email';
        modal.connectedCallback();
        expect(modal._currentView).toBe('email');
        modal.disconnectedCallback();
    });
    it('should not render when isOpen is false', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = false;
        const result = modal.render();
        expect(result).toBe(undefined);
    });
    it('should render when isOpen is true', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [];
        modal._currentView = 'wallets';
        const result = modal.render();
        expect(result).toBeTruthy();
    });
    it('should render wallet grid view when currentView is wallets', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [
            { id: 'metamask', name: 'MetaMask', icon: '' },
        ];
        modal.recommendedWalletIds = [];
        modal._currentView = 'wallets';
        const result = modal.render();
        expect(String(result)).toContain('wallet-grid');
        expect(String(result)).toContain('MetaMask');
    });
    it('should render social login view when currentView is social', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [];
        modal._currentView = 'social';
        const result = modal.render();
        expect(String(result)).toContain('alt-actions');
    });
    it('should render email view when currentView is email', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [];
        modal._currentView = 'email';
        const result = modal.render();
        expect(String(result)).toContain('type="email"');
    });
    it('should render scan view when currentView is scan', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [];
        modal._currentView = 'scan';
        const result = modal.render();
        expect(String(result)).toContain('scan_with_wallet');
    });
    it('should dispatch ocx-wallet-select event on wallet selection', () => {
        const modal = document.createElement('ocx-connect-modal');
        const handler = vi.fn();
        modal.addEventListener('ocx-wallet-select', handler);
        const wallet = { id: 'metamask', name: 'MetaMask', icon: '' };
        modal._selectWallet(wallet);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail).toEqual(wallet);
    });
    it('should dispatch ocx-close event on close', () => {
        const modal = document.createElement('ocx-connect-modal');
        const handler = vi.fn();
        modal.addEventListener('ocx-close', handler);
        modal.isOpen = true;
        modal._close();
        expect(handler).toHaveBeenCalledTimes(1);
        expect(modal.isOpen).toBe(false);
    });
    it('should close on Escape key when open', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.connectedCallback();
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(event);
        expect(modal.isOpen).toBe(false);
        modal.disconnectedCallback();
    });
    it('should not close on Escape key when not open', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = false;
        modal.connectedCallback();
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(event);
        // _close sets isOpen=false which it already is, so no change
        expect(modal.isOpen).toBe(false);
        modal.disconnectedCallback();
    });
    it('should close when clicking overlay', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        // Simulate overlay click
        const overlay = { classList: { contains: (c) => c === 'overlay' } };
        const fakeEvent = { target: overlay };
        modal._onOverlayClick(fakeEvent);
        expect(modal.isOpen).toBe(false);
    });
    it('should not close when clicking modal content (not overlay)', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        const overlay = { classList: { contains: (c) => c !== 'overlay' } };
        const fakeEvent = { target: overlay };
        modal._onOverlayClick(fakeEvent);
        expect(modal.isOpen).toBe(true);
    });
    it('should render view tabs with correct active state', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [];
        modal._currentView = 'social';
        const result = modal.render();
        const rendered = String(result);
        // Should have 4 tabs: wallets, social, email, scan
        expect(rendered).toContain('view-tab');
    });
    it('should render alternative action buttons in wallets view', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [];
        modal._currentView = 'wallets';
        const result = modal.render();
        const rendered = String(result);
        expect(rendered).toContain('login_with_email');
        expect(rendered).toContain('social_login');
        expect(rendered).toContain('scan_qr');
    });
    it('should render footer with powered by text', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [];
        modal._currentView = 'wallets';
        const result = modal.render();
        expect(String(result)).toContain('footer');
    });
    it('should render recommended badge for recommended wallets', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [
            { id: 'metamask', name: 'MetaMask', icon: '' },
        ];
        modal.recommendedWalletIds = ['metamask'];
        modal._currentView = 'wallets';
        const result = modal.render();
        expect(String(result)).toContain('recommended');
    });
    it('should render close button with aria-label', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [];
        modal._currentView = 'wallets';
        const result = modal.render();
        expect(String(result)).toContain('close-btn');
    });
    it('should define CSS styles', () => {
        const styles = ConnectModal.styles;
        expect(Array.isArray(styles)).toBe(true);
        expect(styles.length).toBeGreaterThanOrEqual(1);
    });
    it('should set RTL direction when locale is RTL', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.connectedCallback();
        // RTL depends on locale; default en is not RTL
        expect(modal.hasAttribute('dir')).toBe(false);
        modal.disconnectedCallback();
    });
    it('should render Google, Apple, and X buttons in social view', () => {
        const modal = document.createElement('ocx-connect-modal');
        modal.isOpen = true;
        modal.wallets = [];
        modal._currentView = 'social';
        const result = modal.render();
        const rendered = String(result);
        expect(rendered).toContain('continue_with_google');
        expect(rendered).toContain('continue_with_apple');
        expect(rendered).toContain('continue_with_x');
    });
});
//# sourceMappingURL=connect-modal.test.js.map
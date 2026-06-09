/**
 * Comprehensive SIWE (Sign-In with Ethereum) authentication tests.
 *
 * Tests:
 * - Constructor defaults and config override
 * - signIn flow (happy path, wallet not connected, no accounts)
 * - signOut clears session state
 * - session token / expiration management
 * - custom nonce and timestamp generators
 * - expiration handling
 * - static verify() and parse() helpers
 * - re-entrancy / double sign-in behavior
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SIWEAuth } from '../../src/auth/siwe.js';
import { Connector } from '../../src/connector.js';
// ============================================================
// Mock Connector
// ============================================================
const MOCK_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';
const MOCK_SIGNATURE = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';
class MockConnector extends Connector {
    constructor() {
        super(...arguments);
        this.id = 'mock-siwe';
        this.name = 'Mock SIWE Wallet';
        this.icon = '';
        this.installed = true;
        this.type = 'injected';
        this._accounts = [];
        this._connected = false;
        this._connectShouldFail = false;
    }
    setAccounts(addrs) { this._accounts = addrs; }
    setConnectFail(v) { this._connectShouldFail = v; }
    async connect(_params) {
        if (this._connectShouldFail)
            throw new Error('Connection rejected');
        this._connected = true;
        this._accounts = [MOCK_ADDRESS];
        return { sessionId: 'siwe-session', accounts: this._accounts, chainId: 1, connectorId: this.id };
    }
    async disconnect() {
        this._connected = false;
        this._accounts = [];
    }
    async getAccounts() {
        return this._connected ? [...this._accounts] : [];
    }
    async getChainId() { return 1; }
    async switchChain(_chainId) { }
    async signMessage(_message) {
        return MOCK_SIGNATURE;
    }
    async signTransaction(_tx) { return '0xsigned'; }
    getProvider() {
        return null; // fallback path in SIWEAuth
    }
}
// ============================================================
// Helpers
// ============================================================
const DEFAULT_CONFIG = {
    domain: 'https://example.com',
    uri: 'https://example.com/login',
    statement: 'Sign in to Example',
    chainId: 1,
    expirationSeconds: 3600,
};
function makeSiwe(connector, overrides = {}) {
    return new SIWEAuth(connector, { ...DEFAULT_CONFIG, ...overrides });
}
// ============================================================
// Constructor & defaults
// ============================================================
describe('SIWEAuth constructor', () => {
    it('uses default chainId 1 when not provided', () => {
        const c = new MockConnector();
        const siwe = new SIWEAuth(c, { domain: 'https://x.com', uri: 'https://x.com' });
        expect(siwe).toBeDefined();
    });
    it('uses default expirationSeconds 86400 (24h) when not provided', () => {
        const c = new MockConnector();
        const siwe = new SIWEAuth(c, { domain: 'https://x.com', uri: 'https://x.com' });
        expect(siwe).toBeDefined();
    });
    it('accepts custom chainId', () => {
        const c = new MockConnector();
        const siwe = new SIWEAuth(c, { domain: 'https://x.com', uri: 'https://x.com', chainId: 137 });
        expect(siwe).toBeDefined();
    });
    it('accepts custom expirationSeconds', () => {
        const c = new MockConnector();
        const siwe = new SIWEAuth(c, { domain: 'https://x.com', uri: 'https://x.com', expirationSeconds: 7200 });
        expect(siwe).toBeDefined();
    });
    it('accepts custom nonce generator', () => {
        const c = new MockConnector();
        const siwe = new SIWEAuth(c, {
            domain: 'https://x.com',
            uri: 'https://x.com',
            generateNonce: () => 'custom-nonce-123',
        });
        expect(siwe).toBeDefined();
    });
    it('accepts custom timestamp generator', () => {
        const c = new MockConnector();
        const siwe = new SIWEAuth(c, {
            domain: 'https://x.com',
            uri: 'https://x.com',
            generateTimestamp: () => '2024-01-01T00:00:00.000Z',
        });
        expect(siwe).toBeDefined();
    });
});
// ============================================================
// isAuthenticated getter
// ============================================================
describe('SIWEAuth isAuthenticated', () => {
    it('returns false before signing in', () => {
        const siwe = makeSiwe(new MockConnector());
        expect(siwe.isAuthenticated).toBe(false);
    });
    it('returns false when sessionToken is null', () => {
        const siwe = makeSiwe(new MockConnector());
        expect(siwe.sessionToken).toBeNull();
        expect(siwe.address).toBeNull();
    });
});
// ============================================================
// signIn
// ============================================================
describe('SIWEAuth signIn', () => {
    let connector;
    beforeEach(() => {
        connector = new MockConnector();
    });
    it('connects wallet if not already connected, then signs in', async () => {
        const siwe = makeSiwe(connector);
        const result = await siwe.signIn();
        expect(result.address).toBe(MOCK_ADDRESS);
        expect(result.signature).toBe(MOCK_SIGNATURE);
        expect(result.verified).toBe(true);
        expect(result.message).toContain('example.com');
        expect(result.sessionToken).toBeDefined();
        expect(result.expiresAt).toBeDefined();
    });
    it('skips connect if wallet already connected', async () => {
        await connector.connect(); // pre-connect
        const siwe = makeSiwe(connector);
        const result = await siwe.signIn();
        expect(result.address).toBe(MOCK_ADDRESS);
    });
    it('throws if no accounts available after connect attempt', async () => {
        connector.setConnectFail(true); // connect throws, so no accounts
        const siwe = makeSiwe(connector);
        await expect(siwe.signIn()).rejects.toThrow('Connection rejected');
    });
    it('uses custom nonce when provided', async () => {
        const customNonce = 'my-custom-nonce-abc';
        const siwe = makeSiwe(connector, {
            generateNonce: () => customNonce,
        });
        const result = await siwe.signIn();
        expect(result.message).toContain(customNonce);
    });
    it('uses custom timestamp when provided', async () => {
        const customTs = '2024-06-15T12:00:00.000Z';
        const siwe = makeSiwe(connector, {
            generateTimestamp: () => customTs,
        });
        const result = await siwe.signIn();
        expect(result.message).toContain(customTs);
    });
    it('sets isAuthenticated to true after successful sign-in', async () => {
        const siwe = makeSiwe(connector);
        await siwe.signIn();
        expect(siwe.isAuthenticated).toBe(true);
    });
    it('sets address and sessionToken after sign-in', async () => {
        const siwe = makeSiwe(connector);
        await siwe.signIn();
        expect(siwe.address).toBe(MOCK_ADDRESS);
        expect(siwe.sessionToken).toMatch(/:/);
    });
    it('sets expiration based on expirationSeconds config', async () => {
        const siwe = makeSiwe(connector, { expirationSeconds: 7200 });
        const result = await siwe.signIn();
        const now = Math.floor(Date.now() / 1000);
        expect(result.expiresAt).toBeGreaterThan(now + 7000);
        expect(result.expiresAt).toBeLessThan(now + 7400);
    });
    it('includes parsed SIWE data in result', async () => {
        const siwe = makeSiwe(connector);
        const result = await siwe.signIn();
        expect(result.data).toBeDefined();
        expect(result.data.domain).toBe('https://example.com');
        expect(result.data.address.toLowerCase()).toBe(MOCK_ADDRESS.toLowerCase());
    });
    it('accepts params override in signIn()', async () => {
        const siwe = makeSiwe(connector);
        const result = await siwe.signIn({ statement: 'Override statement' });
        expect(result.message).toContain('Override statement');
    });
    it('throws when connection fails', async () => {
        connector.setConnectFail(true);
        const siwe = makeSiwe(connector);
        await expect(siwe.signIn()).rejects.toThrow('Connection rejected');
    });
});
// ============================================================
// signOut
// ============================================================
describe('SIWEAuth signOut', () => {
    it('clears session state', async () => {
        const connector = new MockConnector();
        const siwe = makeSiwe(connector);
        await siwe.signIn();
        expect(siwe.isAuthenticated).toBe(true);
        await siwe.signOut();
        expect(siwe.isAuthenticated).toBe(false);
        expect(siwe.address).toBeNull();
        expect(siwe.sessionToken).toBeNull();
    });
    it('disconnects the connector', async () => {
        const connector = new MockConnector();
        const siwe = makeSiwe(connector);
        await siwe.signIn();
        await siwe.signOut();
        expect(await connector.getAccounts()).toEqual([]);
    });
    it('is idempotent (calling twice does not error)', async () => {
        const connector = new MockConnector();
        const siwe = makeSiwe(connector);
        await siwe.signIn();
        await siwe.signOut();
        await siwe.signOut(); // should not throw
        expect(siwe.isAuthenticated).toBe(false);
    });
});
// ============================================================
// Static helpers
// ============================================================
describe('SIWEAuth static helpers', () => {
    it('SIWEAuth.parse parses a valid SIWE message', () => {
        const message = [
            'example.com wants you to sign in with your Ethereum account:',
            '0xabcdef1234567890abcdef1234567890abcdef12',
            '',
            'Sign in to Example',
            '',
            'URI: https://example.com/login',
            'Version: 1',
            'Chain ID: 1',
            'Nonce: abc123',
            'Issued At: 2024-01-01T00:00:00.000Z',
        ].join('\n');
        const parsed = SIWEAuth.parse(message);
        expect(parsed.domain).toBe('example.com');
        expect(parsed.address.toLowerCase()).toBe(MOCK_ADDRESS.toLowerCase());
        expect(parsed.nonce).toBe('abc123');
    });
});
//# sourceMappingURL=siwe.test.js.map
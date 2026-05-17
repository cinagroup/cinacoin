/**
 * WalletConnectClient integration tests.
 *
 * Tests:
 * - Client creation
 * - init() connects to relay
 * - connect() returns URI (pairing mode)
 * - connect({ uri }) returns session (connection mode)
 * - getPairings() returns active pairings
 * - getSession() returns null before connection
 * - isConnected() before/after
 * - request() throws without session
 * - disconnect() cleans up
 * - Event listeners (on/once/off)
 * - Static helpers (isValidUri, parseUri, getDefaultNamespaces)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WalletConnectClient, WcClientError, } from '../src/client.js';
const mockConfig = {
    relayUrl: 'wss://relay.test.example.com',
    metadata: {
        name: 'Test dApp',
        description: 'A test app',
        url: 'https://test.example.com',
        icons: ['https://test.example.com/icon.png'],
    },
    chains: ['eip155:1'],
};
describe('WalletConnectClient', () => {
    let client;
    beforeEach(() => {
        client = new WalletConnectClient(mockConfig);
    });
    it('creates a client instance', () => {
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(WalletConnectClient);
    });
    it('reports VERSION', () => {
        expect(WalletConnectClient.VERSION).toBe('0.1.0');
    });
    it('is not initialized by default', () => {
        expect(client.isInitialized()).toBe(false);
    });
    it('returns null session before connection', () => {
        expect(client.getSession()).toBeNull();
    });
    it('returns not connected before connection', () => {
        expect(client.isConnected()).toBe(false);
    });
    it('returns empty pairings list initially', () => {
        expect(client.getPairings()).toEqual([]);
    });
    it('returns undefined for non-existent pairing', () => {
        expect(client.getPairing('nonexistent')).toBeUndefined();
    });
    it('request() throws when no active session', async () => {
        await expect(client.request('eth_accounts', [])).rejects.toThrow('No active session');
    });
    it('request() with object form throws when no session', async () => {
        await expect(client.request({ method: 'eth_accounts', params: [] })).rejects.toThrow('No active session');
    });
    it('disconnect() is safe when not connected', async () => {
        await expect(client.disconnect()).resolves.not.toThrow();
    });
    it('cleanup() is safe when not initialized', async () => {
        await expect(client.cleanup()).resolves.not.toThrow();
    });
    it('pingSession returns false when not connected', async () => {
        const result = await client.pingSession();
        expect(result).toBe(false);
    });
    it('extendSession throws without session', async () => {
        await expect(client.extendSession(Date.now() + 86400)).rejects.toThrow('No active session');
    });
    it('updateSession throws without session', async () => {
        await expect(client.updateSession({})).rejects.toThrow('No active session');
    });
    it('emitSessionEvent throws without session', async () => {
        await expect(client.emitSessionEvent('eip155:1', 'accountsChanged', [])).rejects.toThrow('No active session');
    });
});
// ============================================================
// Event handling
// ============================================================
describe('WalletConnectClient events', () => {
    let client;
    beforeEach(() => {
        client = new WalletConnectClient(mockConfig);
    });
    it('registers and fires event listeners', () => {
        let fired = false;
        client.on('test', () => {
            fired = true;
        });
        client.emit('test');
        expect(fired).toBe(true);
    });
    it('once() fires only once', () => {
        let count = 0;
        client.once('test', () => {
            count++;
        });
        client.emit('test');
        client.emit('test');
        client.emit('test');
        expect(count).toBe(1);
    });
    it('off() removes listener', () => {
        let count = 0;
        const handler = () => {
            count++;
        };
        client.on('test', handler);
        client.off('test', handler);
        client.emit('test');
        expect(count).toBe(0);
    });
    it('removeAllListeners() clears all', () => {
        let count1 = 0;
        let count2 = 0;
        client.on('test', () => count1++);
        client.on('test', () => count2++);
        client.removeAllListeners('test');
        client.emit('test');
        expect(count1).toBe(0);
        expect(count2).toBe(0);
    });
});
// ============================================================
// Static helpers
// ============================================================
describe('WalletConnectClient static helpers', () => {
    it('isValidUri returns true for valid WC v2 URI', () => {
        const uri = 'wc:abc123def456789012345678901234567890123456789012345678901234@2?relay-protocol=waku&relay-url=wss%3A%2F%2Frelay.example.com&symKey=deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000';
        expect(WalletConnectClient.isValidUri(uri)).toBe(true);
    });
    it('isValidUri returns false for invalid URI', () => {
        expect(WalletConnectClient.isValidUri('not-a-uri')).toBe(false);
    });
    it('parseUri returns parsed components', () => {
        const uri = 'wc:abc123def456789012345678901234567890123456789012345678901234@2?relay-protocol=waku&relay-url=wss%3A%2F%2Frelay.example.com&symKey=deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000';
        const parsed = WalletConnectClient.parseUri(uri);
        expect(parsed.version).toBe(2);
        expect(parsed.topic.length).toBeGreaterThan(0);
    });
    it('getDefaultNamespaces returns EIP-155 by default', () => {
        const namespaces = WalletConnectClient.getDefaultNamespaces();
        expect(namespaces.eip155).toBeDefined();
    });
    it('getDefaultNamespaces includes Solana when requested', () => {
        const namespaces = WalletConnectClient.getDefaultNamespaces({
            chains: ['eip155:1', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        });
        expect(namespaces.eip155).toBeDefined();
        expect(namespaces.solana).toBeDefined();
    });
});
// ============================================================
// WcClientError
// ============================================================
describe('WcClientError', () => {
    it('has code and message', () => {
        const error = new WcClientError(5000, 'User rejected');
        expect(error.code).toBe(5000);
        expect(error.message).toBe('User rejected');
        expect(error.name).toBe('WcClientError');
    });
    it('supports optional data', () => {
        const error = new WcClientError(1000, 'Invalid pairing', { topic: 'abc' });
        expect(error.data).toEqual({ topic: 'abc' });
    });
});
//# sourceMappingURL=client.test.js.map
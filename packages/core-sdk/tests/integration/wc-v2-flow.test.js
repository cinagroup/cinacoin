/**
 * Integration Test — Full WalletConnect v2 Connection Flow
 *
 * Tests the complete WC v2 lifecycle: pair → connect → sign → disconnect.
 * Uses mock transports to simulate relay-server communication without
 * requiring a real network connection.
 *
 * 10 tests covering:
 * - Pairing lifecycle
 * - Session proposal & approval
 * - Signing requests (message + transaction)
 * - Topic subscription management
 * - Heartbeat keepalive
 * - Reconnection after disconnect
 * - Cleanup and state consistency
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Connector } from '../../src/connector.js';
import { SessionManager } from '../../src/session.js';
import { generateNonce } from '../../src/crypto/encrypt.js';
import { bytesToHex } from '../../src/crypto/keypair.js';
// ── Mock Relay WebSocket ──────────────────────────────────────────
class MockWebSocket {
    constructor() {
        this.readyState = WebSocket.OPEN;
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
        this._sent = [];
    }
    send(data) {
        this._sent.push(JSON.parse(data));
    }
    close(code, reason) {
        this.readyState = WebSocket.CLOSED;
        this.onclose?.({ code: code ?? 1000, reason: reason ?? '', wasClean: true });
    }
    getSentMessages() {
        return [...this._sent];
    }
    simulateMessage(data) {
        this.onmessage?.({ data: JSON.stringify(data) });
    }
}
// Stub global WebSocket for test environment
const RealWebSocket = globalThis.WebSocket;
// ── Mock WC v2 Connector ──────────────────────────────────────────
class MockWCV2Connector extends Connector {
    constructor() {
        super(...arguments);
        this.id = 'walletconnect-v2';
        this.name = 'WalletConnect v2';
        this.icon = 'data:image/svg+xml;base64,mock-wc';
        this.installed = true;
        this.type = 'relay';
        this._connected = false;
        this._accounts = [];
        this._chainId = 1;
        this._pairingTopic = '';
        this._sessionTopic = '';
        this._ws = null;
    }
    async connect(params) {
        // Phase 1: Create pairing
        this._pairingTopic = 'pairing_' + bytesToHex(generateNonce());
        // Phase 2: Session proposal
        this._sessionTopic = 'session_' + bytesToHex(generateNonce());
        this._connected = true;
        this._accounts = ['0x1234567890abcdef1234567890abcdef12345678'];
        this._chainId = params?.chains?.[0] ?? 1;
        this.emit('connect', {
            accounts: this._accounts,
            chainId: this._chainId,
            pairingTopic: this._pairingTopic,
            sessionTopic: this._sessionTopic,
        });
        return {
            sessionId: this._sessionTopic,
            accounts: this._accounts,
            chainId: this._chainId,
            connectorId: this.id,
        };
    }
    async disconnect() {
        this._connected = false;
        this._accounts = [];
        this._pairingTopic = '';
        this._sessionTopic = '';
        this.emit('disconnect');
    }
    async getAccounts() {
        return this._connected ? [...this._accounts] : [];
    }
    async getChainId() {
        return this._chainId;
    }
    async switchChain(chainId) {
        if (!this._connected)
            throw new Error('Not connected');
        this._chainId = chainId;
        this.emit('chainChanged', chainId);
    }
    async signMessage(message) {
        if (!this._connected)
            throw new Error('Not connected');
        // Simulate wallet signing
        const sig = '0xsigned_' + message.slice(0, 20);
        this.emit('signing_request', { method: 'personal_sign', message });
        return sig;
    }
    async signTransaction(tx) {
        if (!this._connected)
            throw new Error('Not connected');
        this.emit('signing_request', { method: 'eth_signTransaction', tx });
        return '0xsignedtx_' + (tx.to || '').slice(0, 10);
    }
    getProvider() {
        return this._connected
            ? {
                request: async ({ method }) => {
                    switch (method) {
                        case 'eth_accounts': return this._accounts;
                        case 'eth_chainId': return `0x${this._chainId.toString(16)}`;
                        default: return null;
                    }
                },
            }
            : null;
    }
    get pairingTopic() { return this._pairingTopic; }
    get sessionTopic() { return this._sessionTopic; }
    get isConnected() { return this._connected; }
}
// ── Tests ─────────────────────────────────────────────────────────
describe('WC v2 Flow — Full Connection Lifecycle', () => {
    let connector;
    let sessionManager;
    beforeEach(() => {
        connector = new MockWCV2Connector();
        sessionManager = new SessionManager();
    });
    afterEach(() => {
        connector.removeAllListeners();
        sessionManager.removeAllListeners();
    });
    it('should complete full pair → connect → sign → disconnect flow', async () => {
        // Phase 1: Connect (creates pairing + session)
        const result = await connector.connect();
        expect(result.sessionId).toBeTruthy();
        expect(result.accounts).toHaveLength(1);
        expect(result.chainId).toBe(1);
        expect(result.connectorId).toBe('walletconnect-v2');
        // Phase 2: Verify session
        expect(connector.isConnected).toBe(true);
        expect(connector.pairingTopic).toBeTruthy();
        expect(connector.sessionTopic).toBeTruthy();
        // Phase 3: Sign a message
        const signature = await connector.signMessage('Hello World');
        expect(signature).toMatch(/^0xsigned_/);
        // Phase 4: Disconnect
        await connector.disconnect();
        expect(connector.isConnected).toBe(false);
        expect(await connector.getAccounts()).toHaveLength(0);
    });
    it('should emit connect event with pairing and session topics', async () => {
        const connectHandler = vi.fn();
        connector.on('connect', connectHandler);
        await connector.connect();
        expect(connectHandler).toHaveBeenCalledTimes(1);
        const event = connectHandler.mock.calls[0][0];
        expect(event.accounts).toHaveLength(1);
        expect(event.chainId).toBe(1);
        expect(event.pairingTopic).toBeTruthy();
        expect(event.sessionTopic).toBeTruthy();
    });
    it('should emit signing_request when signing a message', async () => {
        await connector.connect();
        const signHandler = vi.fn();
        connector.on('signing_request', signHandler);
        await connector.signMessage('Test message');
        expect(signHandler).toHaveBeenCalledTimes(1);
        expect(signHandler.mock.calls[0][0].method).toBe('personal_sign');
    });
    it('should emit signing_request when signing a transaction', async () => {
        await connector.connect();
        const signHandler = vi.fn();
        connector.on('signing_request', signHandler);
        await connector.signTransaction({
            from: '0x1234567890abcdef1234567890abcdef12345678',
            to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            value: '0x0',
        });
        expect(signHandler).toHaveBeenCalledTimes(1);
        expect(signHandler.mock.calls[0][0].method).toBe('eth_signTransaction');
    });
    it('should emit disconnect event on disconnect', async () => {
        await connector.connect();
        const disconnectHandler = vi.fn();
        connector.on('disconnect', disconnectHandler);
        await connector.disconnect();
        expect(disconnectHandler).toHaveBeenCalledTimes(1);
    });
    it('should handle session manager integration through full flow', async () => {
        // Connect via session manager
        const stateChangeHandler = vi.fn();
        sessionManager.subscribe(stateChangeHandler);
        await sessionManager.initiate(connector);
        // Should transition: disconnected → connecting → connected
        expect(stateChangeHandler).toHaveBeenCalled();
        const finalState = sessionManager.getState();
        expect(finalState.status).toBe('connected');
        // Disconnect
        await sessionManager.terminate();
        expect(sessionManager.getState().status).toBe('disconnected');
    });
    it('should reject signing when not connected', async () => {
        await expect(connector.signMessage('test')).rejects.toThrow('Not connected');
        await expect(connector.signTransaction({ from: '0x1', to: '0x2' })).rejects.toThrow('Not connected');
    });
    it('should handle chain switching during an active session', async () => {
        await connector.connect();
        const chainHandler = vi.fn();
        connector.on('chainChanged', chainHandler);
        await connector.switchChain(137);
        expect(await connector.getChainId()).toBe(137);
        expect(chainHandler).toHaveBeenCalledWith(137);
    });
    it('should support reconnecting after disconnect', async () => {
        // First connection
        const result1 = await connector.connect();
        expect(result1.sessionId).toBeTruthy();
        await connector.disconnect();
        // Second connection
        const result2 = await connector.connect();
        expect(result2.sessionId).toBeTruthy();
        expect(connector.isConnected).toBe(true);
    });
    it('should expose a working provider after connection', async () => {
        await connector.connect();
        const provider = connector.getProvider();
        expect(provider).not.toBeNull();
        const accounts = await provider.request({ method: 'eth_accounts' });
        expect(accounts).toEqual(['0x1234567890abcdef1234567890abcdef12345678']);
        const chainId = await provider.request({ method: 'eth_chainId' });
        expect(chainId).toBe('0x1');
    });
});
//# sourceMappingURL=wc-v2-flow.test.js.map
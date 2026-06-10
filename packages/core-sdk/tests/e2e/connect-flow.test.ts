/**
 * E2E Test — Full Wallet Connection Lifecycle
 *
 * Mocks a complete WalletConnect v2 wallet connection flow:
 *   pairing → session proposal → session approval → connected → disconnect
 *
 * 20+ tests covering the full connection lifecycle without real network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Connector } from '../../src/connector.js';
import { SessionManager } from '../../src/session.js';
import type { ConnectParams, ConnectionResult, AppMetadata } from '../../src/types.js';

// ── Mock Wallet (simulates the wallet-side of WC v2) ──────────────

class MockWallet {
  private _approved = true;
  private _accounts = ['0x1234567890abcdef1234567890abcdef12345678'];
  private _activeChains = ['eip155:1', 'eip155:137', 'eip155:42161'];

  approveProposal() {
    this._approved = true;
  }

  rejectProposal() {
    this._approved = false;
  }

  getApproved(): boolean {
    return this._approved;
  }

  getAccounts(): string[] {
    return this._approved ? [...this._accounts] : [];
  }

  getChains(): string[] {
    return [...this._activeChains];
  }

  addAccount(addr: string) {
    if (!this._accounts.includes(addr)) {
      this._accounts.push(addr);
    }
  }

  removeAccount(addr: string) {
    this._accounts = this._accounts.filter(a => a !== addr);
  }
}

// ── Mock WC v2 Connector (dApp-side) ──────────────────────────────

const dAppMetadata: AppMetadata = {
  name: 'Cinacoin Test dApp',
  description: 'Test application',
  url: 'https://test.cinacoin.com',
  icons: ['https://test.cinacoin.com/icon.png'],
};

class MockWCV2Connector extends Connector {
  readonly id = 'walletconnect-v2-e2e';
  readonly name = 'WalletConnect v2';
  readonly icon = 'data:image/svg+xml;base64,mock-wc-e2e';
  readonly installed = true;
  readonly type = 'relay';

  private _connected = false;
  private _accounts: string[] = [];
  private _chainId = 1;
  private _pairingTopic = '';
  private _sessionTopic = '';
  private _sessionApproved = false;

  constructor(private wallet: MockWallet) {
    super();
  }

  // Phase 1: Create pairing
  async createPairing(): Promise<{ topic: string; uri: string }> {
    this._pairingTopic = 'pair_' + Math.random().toString(36).slice(2, 18);
    const uri = `wc:${this._pairingTopic}@2?relay-protocol=irn&symKey=mock_sym_key`;
    return { topic: this._pairingTopic, uri };
  }

  // Phase 2: Session proposal (sent to wallet)
  async proposeSession(chains: string[], methods: string[]): Promise<{ id: number; topics: string }> {
    if (!this._pairingTopic) {
      throw new Error('No active pairing');
    }
    return {
      id: Math.floor(Math.random() * 1e9),
      topics: [this._pairingTopic],
    };
  }

  // Phase 3: Wait for wallet approval
  async approveSession(walletResponse: { approved: boolean; accounts: string[]; chains: string[] }): Promise<ConnectionResult> {
    if (!walletResponse.approved) {
      throw new Error('Session proposal rejected by wallet');
    }
    this._sessionApproved = true;
    this._sessionTopic = 'session_' + Math.random().toString(36).slice(2, 18);
    this._connected = true;
    this._accounts = walletResponse.accounts;
    this._chainId = parseInt(walletResponse.chains[0]?.split(':')[1] ?? '1', 10);

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

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    if (this._connected) throw new Error('Already connected');

    // Full flow internally
    const pairing = await this.createPairing();
    await this.proposeSession(
      params?.chains?.map(c => `eip155:${c}`) ?? ['eip155:1'],
      ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4']
    );

    // Simulate wallet auto-approve using requested chains from params
    const requestedChains = params?.chains?.map(c => `eip155:${c}`)
      ?? this.wallet.getChains();
    const approved = await this.approveSession({
      approved: this.wallet.getApproved(),
      accounts: this.wallet.getAccounts(),
      chains: requestedChains,
    });

    return approved;
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this._sessionApproved = false;
    this._accounts = [];
    this._pairingTopic = '';
    this._sessionTopic = '';
    this.emit('disconnect');
  }

  async getAccounts(): Promise<string[]> {
    return this._connected ? [...this._accounts] : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this._connected) throw new Error('Not connected');
    this._chainId = chainId;
    this.emit('chainChanged', chainId);
  }

  async signMessage(_message: string): Promise<string> {
    if (!this._connected) throw new Error('Not connected');
    return '0x' + 'ab'.repeat(32) + '01'; // mock 65-byte sig
  }

  getProvider(): unknown {
    return this._connected
      ? {
          request: async ({ method }: { method: string }) => {
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
  get isSessionApproved() { return this._sessionApproved; }
  get isConnected() { return this._connected; }
}

// ── Tests ─────────────────────────────────────────────────────────

describe('E2E — Full Wallet Connection Lifecycle', () => {
  let wallet: MockWallet;
  let connector: MockWCV2Connector;
  let sessionManager: SessionManager;

  beforeEach(() => {
    wallet = new MockWallet();
    connector = new MockWCV2Connector(wallet);
    sessionManager = new SessionManager();
  });

  afterEach(() => {
    connector.removeAllListeners();
    sessionManager.removeAllListeners();
  });

  // ── Pairing Phase ─────────────────────────────────────────────

  it('should create a valid pairing URI', async () => {
    const pairing = await connector.createPairing();
    expect(pairing.topic).toBeTruthy();
    expect(pairing.topic).toMatch(/^pair_/);
    expect(pairing.uri).toMatch(/^wc:/);
    expect(pairing.uri).toContain(pairing.topic);
  });

  it('should generate unique pairing topics', async () => {
    const p1 = await connector.createPairing();
    // Reset pairing to create another
    (connector as unknown)._pairingTopic = '';
    const p2 = await connector.createPairing();
    expect(p1.topic).not.toBe(p2.topic);
  });

  // ── Session Proposal Phase ────────────────────────────────────

  it('should fail to propose session without pairing', async () => {
    await expect(connector.proposeSession(['eip155:1'], ['personal_sign']))
      .rejects.toThrow('No active pairing');
  });

  it('should propose session with correct chains and methods', async () => {
    await connector.createPairing();
    const proposal = await connector.proposeSession(
      ['eip155:1', 'eip155:137'],
      ['eth_sendTransaction', 'personal_sign']
    );
    expect(proposal.id).toBeGreaterThan(0);
    expect(proposal.topics).toContain(connector.pairingTopic);
  });

  // ── Session Approval Phase ────────────────────────────────────

  it('should reject session when wallet declines', async () => {
    await connector.createPairing();
    wallet.rejectProposal();
    await expect(connector.approveSession({
      approved: false,
      accounts: [],
      chains: [],
    })).rejects.toThrow('Session proposal rejected');
  });

  it('should approve session and return connection result', async () => {
    await connector.createPairing();
    const result = await connector.approveSession({
      approved: true,
      accounts: ['0xabc'],
      chains: ['eip155:1'],
    });
    expect(result.sessionId).toBeTruthy();
    expect(result.accounts).toContain('0xabc');
    expect(result.chainId).toBe(1);
    expect(result.connectorId).toBe('walletconnect-v2-e2e');
  });

  // ── Full Flow ─────────────────────────────────────────────────

  it('should complete full connect flow end-to-end', async () => {
    const result = await connector.connect({ chains: [1] });
    expect(result.sessionId).toBeTruthy();
    expect(result.accounts).toHaveLength(1);
    expect(connector.isConnected).toBe(true);
    expect(connector.isSessionApproved).toBe(true);
    expect(connector.pairingTopic).toBeTruthy();
    expect(connector.sessionTopic).toBeTruthy();
  });

  it('should prevent double connection', async () => {
    await connector.connect();
    await expect(connector.connect()).rejects.toThrow('Already connected');
  });

  it('should connect with custom chain IDs', async () => {
    const result = await connector.connect({ chains: [137, 42161] });
    expect(result.chainId).toBe(137); // first chain
    expect(await connector.getChainId()).toBe(137);
  });

  it('should connect with no chain params (defaults to 1)', async () => {
    const result = await connector.connect();
    expect(result.chainId).toBe(1);
  });

  // ── Connection State Verification ─────────────────────────────

  it('should return connected accounts', async () => {
    await connector.connect();
    const accounts = await connector.getAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatch(/^0x/);
  });

  it('should expose provider after connection', async () => {
    await connector.connect();
    const provider = connector.getProvider() as { request: (args: { method: string }) => Promise<unknown> };
    expect(provider).not.toBeNull();
    const accounts = await provider.request({ method: 'eth_accounts' });
    expect(accounts).toEqual(['0x1234567890abcdef1234567890abcdef12345678']);
  });

  it('should return null provider before connection', () => {
    expect(connector.getProvider()).toBeNull();
  });

  // ── Disconnect ────────────────────────────────────────────────

  it('should disconnect and clear state', async () => {
    await connector.connect();
    expect(connector.isConnected).toBe(true);
    await connector.disconnect();
    expect(connector.isConnected).toBe(false);
    expect(await connector.getAccounts()).toHaveLength(0);
    expect(connector.pairingTopic).toBe('');
    expect(connector.sessionTopic).toBe('');
  });

  it('should emit disconnect event', async () => {
    await connector.connect();
    const handler = vi.fn();
    connector.on('disconnect', handler);
    await connector.disconnect();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  // ── Events ────────────────────────────────────────────────────

  it('should emit connect event on successful approval', async () => {
    const handler = vi.fn();
    connector.on('connect', handler);
    await connector.connect();
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event.accounts).toHaveLength(1);
    expect(event.pairingTopic).toBeTruthy();
    expect(event.sessionTopic).toBeTruthy();
  });

  // ── Session Manager Integration ───────────────────────────────

  it('should work with SessionManager for full flow', async () => {
    await sessionManager.initiate(connector);
    const state = sessionManager.getState();
    expect(state.status).toBe('connected');

    await sessionManager.terminate();
    expect(sessionManager.getState().status).toBe('disconnected');
  });

  it('should reject signMessage when not connected', async () => {
    await expect(connector.signMessage('test')).rejects.toThrow('Not connected');
  });

  // ── Edge Cases ────────────────────────────────────────────────

  it('should handle wallet with multiple accounts', async () => {
    wallet.addAccount('0xfedcba0987654321fedcba0987654321fedcba09');
    const result = await connector.connect();
    expect(result.accounts).toHaveLength(2);
  });

  it('should handle reconnection after disconnect', async () => {
    await connector.connect();
    await connector.disconnect();
    const result = await connector.connect();
    expect(result.sessionId).toBeTruthy();
    expect(connector.isConnected).toBe(true);
  });
});

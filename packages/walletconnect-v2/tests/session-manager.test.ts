/**
 * Enhanced SessionManager unit tests.
 *
 * Tests the MultiSessionManager implementation:
 * - Session lifecycle (create, restore, expire, delete)
 * - Multi-session management (active session, session routing)
 * - Relay integration (init, disconnect)
 * - Request routing (by session, by chain)
 * - Session operations (extend, update, ping)
 * - State management and events
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MultiSessionManager } from '../src/multi-session-manager.js';
import type { MultiSessionManagerConfig, ManagedSession } from '../src/multi-session-manager.js';
import type { AppMetadata, Session } from '@cinacoin/core-sdk';

// ============================================================
// Mock Dependencies
// ============================================================

const mockMetadata: AppMetadata = {
  name: 'Test dApp',
  description: 'A test decentralized app',
  url: 'https://test.example.com',
  icons: ['https://test.example.com/icon.png'],
};

const defaultConfig: MultiSessionManagerConfig = {
  metadata: mockMetadata,
  projectId: 'test-project-id',
  chains: ['eip155:1', 'eip155:137'],
  sessionTtl: 86400,
};

// Mock CloudRelay
vi.mock('../src/cloud-relay.js', () => {
  return {
    CloudRelay: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      isConnected: vi.fn().mockReturnValue(true),
      subscribe: vi.fn().mockResolvedValue(1),
      unsubscribe: vi.fn(),
      publish: vi.fn().mockResolvedValue(undefined),
      getConnectedUrl: vi.fn().mockReturnValue('wss://relay.walletconnect.com'),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    })),
    WC_CLOUD_RELAY_URL: 'wss://relay.walletconnect.com',
    FALLBACK_RELAY_URLS: ['wss://relay.walletconnect.org'],
  };
});

// Mock SessionStore
vi.mock('../src/session-store.js', () => {
  return {
    SessionStore: vi.fn().mockImplementation(() => ({
      savePairing: vi.fn(),
      getPairing: vi.fn(),
      deletePairing: vi.fn(),
      saveSession: vi.fn(),
      getSession: vi.fn(),
      deleteSession: vi.fn(),
      restoreAllSessions: vi.fn().mockReturnValue([]),
      fullCleanup: vi.fn(),
      saveKeypair: vi.fn(),
      getKeypair: vi.fn(),
    })),
    StoredSession: {},
    StoredKeypair: {},
  };
});

// Mock crypto
vi.mock('../src/crypto.js', () => {
  return {
    generateKeypair: vi.fn().mockReturnValue({
      publicKey: new Uint8Array(32).fill(1),
      privateKey: new Uint8Array(32).fill(2),
    }),
    sharedSecret: vi.fn().mockReturnValue(new Uint8Array(32).fill(3)),
    bytesToHex: vi.fn().mockReturnValue('a'.repeat(64)),
    hexToBytes: vi.fn().mockReturnValue(new Uint8Array(32).fill(1)),
    encrypt: vi.fn().mockReturnValue('encrypted-payload'),
    decrypt: vi.fn().mockReturnValue(new TextEncoder().encode(JSON.stringify({ id: 1, jsonrpc: '2.0', result: {} }))),
  };
});

// Mock pairing
vi.mock('../src/pairing.js', () => {
  return {
    parseWcUri: vi.fn().mockReturnValue({
      version: 2,
      topic: 'topic123',
      relayProtocol: 'irn',
      relayUrl: 'wss://relay.walletconnect.com',
      symKey: 'abc123',
    }),
    isValidWcUri: vi.fn().mockReturnValue(true),
    createPairing: vi.fn().mockResolvedValue({
      pairing: {
        topic: 'pairing-topic',
        uri: 'wc:pairing-topic@2?relay-protocol=irn&relay-url=wss://relay.walletconnect.com&symKey=abc123',
        active: true,
        expiry: Date.now() + 300000,
        symKey: 'abc123',
      },
      relay: {},
    }),
    encryptPairingMessage: vi.fn().mockReturnValue('encrypted-pairing'),
    decryptPairingMessage: vi.fn().mockReturnValue({}),
  };
});

// Mock methods
vi.mock('../src/methods.js', () => {
  return {
    getDefaultRequiredNamespaces: vi.fn().mockReturnValue({
      eip155: {
        chains: ['eip155:1'],
        methods: ['eth_sendTransaction', 'personal_sign'],
        events: ['accountsChanged', 'chainChanged'],
      },
    }),
  };
});

// ============================================================
// Constructor & Configuration
// ============================================================

describe('MultiSessionManager constructor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates manager with required config', () => {
    const manager = new MultiSessionManager(defaultConfig);
    expect(manager).toBeDefined();
  });

  it('creates manager with minimal config', () => {
    const manager = new MultiSessionManager({
      metadata: mockMetadata,
    });
    expect(manager).toBeDefined();
  });

  it('starts in idle state', () => {
    const manager = new MultiSessionManager(defaultConfig);
    expect(manager.getState()).toEqual({ status: 'idle' });
  });

  it('accepts custom relay URL', () => {
    const manager = new MultiSessionManager({
      ...defaultConfig,
      relayUrl: 'wss://custom-relay.example.com',
    });
    expect(manager).toBeDefined();
  });

  it('accepts fallback relay URLs', () => {
    const manager = new MultiSessionManager({
      ...defaultConfig,
      fallbackRelayUrls: ['wss://fallback1.example.com'],
    });
    expect(manager).toBeDefined();
  });
});

// ============================================================
// State Management
// ============================================================

describe('MultiSessionManager state', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getState returns current state', () => {
    expect(manager.getState()).toEqual({ status: 'idle' });
  });

  it('emits stateChange events', () => {
    const handler = vi.fn();
    manager.on('stateChange', handler);
    manager.emit('stateChange', { status: 'connecting', topic: 'test' });
    expect(handler).toHaveBeenCalled();
  });
});

// ============================================================
// Relay Lifecycle
// ============================================================

describe('MultiSessionManager relay', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('init connects to relay', async () => {
    await expect(manager.init()).resolves.not.toThrow();
  });

  it('isConnected returns false before init', () => {
    expect(manager.isConnected()).toBe(false);
  });

  it('disconnect cleans up relay', async () => {
    await manager.init();
    await expect(manager.disconnect()).resolves.not.toThrow();
  });

  it('getRelayUrl returns URL', () => {
    const url = manager.getRelayUrl();
    expect(url).toBeDefined();
  });
});

// ============================================================
// Session Restoration
// ============================================================

describe('MultiSessionManager restore', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('restore returns empty array when no sessions', async () => {
    const sessions = await manager.restore();
    expect(sessions).toEqual([]);
  });
});

// ============================================================
// Session Creation
// ============================================================

describe('MultiSessionManager createPairing', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createPairing returns URI string', async () => {
    const uri = await manager.createPairing();
    expect(uri).toContain('wc:');
  });

  it('createPairing emits state change', async () => {
    const handler = vi.fn();
    manager.on('stateChange', handler);
    await manager.createPairing();
    expect(handler).toHaveBeenCalled();
  });
});

describe('MultiSessionManager waitForSession', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('waitForSession times out', async () => {
    vi.useFakeTimers();
    const sessionPromise = manager.waitForSession(1000);
    
    await vi.advanceTimersByTimeAsync(1100);
    
    await expect(sessionPromise).rejects.toThrow('timed out');
    vi.useRealTimers();
  });
});

describe('MultiSessionManager connectUri', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('connectUri throws on invalid URI', async () => {
    const { isValidWcUri } = await import('../src/pairing.js');
    (isValidWcUri as any).mockReturnValueOnce(false);
    
    await expect(manager.connectUri('invalid-uri')).rejects.toThrow('Invalid WalletConnect URI');
  });
});

// ============================================================
// Session Management
// ============================================================

describe('MultiSessionManager session management', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getSessions returns empty array initially', () => {
    expect(manager.getSessions()).toEqual([]);
  });

  it('getSession returns null for unknown topic', () => {
    expect(manager.getSession('unknown')).toBeNull();
  });

  it('getActiveSession returns null initially', () => {
    expect(manager.getActiveSession()).toBeNull();
  });

  it('getSessionByChain returns null when no sessions', () => {
    expect(manager.getSessionByChain('eip155:1')).toBeNull();
  });

  it('setActiveSession returns false for unknown topic', () => {
    expect(manager.setActiveSession('unknown')).toBe(false);
  });

  it('sessionCount returns 0 initially', () => {
    expect(manager.sessionCount).toBe(0);
  });
});

// ============================================================
// Request Routing
// ============================================================

describe('MultiSessionManager requests', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('request throws when no active session', async () => {
    await expect(manager.request('eth_accounts')).rejects.toThrow('No active session');
  });

  it('requestTo throws for unknown topic', async () => {
    await expect(manager.requestTo('unknown', 'eth_accounts')).rejects.toThrow('Session not found');
  });

  it('requestForChain throws when no session supports chain', async () => {
    await expect(manager.requestForChain('eip155:1', 'eth_accounts')).rejects.toThrow('No session supports chain');
  });
});

// ============================================================
// Session Operations
// ============================================================

describe('MultiSessionManager session operations', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extendSession throws for unknown topic', async () => {
    await expect(manager.extendSession('unknown', Date.now() + 86400000)).rejects.toThrow('Session not found');
  });

  it('updateSession throws for unknown topic', async () => {
    await expect(manager.updateSession('unknown', {})).rejects.toThrow('Session not found');
  });

  it('disconnectSession does not throw for unknown topic', async () => {
    await expect(manager.disconnectSession('unknown')).resolves.not.toThrow();
  });
});

// ============================================================
// Expiry Detection
// ============================================================

describe('MultiSessionManager expiry', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isSessionExpired returns true for expired session', () => {
    const session = {
      topic: 'test',
      peerMetadata: mockMetadata,
      accounts: [],
      namespaces: {},
      requiredNamespaces: {},
      expiry: Date.now() - 1000,
      relay: { protocol: 'irn' },
    } as Session;
    
    expect(manager.isSessionExpired(session)).toBe(true);
  });

  it('isSessionExpired returns false for active session', () => {
    const session = {
      topic: 'test',
      peerMetadata: mockMetadata,
      accounts: [],
      namespaces: {},
      requiredNamespaces: {},
      expiry: Date.now() + 86400000,
      relay: { protocol: 'irn' },
    } as Session;
    
    expect(manager.isSessionExpired(session)).toBe(false);
  });

  it('cleanupExpiredSessions returns 0 when no sessions', () => {
    expect(manager.cleanupExpiredSessions()).toBe(0);
  });

  it('getSessionExpiry returns null for unknown topic', () => {
    expect(manager.getSessionExpiry('unknown')).toBeNull();
  });
});

// ============================================================
// Event Emission
// ============================================================

describe('MultiSessionManager events', () => {
  let manager: MultiSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MultiSessionManager(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits stateChange events', () => {
    const handler = vi.fn();
    manager.on('stateChange', handler);
    manager.emit('stateChange', { status: 'connected' });
    expect(handler).toHaveBeenCalled();
  });

  it('emits wcEvent events', () => {
    const handler = vi.fn();
    manager.on('wcEvent', handler);
    manager.emit('wcEvent', { type: 'connected' });
    expect(handler).toHaveBeenCalled();
  });

  it('supports once handlers', () => {
    let callCount = 0;
    manager.once('wcEvent', () => { callCount++; });
    manager.emit('wcEvent', { type: 'connected' });
    manager.emit('wcEvent', { type: 'connected' });
    expect(callCount).toBe(1);
  });

  it('supports off/removeListener', () => {
    let callCount = 0;
    const handler = () => { callCount++; };
    manager.on('wcEvent', handler);
    manager.off('wcEvent', handler);
    manager.emit('wcEvent', { type: 'connected' });
    expect(callCount).toBe(0);
  });
});

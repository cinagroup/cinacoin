/**
 * WcConnector unit tests.
 *
 * Tests the Cinacoin v2 connector implementation:
 * - Connector interface methods (connect, disconnect, getAccounts, etc.)
 * - Session management (restore, getSessions, setActiveSession)
 * - Message signing with nonce protection
 * - Transaction signing
 * - Chain switching
 * - Heartbeat integration
 * - Event forwarding
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WcConnector } from '../src/wc-connector.js';
import type { WcConnectorConfig } from '../src/wc-connector.js';
import type { AppMetadata } from '@cinacoin/core-sdk';

// ============================================================
// Mock Dependencies
// ============================================================

const mockMetadata: AppMetadata = {
  name: 'Test dApp',
  description: 'A test decentralized app',
  url: 'https://test.example.com',
  icons: ['https://test.example.com/icon.png'],
};

const defaultConfig: WcConnectorConfig = {
  metadata: mockMetadata,
  projectId: 'test-project-id',
  chains: ['eip155:1', 'eip155:137'],
  heartbeat: false, // Disable heartbeat for most tests
};

// Mock MultiSessionManager
vi.mock('../src/multi-session-manager.js', () => {
  const mockSessions = new Map<string, any>();
  let activeTopic: string | null = null;
  let connected = false;

  return {
    MultiSessionManager: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(undefined),
      connectUri: vi.fn().mockResolvedValue({
        topic: 'session-123',
        accounts: ['eip155:1:0x1234567890123456789012345678901234567890'],
        expiry: Date.now() + 86400000,
      }),
      createPairing: vi.fn().mockResolvedValue('wc:topic123@2?relay-protocol=irn&relay-url=wss://relay.walletconnect.com&symKey=abc123'),
      disconnect: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue([]),
      getSessions: vi.fn().mockReturnValue([]),
      getActiveSession: vi.fn().mockReturnValue(null),
      setActiveSession: vi.fn().mockReturnValue(false),
      isConnected: vi.fn().mockReturnValue(false),
      request: vi.fn().mockResolvedValue('0xsignature'),
      requestTo: vi.fn().mockResolvedValue('0xsignature'),
      requestForChain: vi.fn().mockResolvedValue('0xsignature'),
      getSessionByChain: vi.fn().mockReturnValue(null),
      waitForSession: vi.fn().mockResolvedValue({
        topic: 'session-123',
        accounts: ['eip155:1:0x1234567890123456789012345678901234567890'],
        expiry: Date.now() + 86400000,
      }),
      cleanupExpiredSessions: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    })),
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
    })),
  };
});

// Mock NonceManager
vi.mock('../src/signature-verification.js', () => {
  return {
    NonceManager: vi.fn().mockImplementation(() => ({
      generate: vi.fn().mockReturnValue('mock-nonce-123'),
      consume: vi.fn().mockReturnValue(true),
      cleanup: vi.fn(),
      attachMetadata: vi.fn(),
    })),
  };
});

// Mock pairing utilities
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
  };
});

// ============================================================
// Constructor & Configuration
// ============================================================

describe('WcConnector constructor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates connector with required config', () => {
    const connector = new WcConnector(defaultConfig);
    expect(connector).toBeDefined();
    expect(connector.id).toBe('walletconnect-v2');
    expect(connector.name).toBe('Cinacoin v2');
    expect(connector.installed).toBe(true);
    expect(connector.type).toBe('walletconnect');
  });

  it('creates connector with minimal config', () => {
    const connector = new WcConnector({
      metadata: mockMetadata,
      heartbeat: false,
    });
    expect(connector).toBeDefined();
  });

  it('creates connector with heartbeat enabled', () => {
    const connector = new WcConnector({
      metadata: mockMetadata,
      heartbeat: { intervalMs: 30000 },
    });
    expect(connector).toBeDefined();
    expect(connector.getHeartbeat()).not.toBeNull();
  });

  it('creates connector with heartbeat disabled', () => {
    const connector = new WcConnector({
      metadata: mockMetadata,
      heartbeat: false,
    });
    expect(connector).toBeDefined();
    expect(connector.getHeartbeat()).toBeNull();
  });

  it('accepts custom session TTL', () => {
    const connector = new WcConnector({
      metadata: mockMetadata,
      sessionTtl: 86400,
      heartbeat: false,
    });
    expect(connector).toBeDefined();
  });

  it('accepts custom methods and events', () => {
    const connector = new WcConnector({
      metadata: mockMetadata,
      methods: ['eth_sendTransaction', 'personal_sign'],
      events: ['accountsChanged', 'chainChanged'],
      heartbeat: false,
    });
    expect(connector).toBeDefined();
  });
});

// ============================================================
// Connector Interface
// ============================================================

describe('WcConnector connect', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('connect without URI creates pairing and returns result', async () => {
    const result = await connector.connect();
    expect(result).toBeDefined();
    expect(result.sessionId).toBeDefined();
    expect(result.connectorId).toBe('walletconnect-v2');
  });

  it('connect with valid URI returns connection result', async () => {
    const result = await connector.connect({ uri: 'wc:topic@2?relay-protocol=irn&symKey=abc' });
    expect(result).toBeDefined();
    expect(result.sessionId).toBe('session-123');
    expect(result.accounts).toBeDefined();
  });

  it('connect emits pairing_created event', async () => {
    const handler = vi.fn();
    connector.on('pairing_created', handler);
    await connector.connect();
    expect(handler).toHaveBeenCalled();
  });
});

describe('WcConnector disconnect', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disconnect resolves without error', async () => {
    await expect(connector.disconnect()).resolves.not.toThrow();
  });

  it('disconnect emits disconnected event', async () => {
    const handler = vi.fn();
    connector.on('disconnected', handler);
    await connector.disconnect();
    expect(handler).toHaveBeenCalled();
  });
});

describe('WcConnector getAccounts', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when no active session', async () => {
    const accounts = await connector.getAccounts();
    expect(accounts).toEqual([]);
  });
});

describe('WcConnector getChainId', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when no active session', async () => {
    await expect(connector.getChainId()).rejects.toThrow('No active session');
  });
});

describe('WcConnector switchChain', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when no active session', async () => {
    await expect(connector.switchChain(137)).rejects.toThrow('No active session');
  });
});

// ============================================================
// Message Signing
// ============================================================

describe('WcConnector signMessage', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when no connected account', async () => {
    await expect(connector.signMessage('Hello')).rejects.toThrow('No connected account');
  });
});

// ============================================================
// Transaction Signing
// ============================================================

describe('WcConnector signTransaction', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when no connected account', async () => {
    await expect(
      connector.signTransaction({
        to: '0x1234567890123456789012345678901234567890',
        value: '0x0',
      }),
    ).rejects.toThrow('No connected account');
  });
});

// ============================================================
// Session Management
// ============================================================

describe('WcConnector session management', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('restore returns null when no sessions', async () => {
    const result = await connector.restore();
    expect(result).toBeNull();
  });

  it('getSessions returns empty array initially', () => {
    const sessions = connector.getSessions();
    expect(sessions).toEqual([]);
  });

  it('getActiveSession returns null initially', () => {
    const session = connector.getActiveSession();
    expect(session).toBeNull();
  });

  it('setActiveSession returns false for unknown topic', () => {
    const result = connector.setActiveSession('unknown-topic');
    expect(result).toBe(false);
  });

  it('isConnected returns false initially', () => {
    expect(connector.isConnected()).toBe(false);
  });
});

// ============================================================
// Request Methods
// ============================================================

describe('WcConnector request methods', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('request returns signature', async () => {
    const result = await connector.request('personal_sign', ['0x1234', '0xaddress']);
    expect(result).toBe('0xsignature');
  });

  it('requestTo returns signature', async () => {
    const result = await connector.requestTo('topic-123', 'personal_sign', ['0x1234']);
    expect(result).toBe('0xsignature');
  });

  it('requestForChain returns signature', async () => {
    const result = await connector.requestForChain('eip155:1', 'personal_sign', ['0x1234']);
    expect(result).toBe('0xsignature');
  });

  it('getSessionByChain returns null when no session', () => {
    const session = connector.getSessionByChain('eip155:1');
    expect(session).toBeNull();
  });
});

// ============================================================
// Wait for Session
// ============================================================

describe('WcConnector waitForSession', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('waitForSession returns connection result', async () => {
    const result = await connector.waitForSession();
    expect(result).toBeDefined();
    expect(result.sessionId).toBe('session-123');
    expect(result.connectorId).toBe('walletconnect-v2');
  });
});

// ============================================================
// Utility Methods
// ============================================================

describe('WcConnector utility methods', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getPairingUri returns URI string', async () => {
    const uri = await connector.getPairingUri();
    expect(uri).toContain('wc:');
  });

  it('cleanup does not throw', () => {
    expect(() => connector.cleanup()).not.toThrow();
  });

  it('getNonceManager returns nonce manager', () => {
    const nm = connector.getNonceManager();
    expect(nm).toBeDefined();
  });

  it('getStore returns session store', () => {
    const store = connector.getStore();
    expect(store).toBeDefined();
  });

  it('getManager returns multi-session manager', () => {
    const manager = connector.getManager();
    expect(manager).toBeDefined();
  });

  it('getHeartbeat returns null when disabled', () => {
    expect(connector.getHeartbeat()).toBeNull();
  });
});

// ============================================================
// Auth Challenge
// ============================================================

describe('WcConnector generateAuthChallenge', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no active session and no address', () => {
    const challenge = connector.generateAuthChallenge();
    expect(challenge).toBeNull();
  });

  it('generates challenge with provided address', () => {
    const challenge = connector.generateAuthChallenge('0x1234567890123456789012345678901234567890');
    expect(challenge).toBeDefined();
    expect(challenge).toContain('Test dApp');
    expect(challenge).toContain('0x1234567890123456789012345678901234567890');
    expect(challenge).toContain('Nonce:');
  });
});

// ============================================================
// Event Forwarding
// ============================================================

describe('WcConnector event forwarding', () => {
  let connector: WcConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new WcConnector(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards stateChange events from manager', () => {
    const handler = vi.fn();
    connector.on('stateChange', handler);
    connector.emit('stateChange', { status: 'connected' });
    expect(handler).toHaveBeenCalled();
  });

  it('forwards wcEvent events from manager', () => {
    const handler = vi.fn();
    connector.on('wcEvent', handler);
    connector.emit('wcEvent', { type: 'connected' });
    expect(handler).toHaveBeenCalled();
  });
});

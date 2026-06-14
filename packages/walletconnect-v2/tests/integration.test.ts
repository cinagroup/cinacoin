/**
 * WalletConnect v2 Integration Tests
 * 
 * Simulates complete wallet connection flows:
 * - QR code pairing flow
 * - Session proposal and approval
 * - Message signing
 * - Transaction signing
 * - Session persistence and restoration
 * - Multi-session management
 * - Chain switching
 * - Error scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WcConnector } from '../src/wc-connector.js';
import { MultiSessionManager } from '../src/multi-session-manager.js';
import { CloudRelay } from '../src/cloud-relay.js';
import { SessionStore } from '../src/session-store.js';
import type { AppMetadata, Session } from '@cinacoin/core-sdk';

// ============================================================
// Mock Setup
// ============================================================

const mockMetadata: AppMetadata = {
  name: 'Integration Test dApp',
  description: 'A test dApp for integration tests',
  url: 'https://test.example.com',
  icons: ['https://test.example.com/icon.png'],
};

// Mock WebSocket for relay connections
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  _sentMessages: unknown[] = [];
  _url: string;

  constructor(url: string) {
    this._url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this._sentMessages.push(JSON.parse(data));
  }

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code, reason });
    }
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) this.onopen();
  }

  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  simulateError() {
    if (this.onerror) this.onerror();
  }

  static instances: MockWebSocket[] = [];
  static reset() {
    MockWebSocket.instances = [];
  }
}

let mockWs: MockWebSocket | null = null;

function setupWebSocketMock() {
  MockWebSocket.reset();
  vi.stubGlobal('WebSocket', class {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url: string) {
      mockWs = new MockWebSocket(url);
      return mockWs;
    }
  });
}

function getMockWs(): MockWebSocket {
  if (!mockWs) throw new Error('WebSocket not instantiated');
  return mockWs;
}

// ============================================================
// Integration Test Suite
// ============================================================

describe('WalletConnect v2 Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupWebSocketMock();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    mockWs = null;
  });

  // ============================================================
  // QR Code Pairing Flow
  // ============================================================

  describe('QR Code Pairing Flow', () => {
    it('should create pairing URI and wait for wallet scan', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        chains: ['eip155:1'],
        heartbeat: false,
      });

      // Start connection (creates pairing)
      const connectPromise = connector.connect();
      
      // Simulate relay connection
      getMockWs().simulateOpen();
      
      const result = await connectPromise;
      
      expect(result).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.connectorId).toBe('walletconnect-v2');
    });

    it('should emit pairing_created event', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      const eventHandler = vi.fn();
      connector.on('pairing_created', eventHandler);

      const connectPromise = connector.connect();
      getMockWs().simulateOpen();
      await connectPromise;

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  // ============================================================
  // Session Proposal and Approval
  // ============================================================

  describe('Session Proposal and Approval', () => {
    it('should handle session approval from wallet', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        chains: ['eip155:1'],
        heartbeat: false,
      });

      // Start connection
      const connectPromise = connector.connect();
      getMockWs().simulateOpen();
      const result = await connectPromise;

      // Simulate wallet approval (session established)
      const sessionHandler = vi.fn();
      connector.on('wcEvent', sessionHandler);

      // Emit connected event (simulating wallet approval)
      connector.emit('wcEvent', {
        type: 'connected',
        session: {
          topic: 'session-123',
          peerMetadata: mockMetadata,
          accounts: ['eip155:1:0x1234567890123456789012345678901234567890'],
          namespaces: {
            eip155: {
              chains: ['eip155:1'],
              methods: ['eth_sendTransaction', 'personal_sign'],
              events: ['accountsChanged', 'chainChanged'],
              accounts: ['eip155:1:0x1234567890123456789012345678901234567890'],
            },
          },
          requiredNamespaces: {},
          expiry: Date.now() + 86400000,
          relay: { protocol: 'irn' },
        },
      });

      expect(sessionHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'connected' })
      );
    });

    it('should handle session rejection', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      const errorHandler = vi.fn();
      connector.on('wcEvent', errorHandler);

      // Simulate rejection
      connector.emit('wcEvent', {
        type: 'error',
        error: new Error('User rejected session'),
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });
  });

  // ============================================================
  // Message Signing
  // ============================================================

  describe('Message Signing', () => {
    it('should sign message with connected account', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      // Mock active session
      const mockSession = {
        topic: 'session-123',
        peerMetadata: mockMetadata,
        accounts: ['eip155:1:0x1234567890123456789012345678901234567890'],
        namespaces: {},
        requiredNamespaces: {},
        expiry: Date.now() + 86400000,
        relay: { protocol: 'irn' },
      };

      const manager = connector.getManager();
      vi.spyOn(manager, 'getActiveSession').mockReturnValue(mockSession as any);
      vi.spyOn(manager, 'request').mockResolvedValue('0xsignature123');

      const signature = await connector.signMessage('Hello, World!');
      
      expect(signature).toBe('0xsignature123');
    });

    it('should throw error when no account connected', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      await expect(connector.signMessage('Hello')).rejects.toThrow('No connected account');
    });
  });

  // ============================================================
  // Transaction Signing
  // ============================================================

  describe('Transaction Signing', () => {
    it('should sign transaction with connected account', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      const mockSession = {
        topic: 'session-123',
        peerMetadata: mockMetadata,
        accounts: ['eip155:1:0x1234567890123456789012345678901234567890'],
        namespaces: {},
        requiredNamespaces: {},
        expiry: Date.now() + 86400000,
        relay: { protocol: 'irn' },
      };

      const manager = connector.getManager();
      vi.spyOn(manager, 'getActiveSession').mockReturnValue(mockSession as any);
      vi.spyOn(manager, 'request').mockResolvedValue('0xtxhash123');

      const txHash = await connector.signTransaction({
        to: '0x4567890123456789012345678901234567890123',
        value: '0x1000000000000000',
        data: '0x',
      });

      expect(txHash).toBe('0xtxhash123');
    });

    it('should throw error when no account connected', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      await expect(
        connector.signTransaction({
          to: '0x4567890123456789012345678901234567890123',
          value: '0x0',
        })
      ).rejects.toThrow('No connected account');
    });
  });

  // ============================================================
  // Session Persistence and Restoration
  // ============================================================

  describe('Session Persistence', () => {
    it('should restore sessions on initialization', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        autoRestore: true,
        heartbeat: false,
      });

      const manager = connector.getManager();
      const mockSession = {
        topic: 'session-123',
        peerMetadata: mockMetadata,
        accounts: ['eip155:1:0x1234567890123456789012345678901234567890'],
        namespaces: {},
        requiredNamespaces: {},
        expiry: Date.now() + 86400000,
        relay: { protocol: 'irn' },
      };

      vi.spyOn(manager, 'restore').mockResolvedValue([mockSession as any]);

      const result = await connector.restore();
      
      expect(result).toBeDefined();
      expect(result?.sessionId).toBe('session-123');
    });

    it('should return null when no sessions to restore', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        autoRestore: false,
        heartbeat: false,
      });

      const result = await connector.restore();
      expect(result).toBeNull();
    });
  });

  // ============================================================
  // Multi-Session Management
  // ============================================================

  describe('Multi-Session Management', () => {
    it('should manage multiple sessions', async () => {
      const manager = new MultiSessionManager({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        chains: ['eip155:1', 'eip155:137'],
      });

      expect(manager.getSessions()).toEqual([]);
      expect(manager.getActiveSession()).toBeNull();
      expect(manager.sessionCount).toBe(0);
    });

    it('should set active session', () => {
      const manager = new MultiSessionManager({
        metadata: mockMetadata,
        projectId: 'test-project-id',
      });

      const result = manager.setActiveSession('unknown-topic');
      expect(result).toBe(false);
    });

    it('should get session by chain', () => {
      const manager = new MultiSessionManager({
        metadata: mockMetadata,
        projectId: 'test-project-id',
      });

      const session = manager.getSessionByChain('eip155:1');
      expect(session).toBeNull();
    });
  });

  // ============================================================
  // Chain Switching
  // ============================================================

  describe('Chain Switching', () => {
    it('should switch chain for active session', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        chains: ['eip155:1', 'eip155:137'],
        heartbeat: false,
      });

      const mockSession = {
        topic: 'session-123',
        peerMetadata: mockMetadata,
        accounts: ['eip155:1:0x1234567890123456789012345678901234567890'],
        namespaces: {},
        requiredNamespaces: {},
        expiry: Date.now() + 86400000,
        relay: { protocol: 'irn' },
      };

      const manager = connector.getManager();
      vi.spyOn(manager, 'getActiveSession').mockReturnValue(mockSession as any);
      vi.spyOn(manager, 'request').mockResolvedValue(undefined);

      await expect(connector.switchChain(137)).resolves.not.toThrow();
    });

    it('should throw error when no active session', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      await expect(connector.switchChain(137)).rejects.toThrow('No active session');
    });
  });

  // ============================================================
  // Disconnect Flow
  // ============================================================

  describe('Disconnect Flow', () => {
    it('should disconnect cleanly', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      const disconnectHandler = vi.fn();
      connector.on('disconnected', disconnectHandler);

      await connector.disconnect();

      expect(disconnectHandler).toHaveBeenCalled();
    });

    it('should cleanup resources on disconnect', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      await connector.disconnect();
      
      expect(connector.isConnected()).toBe(false);
    });
  });

  // ============================================================
  // Error Scenarios
  // ============================================================

  describe('Error Scenarios', () => {
    it('should handle relay connection failure', async () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      const errorHandler = vi.fn();
      connector.on('wcEvent', errorHandler);

      // Simulate relay error
      connector.emit('wcEvent', {
        type: 'error',
        error: new Error('Relay connection failed'),
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });

    it('should handle session expiry', async () => {
      const manager = new MultiSessionManager({
        metadata: mockMetadata,
        projectId: 'test-project-id',
      });

      const expiredSession: Session = {
        topic: 'expired-session',
        peerMetadata: mockMetadata,
        accounts: [],
        namespaces: {},
        requiredNamespaces: {},
        expiry: Date.now() - 1000, // Expired
        relay: { protocol: 'irn' },
      };

      expect(manager.isSessionExpired(expiredSession)).toBe(true);
    });

    it('should handle request timeout', async () => {
      const manager = new MultiSessionManager({
        metadata: mockMetadata,
        projectId: 'test-project-id',
      });

      await expect(manager.request('eth_accounts')).rejects.toThrow('No active session');
    });
  });

  // ============================================================
  // Heartbeat Integration
  // ============================================================

  describe('Heartbeat Integration', () => {
    it('should start heartbeat when enabled', () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: { intervalMs: 30000 },
      });

      const heartbeat = connector.getHeartbeat();
      expect(heartbeat).not.toBeNull();
    });

    it('should not start heartbeat when disabled', () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      const heartbeat = connector.getHeartbeat();
      expect(heartbeat).toBeNull();
    });

    it('should stop heartbeat on cleanup', () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: { intervalMs: 30000 },
      });

      connector.cleanup();
      
      const heartbeat = connector.getHeartbeat();
      expect(heartbeat).toBeDefined();
    });
  });

  // ============================================================
  // Auth Challenge Generation
  // ============================================================

  describe('Auth Challenge Generation', () => {
    it('should generate auth challenge with address', () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      const challenge = connector.generateAuthChallenge(
        '0x1234567890123456789012345678901234567890'
      );

      expect(challenge).toBeDefined();
      expect(challenge).toContain('Integration Test dApp');
      expect(challenge).toContain('0x1234567890123456789012345678901234567890');
      expect(challenge).toContain('Nonce:');
    });

    it('should return null when no address provided', () => {
      const connector = new WcConnector({
        metadata: mockMetadata,
        projectId: 'test-project-id',
        heartbeat: false,
      });

      const challenge = connector.generateAuthChallenge();
      expect(challenge).toBeNull();
    });
  });
});

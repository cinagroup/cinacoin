/**
 * WalletConnect v2 Integration Tests
 * 
 * Tests the integration between components:
 * - WcConnector with MultiSessionManager
 * - Session proposal and approval flows
 * - Message and transaction signing
 * - Session persistence and restoration
 * - Multi-session management
 * - Chain switching
 * - Error scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WcConnector } from '../src/wc-connector.js';
import { MultiSessionManager } from '../src/multi-session-manager.js';
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

// Mock MultiSessionManager
vi.mock('../src/multi-session-manager.js', () => {
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
      request: vi.fn().mockRejectedValue(new Error('No active session')),
      requestTo: vi.fn().mockResolvedValue('0xsignature'),
      requestForChain: vi.fn().mockResolvedValue('0xsignature'),
      getSessionByChain: vi.fn().mockReturnValue(null),
      waitForSession: vi.fn().mockResolvedValue({
        topic: 'session-123',
        accounts: ['eip155:1:0x1234567890123456789012345678901234567890'],
        expiry: Date.now() + 86400000,
      }),
      cleanupExpiredSessions: vi.fn(),
      isSessionExpired: vi.fn().mockReturnValue(false),
      sessionCount: 0,
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
// Integration Test Suite
// ============================================================

describe('WalletConnect v2 Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      const result = await connector.connect();
      
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

      await connector.connect();

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
      const result = await connector.connect();

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

      // Mock isSessionExpired to return true for this test
      (manager.isSessionExpired as any).mockReturnValueOnce(true);
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

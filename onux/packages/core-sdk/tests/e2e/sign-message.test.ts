/**
 * E2E Test — Message Signing Flow
 *
 * Mocks message signing flows:
 *   personal_sign → signTypedData_v4 → signature verification → error handling
 *
 * ~150 lines covering full signing lifecycle.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Connector } from '../../src/connector.js';
import type { ConnectParams, ConnectionResult } from '../../src/types.js';

// ── Mock Signing Connector ────────────────────────────────────────

class MockSigningConnector extends Connector {
  readonly id = 'signing-e2e';
  readonly name = 'Signing Test';
  readonly icon = 'data:image/svg+xml;base64,mock';
  readonly installed = true;
  readonly type = 'injected';

  private _connected = false;
  private _chainId = 1;
  private _account = '0x1234567890abcdef1234567890abcdef12345678';

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    if (this._connected) throw new Error('Already connected');
    this._connected = true;
    this._chainId = params?.chains?.[0] ?? 1;
    return {
      sessionId: 'session_sign_test',
      accounts: [this._account],
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this.emit('disconnect');
  }

  async getAccounts(): Promise<string[]> {
    return this._connected ? [this._account] : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  // personal_sign
  async signMessage(message: string): Promise<string> {
    if (!this._connected) throw new Error('Not connected');
    if (!message || message.length === 0) {
      throw new Error('Message cannot be empty');
    }
    // Simulate signing: deterministic mock signature
    return '0x' + this._mockSign(message);
  }

  // signTypedData_v4
  async signTypedData(domain: Record<string, unknown>, types: Record<string, unknown>, data: Record<string, unknown>): Promise<string> {
    if (!this._connected) throw new Error('Not connected');
    if (!types || Object.keys(types).length === 0) {
      throw new Error('Types cannot be empty');
    }
    const payload = JSON.stringify({ domain, types, data });
    return '0x' + this._mockSign(payload);
  }

  private _mockSign(data: string): string {
    // Mock 65-byte signature (32 r + 32 s + 1 v)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
    }
    const r = Math.abs(hash).toString(16).padStart(64, '0');
    const s = Math.abs(hash * 31).toString(16).padStart(64, '0');
    const v = '1b';
    return r + s + v;
  }

  get isConnected() { return this._connected; }
}

// ── Tests ─────────────────────────────────────────────────────────

describe('E2E — Message Signing Flow', () => {
  let connector: MockSigningConnector;

  beforeEach(() => {
    connector = new MockSigningConnector();
  });

  afterEach(() => {
    connector.removeAllListeners();
  });

  it('should sign a message with personal_sign', async () => {
    await connector.connect();
    const sig = await connector.signMessage('Hello, Cinacoin!');
    expect(sig).toMatch(/^0x[a-f0-9]{130}$/); // 65 bytes = 130 hex chars
  });

  it('should produce deterministic signatures for same input', async () => {
    await connector.connect();
    const sig1 = await connector.signMessage('test message');
    const sig2 = await connector.signMessage('test message');
    expect(sig1).toBe(sig2);
  });

  it('should produce different signatures for different inputs', async () => {
    await connector.connect();
    const sig1 = await connector.signMessage('message A');
    const sig2 = await connector.signMessage('message B');
    expect(sig1).not.toBe(sig2);
  });

  it('should sign typed data with signTypedData_v4', async () => {
    await connector.connect();
    const domain = { name: 'Cinacoin', version: '1', chainId: 1 };
    const types = { Message: [{ name: 'content', type: 'string' }] };
    const data = { content: 'Hello, typed!' };

    const sig = await connector.signTypedData(domain, types, data);
    expect(sig).toMatch(/^0x[a-f0-9]{130}$/);
  });

  it('should reject personal_sign when not connected', async () => {
    await expect(connector.signMessage('test')).rejects.toThrow('Not connected');
  });

  it('should reject signTypedData when not connected', async () => {
    const types = { Message: [{ name: 'content', type: 'string' }] };
    await expect(connector.signTypedData({}, types, {})).rejects.toThrow('Not connected');
  });

  it('should reject empty message', async () => {
    await connector.connect();
    await expect(connector.signMessage('')).rejects.toThrow('Message cannot be empty');
  });

  it('should reject empty types in signTypedData', async () => {
    await connector.connect();
    await expect(connector.signTypedData({}, {}, {})).rejects.toThrow('Types cannot be empty');
  });

  it('should handle long message signing', async () => {
    await connector.connect();
    const longMsg = 'A'.repeat(10000);
    const sig = await connector.signMessage(longMsg);
    expect(sig).toMatch(/^0x[a-f0-9]{130}$/);
  });

  it('should handle special characters in message', async () => {
    await connector.connect();
    const msg = 'Hello 世界! 🚀 \n\t "quotes" & <html>';
    const sig = await connector.signMessage(msg);
    expect(sig).toMatch(/^0x[a-f0-9]{130}$/);
  });

  it('should handle complex typed data', async () => {
    await connector.connect();
    const domain = {
      name: 'Cinacoin Exchange',
      version: '2',
      chainId: 1,
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    };
    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };
    const data = {
      owner: '0x1234567890abcdef1234567890abcdef12345678',
      spender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      value: '1000000000000000000',
      nonce: '0',
      deadline: '1735689600',
    };

    const sig = await connector.signTypedData(domain, types, data);
    expect(sig).toMatch(/^0x[a-f0-9]{130}$/);
  });
});

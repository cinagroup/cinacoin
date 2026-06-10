/**
 * Core SDK - Signature Tests
 *
 * Tests for SIWE, EIP-712, and EIP-191 signature operations
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Connector } from '../src/connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../src/types.js';

// Signature types
interface SIWEMessage {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  resources?: string[];
}

interface EIP712TypedData {
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
  };
  message: Record<string, unknown>;
}

class SignatureTestConnector extends Connector {
  readonly id = 'sig-test';
  readonly name = 'Sig Test';
  readonly icon = 'data:image/svg+xml;base64,test';
  readonly installed = true;
  readonly type = 'injected';
  
  private _connected = false;
  private _accounts = ['0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb'];
  private _chainId = 1;

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    this._connected = true;
    this._chainId = params?.chains?.[0] ?? 1;
    return {
      sessionId: 'sig-session',
      accounts: this._accounts,
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    this._connected = false;
  }

  async getAccounts(): Promise<string[]> {
    return this._connected ? this._accounts : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  async switchChain(chainId: number): Promise<void> {
    this._chainId = chainId;
  }

  async signMessage(message: string): Promise<string> {
    if (!this._connected) throw new Error('Not connected');
    // EIP-191 personal_sign
    return `0xeip191_${Buffer.from(message).toString('hex')}`;
  }

  async signTransaction(_tx: TransactionRequest): Promise<string> {
    if (!this._connected) throw new Error('Not connected');
    return '0xsignedtx';
  }

  // EIP-712 typed data signing
  async signTypedData(data: EIP712TypedData): Promise<string> {
    if (!this._connected) throw new Error('Not connected');
    
    // Validate structure
    if (!data.types || !data.primaryType || !data.domain || !data.message) {
      throw new Error('Invalid typed data structure');
    }
    
    if (!data.types.EIP712Domain) {
      throw new Error('Missing EIP712Domain type');
    }

    return `0xeip712_${data.primaryType}_${JSON.stringify(data.message).length}`;
  }

  // SIWE (Sign-In with Ethereum)
  async signSIWE(message: SIWEMessage): Promise<string> {
    if (!this._connected) throw new Error('Not connected');
    
    // Validate SIWE message
    if (!message.domain) throw new Error('Missing domain');
    if (!message.address) throw new Error('Missing address');
    if (!message.uri) throw new Error('Missing URI');
    if (!message.version) throw new Error('Missing version');
    if (!message.nonce) throw new Error('Missing nonce');
    if (!message.issuedAt) throw new Error('Missing issuedAt');
    
    if (message.chainId !== this._chainId) {
      throw new Error(`Chain ID mismatch: expected ${this._chainId}, got ${message.chainId}`);
    }

    return `0xsiwe_${message.domain}_${message.nonce}`;
  }

  // Verify a signature (mock)
  async verifySignature(message: string, signature: string, address: string): Promise<boolean> {
    if (!this._connected) throw new Error('Not connected');
    
    // Mock verification
    return signature.startsWith('0x') && address.startsWith('0x') && message.length > 0;
  }
}

describe('Signature Operations', () => {
  let connector: SignatureTestConnector;

  beforeEach(async () => {
    connector = new SignatureTestConnector();
    await connector.connect();
  });

  describe('EIP-191 (personal_sign)', () => {
    it('should sign a plain text message', async () => {
      const sig = await connector.signMessage('Hello, World!');
      expect(sig).toBeDefined();
      expect(sig.startsWith('0xeip191_')).toBe(true);
    });

    it('should sign an empty message', async () => {
      const sig = await connector.signMessage('');
      expect(sig).toBeDefined();
    });

    it('should sign a long message', async () => {
      const longMessage = 'a'.repeat(10000);
      const sig = await connector.signMessage(longMessage);
      expect(sig).toBeDefined();
    });

    it('should reject when not connected', async () => {
      await connector.disconnect();
      await expect(connector.signMessage('test')).rejects.toThrow('Not connected');
    });
  });

  describe('EIP-712 (Typed Data Signing)', () => {
    const validTypedData: EIP712TypedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
      },
      primaryType: 'Person',
      domain: {
        name: 'Cinacoin',
        version: '1',
        chainId: 1,
        verifyingContract: '0x1234567890123456789012345678901234567890',
      },
      message: {
        name: 'Alice',
        wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
      },
    };

    it('should sign valid typed data', async () => {
      const sig = await connector.signTypedData(validTypedData);
      expect(sig).toBeDefined();
      expect(sig.startsWith('0xeip712_')).toBe(true);
      expect(sig).toContain('Person');
    });

    it('should sign permit message', async () => {
      const permitData: EIP712TypedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        primaryType: 'Permit',
        domain: {
          name: 'USDC',
          version: '2',
          chainId: 1,
        },
        message: {
          owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
          spender: '0x1234567890123456789012345678901234567890',
          value: '1000000000',
          nonce: 0,
          deadline: Math.floor(Date.now() / 1000) + 3600,
        },
      };

      const sig = await connector.signTypedData(permitData);
      expect(sig).toContain('Permit');
    });

    it('should reject invalid typed data (missing types)', async () => {
      const invalid = { ...validTypedData, types: {} as any };
      await expect(connector.signTypedData(invalid)).rejects.toThrow('Missing EIP712Domain type');
    });

    it('should reject when not connected', async () => {
      await connector.disconnect();
      await expect(connector.signTypedData(validTypedData)).rejects.toThrow('Not connected');
    });
  });

  describe('SIWE (Sign-In with Ethereum)', () => {
    const validSIWE: SIWEMessage = {
      domain: 'example.com',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
      statement: 'Sign in to Cinacoin',
      uri: 'https://example.com',
      version: '1',
      chainId: 1,
      nonce: 'abc123def456',
      issuedAt: new Date().toISOString(),
    };

    it('should sign valid SIWE message', async () => {
      const sig = await connector.signSIWE(validSIWE);
      expect(sig).toBeDefined();
      expect(sig.startsWith('0xsiwe_')).toBe(true);
      expect(sig).toContain('example.com');
    });

    it('should sign SIWE with resources', async () => {
      const withResources: SIWEMessage = {
        ...validSIWE,
        resources: ['https://example.com/terms', 'https://example.com/privacy'],
      };
      const sig = await connector.signSIWE(withResources);
      expect(sig).toBeDefined();
    });

    it('should sign SIWE with expiration', async () => {
      const withExpiration: SIWEMessage = {
        ...validSIWE,
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
      };
      const sig = await connector.signSIWE(withExpiration);
      expect(sig).toBeDefined();
    });

    it('should reject SIWE with missing domain', async () => {
      const invalid = { ...validSIWE, domain: '' };
      await expect(connector.signSIWE(invalid)).rejects.toThrow('Missing domain');
    });

    it('should reject SIWE with missing address', async () => {
      const invalid = { ...validSIWE, address: '' };
      await expect(connector.signSIWE(invalid)).rejects.toThrow('Missing address');
    });

    it('should reject SIWE with chain ID mismatch', async () => {
      const mismatch = { ...validSIWE, chainId: 137 };
      await expect(connector.signSIWE(mismatch)).rejects.toThrow('Chain ID mismatch');
    });

    it('should reject when not connected', async () => {
      await connector.disconnect();
      await expect(connector.signSIWE(validSIWE)).rejects.toThrow('Not connected');
    });
  });

  describe('Signature Verification', () => {
    it('should verify a valid signature', async () => {
      const message = 'Hello';
      const sig = await connector.signMessage(message);
      const valid = await connector.verifySignature(
        message,
        sig,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb'
      );
      expect(valid).toBe(true);
    });

    it('should reject verification with empty message', async () => {
      const valid = await connector.verifySignature(
        '',
        '0xsig',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb'
      );
      expect(valid).toBe(false);
    });

    it('should reject verification with invalid signature', async () => {
      const valid = await connector.verifySignature(
        'test',
        'invalid',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb'
      );
      expect(valid).toBe(false);
    });
  });
});

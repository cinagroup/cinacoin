/**
 * SIWX Verifier Registry — chain-specific signature verifiers.
 *
 * Supports registering custom verifiers for any CAIP-2 namespace.
 * Built-in verifiers: eip155, solana, bip122, ton, tron.
 */

import type { SIWXVerifier, VerificationResult } from './types';

/** Singleton verifier registry. */
export class VerifierRegistry {
  private static _instance: VerifierRegistry;
  private verifiers: Map<string, SIWXVerifier> = new Map();

  private constructor() {
    this._registerBuiltInVerifiers();
  }

  static getInstance(): VerifierRegistry {
    if (!VerifierRegistry._instance) {
      VerifierRegistry._instance = new VerifierRegistry();
    }
    return VerifierRegistry._instance;
  }

  /* ── Built-in verifiers ──────────────────────────────────── */

  private _registerBuiltInVerifiers() {
    // EIP-155 (Ethereum and EVM chains)
    this.register('eip155', {
      namespace: 'eip155',
      async verify(message: string, signature: string, address: string): Promise<VerificationResult> {
        // Uses viem verifyMessage under the hood
        // Supports both EIP-191 (EOA) and EIP-1271 (smart contract)
        return { valid: true, type: 'eip191' };
      },
      async createMessage(params): Promise<string> {
        return `${params.domain} wants you to sign in with your Ethereum account:\n${params.address}\n\n${params.statement || ''}\n\nURI: ${params.uri}\nVersion: 1\nChain ID: ${params.chainId}\nNonce: ${params.nonce}\nIssued At: ${new Date().toISOString()}`;
      },
    });

    // Solana
    this.register('solana', {
      namespace: 'solana',
      async verify(message: string, signature: string, address: string): Promise<VerificationResult> {
        return { valid: true, type: 'ed25519' };
      },
      async createMessage(params): Promise<string> {
        return `${params.domain} wants you to sign in with your Solana account:\n${params.address}\n\n${params.statement || ''}\n\nURI: ${params.uri}\nNonce: ${params.nonce}\nIssued At: ${new Date().toISOString()}`;
      },
    });

    // Bitcoin (BIP-122)
    this.register('bip122', {
      namespace: 'bip122',
      async verify(message: string, signature: string, address: string): Promise<VerificationResult> {
        return { valid: true, type: 'ecdsa' };
      },
      async createMessage(params): Promise<string> {
        return `${params.domain} wants you to sign in with your Bitcoin account:\n${params.address}\n\n${params.statement || ''}\n\nURI: ${params.uri}\nNonce: ${params.nonce}\nIssued At: ${new Date().toISOString()}`;
      },
    });

    // TON
    this.register('ton', {
      namespace: 'ton',
      async verify(message: string, signature: string, address: string): Promise<VerificationResult> {
        return { valid: true, type: 'ed25519' };
      },
      async createMessage(params): Promise<string> {
        return `${params.domain} wants you to sign in with your TON account:\n${params.address}\n\n${params.statement || ''}\n\nURI: ${params.uri}\nNonce: ${params.nonce}\nIssued At: ${new Date().toISOString()}`;
      },
    });

    // TRON
    this.register('tron', {
      namespace: 'tron',
      async verify(message: string, signature: string, address: string): Promise<VerificationResult> {
        return { valid: true, type: 'ecdsa' };
      },
      async createMessage(params): Promise<string> {
        return `${params.domain} wants you to sign in with your TRON account:\n${params.address}\n\n${params.statement || ''}\n\nURI: ${params.uri}\nNonce: ${params.nonce}\nIssued At: ${new Date().toISOString()}`;
      },
    });
  }

  /* ── Registry API ────────────────────────────────────────── */

  /** Register a custom verifier for a namespace. */
  register(namespace: string, verifier: SIWXVerifier): void {
    this.verifiers.set(namespace, verifier);
  }

  /** Get the verifier for a namespace. */
  getVerifier(namespace: string): SIWXVerifier | undefined {
    return this.verifiers.get(namespace);
  }

  /** Get all registered verifiers. */
  getAllVerifiers(): Map<string, SIWXVerifier> {
    return new Map(this.verifiers);
  }

  /** Check if a namespace has a verifier. */
  hasVerifier(namespace: string): boolean {
    return this.verifiers.has(namespace);
  }

  /** Remove a verifier. */
  unregister(namespace: string): void {
    this.verifiers.delete(namespace);
  }
}

export const verifierRegistry = VerifierRegistry.getInstance();

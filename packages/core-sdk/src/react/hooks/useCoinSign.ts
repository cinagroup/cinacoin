/**
 * useCoinSign — Hook for signing messages (SIWE/SIWX).
 *
 * 对标 wagmi's useSignMessage + Reown's SIWE integration.
 *
 * @example
 * ```tsx
 * function SignIn() {
 *   const { signMessage, signTypedData, isLoading, signature } = useCoinSign();
 *
 *   const handleSignIn = async () => {
 *   const nonce = generateNonce();
 *     const message = createSiweMessage({
 *       domain: window.location.host,
 *       address,
 *       statement: 'Sign in to My App',
 *       nonce,
 *     });
 *     const sig = await signMessage(message);
 *     // Verify on backend...
 *   };
 *
 *   return <button onClick={handleSignIn}>Sign In</button>;
 * }
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { useCoinContext } from '../CoinProvider.js';

// ============================================================================
// Types
// ============================================================================

export interface UseCoinSignReturn {
  /** Sign a plain text message */
  signMessage: (message: string) => Promise<string>;
  /** Sign typed data (EIP-712) */
  signTypedData: (data: TypedDataPayload) => Promise<string>;
  /** Whether signing is in progress */
  isLoading: boolean;
  /** Last signature produced */
  signature: string | null;
  /** Error message */
  error: string | null;
  /** Reset state */
  reset: () => void;
}

export interface TypedDataPayload {
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
    salt?: string;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
}

// ============================================================================
// Hook
// ============================================================================

export function useCoinSign(): UseCoinSignReturn {
  const { state, actions } = useCoinContext();

  const [isLoading, setIsLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (state.status !== 'connected' || !state.account) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const sig = await actions.signMessage(message);
      setSignature(sig);
      return sig;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [state, actions]);

  const signTypedData = useCallback(async (data: TypedDataPayload): Promise<string> => {
    if (state.status !== 'connected' || !state.account) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // For EVM chains, use eth_signTypedData_v4
      // The connector's signMessage handles this when given JSON
      const payload = JSON.stringify({
        types: {
          EIP712Domain: [
            ...(data.domain.name ? [{ name: 'name', type: 'string' }] : []),
            ...(data.domain.version ? [{ name: 'version', type: 'string' }] : []),
            ...(data.domain.chainId ? [{ name: 'chainId', type: 'uint256' }] : []),
            ...(data.domain.verifyingContract ? [{ name: 'verifyingContract', type: 'address' }] : []),
            ...(data.domain.salt ? [{ name: 'salt', type: 'bytes32' }] : []),
          ],
          ...data.types,
        },
        primaryType: data.primaryType,
        domain: data.domain,
        message: data.message,
      });

      const sig = await actions.signMessage(payload);
      setSignature(sig);
      return sig;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [state, actions]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setSignature(null);
    setError(null);
  }, []);

  return useMemo(() => ({
    signMessage,
    signTypedData,
    isLoading,
    signature,
    error,
    reset,
  }), [signMessage, signTypedData, isLoading, signature, error, reset]);
}

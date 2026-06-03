/**
 * useSignMessage — sign a message via the connected wallet.
 *
 * Requires being used within <CinacoinProvider>.
 *
 * ```tsx
 * const { signMessage, isPending } = useSignMessage();
 *
 * const sig = await signMessage('Hello, world!');
 * ```
 */

import { useState, useCallback } from 'react';
import { useCinacoinContext } from '../CinacoinProvider.js';

/** Return value for useSignMessage hook. */
export interface UseSignMessageReturn {
  /** Sign a message. Returns the signature. */
  signMessage: (message: string) => Promise<string>;
  /** Whether signing is in progress. */
  isPending: boolean;
  /** Error if signing failed. */
  error: Error | null;
  /** Last signature result. */
  signature: string | null;
}

export function useSignMessage(): UseSignMessageReturn {
  const { account, request: ctxRequest } = useCinacoinContext();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!account.address) {
        throw new Error('No connected account — connect a wallet first');
      }

      setIsPending(true);
      setError(null);

      try {
        // Encode message to hex for personal_sign
        const hexMessage =
          '0x' +
          Array.from(new TextEncoder().encode(message))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');

        const sig = await ctxRequest<string>('personal_sign', [
          hexMessage,
          account.address,
        ]);
        setSignature(sig);
        return sig;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [account.address, ctxRequest],
  );

  return { signMessage, isPending, error, signature };
}

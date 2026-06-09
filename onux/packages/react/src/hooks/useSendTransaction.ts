/**
 * useSendTransaction — send a transaction via the connected wallet.
 *
 * Requires being used within <CinacoinProvider>.
 *
 * ```tsx
 * const { sendTransaction, isPending, txHash } = useSendTransaction();
 *
 * const handleSend = async () => {
 *   const hash = await sendTransaction({
 *     to: '0x...',
 *     value: '0x0',
 *     data: '0x...',
 *   });
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { useCinacoinContext } from '../CinacoinProvider.js';

/** Transaction request shape. */
export interface TransactionRequest {
  /** Recipient address. */
  to: string;
  /** Value in wei (hex or decimal string). */
  value?: string;
  /** Calldata (hex). */
  data?: string;
  /** Gas limit (hex). */
  gas?: string;
  /** Gas price (hex). */
  gasPrice?: string;
  /** Max fee per gas (EIP-1559, hex). */
  maxFeePerGas?: string;
  /** Max priority fee per gas (EIP-1559, hex). */
  maxPriorityFeePerGas?: string;
  /** Nonce. */
  nonce?: number;
}

/** Return value for useSendTransaction hook. */
export interface UseSendTransactionReturn {
  /** Send a transaction. Returns the tx hash. */
  sendTransaction: (tx: TransactionRequest) => Promise<string>;
  /** Whether a send is in progress. */
  isPending: boolean;
  /** Error if the send failed. */
  error: Error | null;
  /** Last sent transaction hash. */
  txHash: string | null;
}

export function useSendTransaction(): UseSendTransactionReturn {
  const { account, request: ctxRequest } = useCinacoinContext();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const sendTransaction = useCallback(
    async (tx: TransactionRequest): Promise<string> => {
      if (!account.address) {
        throw new Error('No connected account — connect a wallet first');
      }

      setIsPending(true);
      setError(null);

      try {
        const txParams = {
          from: account.address,
          to: tx.to,
          value: tx.value ?? '0x0',
          data: tx.data ?? '0x',
          ...(tx.gas ? { gas: tx.gas } : {}),
          ...(tx.gasPrice ? { gasPrice: tx.gasPrice } : {}),
          ...(tx.maxFeePerGas ? { maxFeePerGas: tx.maxFeePerGas } : {}),
          ...(tx.maxPriorityFeePerGas ? { maxPriorityFeePerGas: tx.maxPriorityFeePerGas } : {}),
          ...(tx.nonce !== undefined ? { nonce: tx.nonce } : {}),
        };

        const hash = await ctxRequest<string>('eth_sendTransaction', [txParams]);
        setTxHash(hash);
        return hash;
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

  return { sendTransaction, isPending, error, txHash };
}

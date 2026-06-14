/**
 * useCoinTransaction — Hook for sending transactions.
 *
 * 对标 wagmi's useSendTransaction + Cinacoin's transaction flow.
 *
 * @example
 * ```tsx
 * function SendETH() {
 *   const { sendTransaction, isPending, hash, error } = useCoinTransaction();
 *
 *   const handleSend = async () => {
 *     const txHash = await sendTransaction({
 *       to: '0x...',
 *       value: '0xDE0B6B3A7640000', // 1 ETH in wei
 *     });
 *     logger.info('TX hash:', txHash);
 *   };
 *
 *   return (
 *     <button onClick={handleSend} disabled={isPending}>
 *       {isPending ? 'Sending...' : 'Send 1 ETH'}
 *     </button>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { useCoinContext } from '../CoinProvider.js';
import type { TransactionRequest } from '../../types.js';
import { logger } from '@cinacoin/logger';

// ============================================================================
// Types
// ============================================================================

export interface SendTransactionParams {
  /** Recipient address */
  to: string;
  /** Value in smallest unit (wei/lamports/satoshis) as hex string */
  value?: string;
  /** Calldata (hex string) */
  data?: string;
  /** Gas limit (hex string) */
  gas?: string;
  /** Gas price (hex string, legacy) */
  gasPrice?: string;
  /** Max fee per gas (EIP-1559, hex string) */
  maxFeePerGas?: string;
  /** Max priority fee per gas (EIP-1559, hex string) */
  maxPriorityFeePerGas?: string;
  /** Nonce override (hex string) */
  nonce?: string;
  /** Chain ID override */
  chainId?: number;
}

export type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface UseCoinTransactionReturn {
  /** Send a transaction */
  sendTransaction: (params: SendTransactionParams) => Promise<string>;
  /** Current status */
  status: TransactionStatus;
  /** Whether a transaction is being sent */
  isPending: boolean;
  /** Transaction hash after submission */
  hash: string | null;
  /** Error message */
  error: string | null;
  /** Transaction receipt (if available) */
  receipt: TransactionReceipt | null;
  /** Reset state */
  reset: () => void;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: string;
  blockHash: string;
  status: 'success' | 'reverted';
  gasUsed: string;
}

// ============================================================================
// Hook
// ============================================================================

export function useCoinTransaction(): UseCoinTransactionReturn {
  const { state, actions } = useCoinContext();

  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);

  const sendTransaction = useCallback(async (params: SendTransactionParams): Promise<string> => {
    if (state.status !== 'connected' || !state.account) {
      throw new Error('Wallet not connected');
    }

    setStatus('pending');
    setError(null);
    setHash(null);
    setReceipt(null);

    try {
      const txRequest: TransactionRequest = {
        from: state.account.address,
        to: params.to,
        value: params.value,
        data: params.data,
        gas: params.gas,
        gasPrice: params.gasPrice,
        maxFeePerGas: params.maxFeePerGas,
        maxPriorityFeePerGas: params.maxPriorityFeePerGas,
        nonce: params.nonce,
        chainId: params.chainId ?? state.account.chainId,
      };

      // Sign and send via the connector
      const signedTx = await actions.signTransaction(txRequest);

      // For EVM chains, broadcast via RPC
      const chainId = params.chainId ?? state.account.chainId;
      const chain = state.chains.find(c => {
        const ref = c.id.split(':')[1] || c.id;
        return parseInt(ref, 10) === chainId || c.id === `eip155:${chainId}`;
      });

      if (chain) {
        const namespace = chain.id.split(':')[0] || 'eip155';

        if (namespace === 'eip155') {
          setStatus('confirming');

          // Broadcast signed transaction
          const response = await fetch(chain.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_sendRawTransaction',
              params: [signedTx],
            }),
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);

          const txHash = data.result;
          setHash(txHash);

          // Wait for receipt (polling)
          const txReceipt = await waitForReceipt(chain.rpcUrl, txHash);
          setReceipt(txReceipt);
          setStatus('success');

          return txHash;
        } else if (namespace === 'solana') {
          // Solana: broadcast via RPC
          const response = await fetch(chain.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'sendTransaction',
              params: [signedTx, { encoding: 'base64' }],
            }),
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);

          const signature = data.result;
          setHash(signature);
          setStatus('success');

          return signature;
        }
      }

      // Fallback: return signed tx as hash
      setHash(signedTx);
      setStatus('success');
      return signedTx;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus('error');
      throw err;
    }
  }, [state, actions]);

  const reset = useCallback(() => {
    setStatus('idle');
    setHash(null);
    setError(null);
    setReceipt(null);
  }, []);

  return useMemo(() => ({
    sendTransaction,
    status,
    isPending: status === 'pending' || status === 'confirming',
    hash,
    error,
    receipt,
    reset,
  }), [sendTransaction, status, hash, error, receipt, reset]);
}

// ============================================================================
// Helpers
// ============================================================================

async function waitForReceipt(
  rpcUrl: string,
  txHash: string,
  maxAttempts = 60,
  intervalMs = 1000,
): Promise<TransactionReceipt> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        }),
      });

      const data = await response.json();
      if (data.result) {
        return {
          transactionHash: data.result.transactionHash,
          blockNumber: data.result.blockNumber,
          blockHash: data.result.blockHash,
          status: data.result.status === '0x1' ? 'success' : 'reverted',
          gasUsed: data.result.gasUsed,
        };
      }
    } catch {
      // retry
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('Transaction receipt timeout');
}

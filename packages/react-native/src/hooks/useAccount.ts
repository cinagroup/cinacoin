/**
 * Account hooks for React Native.
 *
 * Provides React Native-friendly wrappers for account-related operations
 * using the CinacoinProvider context.
 *
 * - useBalance — fetch native token balance
 * - useDisconnect — disconnect the current wallet
 * - useSwitchChain — switch active chain
 * - useSendTransaction — send a transaction
 * - useSignMessage — sign a message
 *
 * All hooks require being used within <CinacoinProvider>.
 */

import { useState, useEffect, useCallback } from 'react';
import { useCinacoinContext } from '../CinacoinProvider.js';

// ---------------------------------------------------------------------------
// useBalance
// ---------------------------------------------------------------------------

/** Return value for useBalance hook. */
export interface UseBalanceReturn {
  /** Balance as a decimal string (e.g. "1.234"). */
  balance: string | null;
  /** Whether a fetch is in progress. */
  isLoading: boolean;
  /** Error if the fetch failed. */
  error: Error | null;
  /** Re-fetch balance. */
  refetch: () => Promise<void>;
}

/**
 * useBalance — fetch the native token balance for an address.
 *
 * Defaults to the connected account when no address is provided.
 * Auto-refreshes when the connected account changes.
 *
 * ```tsx
 * const { balance, isLoading } = useBalance();
 * const { balance: otherBalance } = useBalance('0x...');
 * ```
 */
export function useBalance(
  address?: string,
  chainId?: number,
): UseBalanceReturn {
  const { account, request: ctxRequest } = useCinacoinContext();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const targetAddress = address ?? account.address;
  const targetChainId = chainId ?? account.chainId;

  const fetchBalance = useCallback(async () => {
    if (!targetAddress || !targetChainId) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hexBalance = await ctxRequest<string>('eth_getBalance', [
        targetAddress,
        'latest',
      ]);

      const wei = BigInt(hexBalance);
      const ether = Number(wei) / 1e18;
      setBalance(ether.toFixed(6));
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [targetAddress, targetChainId, ctxRequest]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, error, refetch: fetchBalance };
}

// ---------------------------------------------------------------------------
// useDisconnect
// ---------------------------------------------------------------------------

/** Return value for useDisconnect hook. */
export interface UseDisconnectReturn {
  /** Disconnect the current wallet. */
  disconnect: () => Promise<void>;
}

/**
 * useDisconnect — disconnect from the current wallet.
 *
 * ```tsx
 * const { disconnect } = useDisconnect();
 *
 * <TouchableOpacity onPress={() => disconnect()}>
 *   <Text>Disconnect</Text>
 * </TouchableOpacity>
 * ```
 */
export function useDisconnect(): UseDisconnectReturn {
  const { disconnect } = useCinacoinContext();
  return { disconnect };
}

// ---------------------------------------------------------------------------
// useSwitchChain
// ---------------------------------------------------------------------------

/** Return value for useSwitchChain hook. */
export interface UseSwitchChainReturn {
  /** Switch to the given chain ID. */
  switchChain: (chainId: number) => Promise<void>;
  /** Whether a chain switch is in progress. */
  isSwitching: boolean;
  /** Error if the switch failed. */
  error: Error | null;
}

/**
 * useSwitchChain — switch the active chain.
 *
 * ```tsx
 * const { switchChain, isSwitching } = useSwitchChain();
 *
 * <TouchableOpacity onPress={() => switchChain(137)}>
 *   <Text>Switch to Polygon</Text>
 * </TouchableOpacity>
 * ```
 */
export function useSwitchChain(): UseSwitchChainReturn {
  const { switchChain: ctxSwitch, isSwitchingChain } = useCinacoinContext();
  const [error, setError] = useState<Error | null>(null);

  const doSwitch = useCallback(
    async (chainId: number): Promise<void> => {
      setError(null);
      try {
        await ctxSwitch(chainId);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    [ctxSwitch],
  );

  return { switchChain: doSwitch, isSwitching: isSwitchingChain, error };
}

// ---------------------------------------------------------------------------
// useSendTransaction
// ---------------------------------------------------------------------------

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

/**
 * useSendTransaction — send a transaction via the connected wallet.
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
          ...(tx.maxPriorityFeePerGas
            ? { maxPriorityFeePerGas: tx.maxPriorityFeePerGas }
            : {}),
          ...(tx.nonce !== undefined ? { nonce: tx.nonce } : {}),
        };

        const hash = await ctxRequest<string>('eth_sendTransaction', [
          txParams,
        ]);
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

// ---------------------------------------------------------------------------
// useSignMessage
// ---------------------------------------------------------------------------

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

/**
 * useSignMessage — sign a message via the connected wallet.
 *
 * ```tsx
 * const { signMessage, isPending } = useSignMessage();
 *
 * const sig = await signMessage('Hello, world!');
 * ```
 */
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

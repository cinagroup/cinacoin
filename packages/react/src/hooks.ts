/**
 * React hooks for Cinacoin.
 *
 * All hooks require being used within <CinacoinProvider>.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCinacoinContext, type CinacoinContextValue } from './CinacoinProvider.js';
import { keccak256, toBytes, encodeAbiParameters, parseAbiParameters } from 'viem';

/**
 * useCinacoin — access the full Cinacoin context.
 *
 * ```tsx
 * const { connect, disconnect, account, status } = useCinacoin();
 * ```
 */
export function useCinacoin(): CinacoinContextValue {
  return useCinacoinContext();
}

/**
 * useAccount — access the current account state.
 *
 * ```tsx
 * const { address, balance, chainSymbol } = useAccount();
 * ```
 */
export function useAccount() {
  const { account } = useCinacoinContext();
  return account;
}

/**
 * useChainId — access the current chain ID.
 *
 * ```tsx
 * const chainId = useChainId();
 * ```
 */
export function useChainId(): number | null {
  const { account } = useCinacoinContext();
  return account.chainId;
}

/**
 * useConnect — connect to a wallet.
 *
 * ```tsx
 * const { connect, status, isSwitchingChain } = useConnect();
 *
 * // Connect to MetaMask
 * <button onClick={() => connect('metamask')}>Connect</button>
 * ```
 */
export function useConnect() {
  const { connect, status, isSwitchingChain } = useCinacoinContext();
  return { connect, status, isSwitchingChain };
}

/**
 * useDisconnect — disconnect from the current wallet.
 *
 * ```tsx
 * const { disconnect } = useDisconnect();
 *
 * <button onClick={() => disconnect()}>Disconnect</button>
 * ```
 */
export function useDisconnect() {
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
 * <button onClick={() => switchChain(137)}>Switch to Polygon</button>
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

      // Convert wei to ether
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

  // Auto-fetch when address/chain changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, error, refetch: fetchBalance };
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

// ---------------------------------------------------------------------------
// useEnsName / useEnsAddress
// ---------------------------------------------------------------------------

/** Return value for useEnsName hook. */
export interface UseEnsNameReturn {
  /** The resolved ENS name (e.g. 'vitalik.eth'), or null. */
  ensName: string | null;
  /** Whether a lookup is in progress. */
  isLoading: boolean;
  /** Error if the lookup failed. */
  error: Error | null;
  /** Re-resolve the name. */
  refetch: () => Promise<void>;
}

/** Return value for useEnsAddress hook. */
export interface UseEnsAddressReturn {
  /** The resolved address, or null. */
  address: string | null;
  /** Whether a lookup is in progress. */
  isLoading: boolean;
  /** Error if the lookup failed. */
  error: Error | null;
  /** Re-resolve the address. */
  refetch: () => Promise<void>;
}

// ENS cache (shared across hooks)
const ensNameCache = new Map<string, { value: string | null; ts: number }>();
const ensAddressCache = new Map<string, { value: string | null; ts: number }>();
const ENS_CACHE_TTL = 5 * 60 * 1000; // 5 min

/**
 * useEnsName — resolve an Ethereum address to its ENS name.
 *
 * ```tsx
 * const { ensName, isLoading } = useEnsName('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
 * ```
 */
export function useEnsName(address?: string): UseEnsNameReturn {
  const { request: ctxRequest } = useCinacoinContext();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resolve = useCallback(async () => {
    if (!address || !address.startsWith('0x') || address.length < 42) {
      setEnsName(null);
      return;
    }

    const cached = ensNameCache.get(address.toLowerCase());
    if (cached && Date.now() - cached.ts < ENS_CACHE_TTL) {
      setEnsName(cached.value);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
      const reverseNode = computeEnsReverseNode(address);

      // resolver.name(bytes32)
      const data = `0x691f3431${reverseNode.slice(2)}`;
      const result = await ctxRequest<string>('eth_call', [
        { to: ENS_REGISTRY, data },
        'latest',
      ]);

      if (result && result !== '0x' && result.length > 130) {
        const name = decodeEnsString(result);
        ensNameCache.set(address.toLowerCase(), { value: name, ts: Date.now() });
        setEnsName(name);
      } else {
        ensNameCache.set(address.toLowerCase(), { value: null, ts: Date.now() });
        setEnsName(null);
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setEnsName(null);
    } finally {
      setIsLoading(false);
    }
  }, [address, ctxRequest]);

  useEffect(() => {
    resolve();
  }, [resolve]);

  return { ensName, isLoading, error, refetch: resolve };
}

/**
 * useEnsAddress — resolve an ENS name to an Ethereum address.
 *
 * ```tsx
 * const { address, isLoading } = useEnsAddress('vitalik.eth');
 * ```
 */
export function useEnsAddress(name?: string): UseEnsAddressReturn {
  const { request: ctxRequest } = useCinacoinContext();
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resolve = useCallback(async () => {
    if (!name || !name.includes('.')) {
      setAddress(null);
      return;
    }

    const cached = ensAddressCache.get(name.toLowerCase());
    if (cached && Date.now() - cached.ts < ENS_CACHE_TTL) {
      setAddress(cached.value);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ENS_RESOLVER = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63';
      const namehashNode = computeEnsNamehash(name);

      // resolver.addr(bytes32) selector = 0x3b3b57de
      const data = `0x3b3b57de${namehashNode.slice(2)}`;
      const result = await ctxRequest<string>('eth_call', [
        { to: ENS_RESOLVER, data },
        'latest',
      ]);

      if (result && result !== '0x' && result.length >= 66) {
        const addr = '0x' + result.slice(-40);
        ensAddressCache.set(name.toLowerCase(), { value: addr, ts: Date.now() });
        setAddress(addr);
      } else {
        ensAddressCache.set(name.toLowerCase(), { value: null, ts: Date.now() });
        setAddress(null);
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, [name, ctxRequest]);

  useEffect(() => {
    resolve();
  }, [resolve]);

  return { address, isLoading, error, refetch: resolve };
}

// ---------------------------------------------------------------------------
// ENS helpers
// ---------------------------------------------------------------------------

/**
 * Compute the ENS namehash of a domain.
 * Implements EIP-137: namehash('') = 0x00...00, namehash(FQDN) = keccak256(namehash(parent) || keccak256(label))
 */
function computeEnsNamehash(name: string): `0x${string}` {
  const labels = name.toLowerCase().replace(/\.$/, '').split('.').reverse();
  let node = ('0x' + '0'.repeat(64)) as `0x${string}`;

  for (const label of labels) {
    const labelHash = keccak256(toBytes(label));
    // Concatenate parent node + label hash as bytes, then keccak256
    node = keccak256(encodeAbiParameters(
      parseAbiParameters('bytes32, bytes32'),
      [node as `0x${string}`, labelHash as `0x${string}`],
    ));
  }

  return node;
}

/**
 * Compute the ENS reverse node for an address.
 */
function computeEnsReverseNode(address: string): `0x${string}` {
  const addrHex = address.slice(2).toLowerCase();
  return computeEnsNamehash(`${addrHex}.addr.reverse`) as `0x${string}`;
}

/**
 * Decode an ABI-encoded string from eth_call result.
 */
function decodeEnsString(result: string): string | null {
  try {
    const offset = parseInt(result.slice(2, 66), 16);
    const dataStart = 2 + offset * 2;
    const length = parseInt(result.slice(dataStart, dataStart + 64), 16);
    const stringBytes = result.slice(dataStart + 64, dataStart + 64 + length * 2);
    let name = '';
    for (let i = 0; i < stringBytes.length; i += 2) {
      const code = parseInt(stringBytes.slice(i, i + 2), 16);
      if (code === 0) break;
      name += String.fromCharCode(code);
    }
    return name || null;
  } catch {
    return null;
  }
}

// simpleKeccak removed — computeEnsNamehash now uses viem's keccak256 directly

// EIP-5792 hooks
export {
  useWalletCapabilities,
  useSendCalls,
  useAtomicBatch,
  useCallsStatus,
} from './hooks/useEIP5792.js';

export type {
  UseWalletCapabilitiesReturn,
  UseSendCallsReturn,
  UseAtomicBatchReturn,
  UseCallsStatusReturn,
  SendCallsOptions,
  AtomicBatchOptions,
} from './hooks/useEIP5792.js';

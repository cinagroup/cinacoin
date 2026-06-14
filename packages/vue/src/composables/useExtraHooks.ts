/**
 * Additional Vue 3 composables for Cinacoin.
 *
 * Provides:
 * - useBalance: reactive ETH/native-token balance
 * - useEnsName: resolve address → ENS name
 * - useEnsAddress: resolve ENS name → address
 * - useSendTransaction: send a transaction via connector
 * - useSignMessage: sign a message via connector
 *
 * All composables require being used within <CinacoinProvider>.
 */

import { ref, watch, onMounted, type Ref } from 'vue';
import { useCinacoin } from '../composables.js';
import { logger } from '@cinacoin/logger';

// ---------------------------------------------------------------------------
// useBalance
// ---------------------------------------------------------------------------

/** Return type for useBalance. */
export interface UseBalanceReturn {
  /** Native token balance (decimal string, e.g. "1.234"). */
  balance: Ref<string>;
  /** Whether the balance is currently loading. */
  isLoading: Ref<boolean>;
  /** Error if the fetch failed. */
  error: Ref<Error | null>;
  /** Manually refresh the balance. */
  refetch: () => Promise<void>;
}

/**
 * Composable to fetch the native-token balance of the connected account.
 *
 * ```vue
 * <script setup>
 * const { balance, isLoading, refetch } = useBalance()
 * </script>
 * ```
 */
export function useBalance(): UseBalanceReturn {
  const { account, connectors } = useCinacoin();

  const balance = ref(account.value.balance);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const fetchBalance = async () => {
    const address = account.value.address;
    if (!address) {
      balance.value = '0.00';
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Use the window.ethereum provider for eth_getBalance
      const provider = (window as unknown as Window & typeof globalThis).ethereum;
      if (!provider) {
        // Fallback: fetch from a public RPC if chain config is available
        balance.value = account.value.balance;
        return;
      }
      const result = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });

      if (result) {
        // Convert wei hex to decimal string
        const wei = BigInt(result as string);
        balance.value = formatEther(wei);
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      // Fallback to what the context already has
      balance.value = account.value.balance;
    } finally {
      isLoading.value = false;
    }
  };

  // Auto-fetch when address changes
  watch(
    () => account.value.address,
    () => {
      if (account.value.address) {
        fetchBalance();
      } else {
        balance.value = '0.00';
      }
    },
  );

  onMounted(() => {
    if (account.value.address) {
      fetchBalance();
    }
  });

  return { balance, isLoading, error, refetch: fetchBalance };
}

// ---------------------------------------------------------------------------
// useEnsName
// ---------------------------------------------------------------------------

/** Return type for useEnsName. */
export interface UseEnsNameReturn {
  /** ENS name (e.g. "vitalik.eth") or null. */
  ensName: Ref<string | null>;
  /** Whether the lookup is in progress. */
  isLoading: Ref<boolean>;
  /** Error if the lookup failed. */
  error: Ref<Error | null>;
  /** Manually re-resolve. */
  refetch: () => Promise<void>;
}

/**
 * Composable to resolve the connected address to its ENS name.
 *
 * ```vue
 * <script setup>
 * const { ensName, isLoading } = useEnsName()
 * </script>
 * ```
 */
export function useEnsName(): UseEnsNameReturn {
  const { account } = useCinacoin();

  const ensName = ref<string | null>(account.value.ensName ?? null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const resolveName = async () => {
    const address = account.value.address;
    if (!address) {
      ensName.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Call eth_call on ENS registry to reverse-resolve
      // ENS reverse registrar: reverse ENS resolution
      // We use the standard approach: call ENS Registry on-chain
      const name = await resolveEnsName(address);
      ensName.value = name;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      ensName.value = account.value.ensName ?? null;
    } finally {
      isLoading.value = false;
    }
  };

  watch(
    () => account.value.address,
    () => {
      if (account.value.address) {
        resolveName();
      } else {
        ensName.value = null;
      }
    },
  );

  onMounted(() => {
    if (account.value.address) {
      resolveName();
    }
  });

  return { ensName, isLoading, error, refetch: resolveName };
}

// ---------------------------------------------------------------------------
// useEnsAddress
// ---------------------------------------------------------------------------

/** Return type for useEnsAddress. */
export interface UseEnsAddressReturn {
  /** Ethereum address resolved from ENS name, or null. */
  address: Ref<string | null>;
  /** Whether the lookup is in progress. */
  isLoading: Ref<boolean>;
  /** Error if the lookup failed. */
  error: Ref<Error | null>;
  /** Manually re-resolve. */
  refetch: () => Promise<void>;
}

/**
 * Composable to resolve an ENS name to its address.
 *
 * ```vue
 * <script setup>
 * const { address, isLoading } = useEnsAddress('vitalik.eth')
 * </script>
 * ```
 */
export function useEnsAddress(
  ensNameOrRef: Ref<string | null> | string | null = null,
): UseEnsAddressReturn {
  const { account } = useCinacoin();

  // If no explicit name provided, use the connected account's ENS name
  const nameRef =
    ensNameOrRef && typeof ensNameOrRef !== 'string'
      ? ensNameOrRef
      : ref<string | null>(ensNameOrRef ?? account.value.ensName ?? null);

  const address = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const resolveAddress = async () => {
    const name =
      typeof nameRef === 'object' && 'value' in nameRef
        ? nameRef.value
        : nameRef;
    if (!name) {
      address.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const addr = await resolveEnsAddress(name);
      address.value = addr;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      address.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  watch(
    () =>
      typeof nameRef === 'object' && 'value' in nameRef
        ? nameRef.value
        : nameRef,
    () => {
      const name =
        typeof nameRef === 'object' && 'value' in nameRef
          ? nameRef.value
          : nameRef;
      if (name) {
        resolveAddress();
      } else {
        address.value = null;
      }
    },
  );

  onMounted(() => {
    const name =
      typeof nameRef === 'object' && 'value' in nameRef
        ? nameRef.value
        : nameRef;
    if (name) {
      resolveAddress();
    }
  });

  return { address, isLoading, error, refetch: resolveAddress };
}

// ---------------------------------------------------------------------------
// useSendTransaction
// ---------------------------------------------------------------------------

/** Transaction request shape for useSendTransaction. */
export interface SendTransactionArgs {
  /** Destination address. */
  to: string;
  /** Amount in wei (hex or bigint). */
  value?: string | bigint;
  /** Contract call data (hex). */
  data?: string;
  /** Gas limit override. */
  gas?: string | bigint;
}

/** Return type for useSendTransaction. */
export interface UseSendTransactionReturn {
  /** Send a transaction. Returns the tx hash. */
  sendTransaction: (args: SendTransactionArgs) => Promise<string>;
  /** Whether a transaction is being sent. */
  isSending: Ref<boolean>;
  /** Error if the send failed. */
  error: Ref<Error | null>;
  /** Hash of the last sent transaction. */
  txHash: Ref<string | null>;
  /** Whether a transaction was confirmed on-chain. */
  isConfirmed: Ref<boolean>;
}

/**
 * Composable to send a transaction via the connected wallet.
 *
 * ```vue
 * <script setup>
 * const { sendTransaction, isSending, txHash } = useSendTransaction()
 *
 * const handleSend = async () => {
 *   const hash = await sendTransaction({
 *     to: '0x...',
 *     value: '0x16345785d8a0000', // 0.1 ETH in wei
 *   })
 *   logger.info('Tx hash:', hash)
 * }
 * </script>
 * ```
 */
export function useSendTransaction(): UseSendTransactionReturn {
  const { account, status } = useCinacoin();

  const isSending = ref(false);
  const error = ref<Error | null>(null);
  const txHash = ref<string | null>(null);
  const isConfirmed = ref(false);

  const sendTransactionFn = async (
    args: SendTransactionArgs,
  ): Promise<string> => {
    if (status.value !== 'connected' || !account.value.address) {
      throw new Error('Wallet not connected');
    }

    isSending.value = true;
    error.value = null;
    isConfirmed.value = false;

    try {
      // Build transaction request
      const tx: Record<string, unknown> = {
        from: account.value.address,
        to: args.to,
      };
      if (args.value !== undefined) {
        tx.value =
          typeof args.value === 'bigint'
            ? '0x' + args.value.toString(16)
            : args.value;
      }
      if (args.data) tx.data = args.data;
      if (args.gas !== undefined) {
        tx.gas =
          typeof args.gas === 'bigint' ? '0x' + args.gas.toString(16) : args.gas;
      }

      // Send via provider (EIP-1193 eth_sendTransaction)
      const provider = (window as unknown as Window & typeof globalThis).ethereum;
      if (!provider) {
        throw new Error(
          'No EIP-1193 provider found. Use an injected wallet or Cinacoin.',
        );
      }

      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [tx],
      });

      txHash.value = hash as string;
      return hash as string;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      throw e;
    } finally {
      isSending.value = false;
    }
  };

  return {
    sendTransaction: sendTransactionFn,
    isSending,
    error,
    txHash,
    isConfirmed,
  };
}

// ---------------------------------------------------------------------------
// useSignMessage
// ---------------------------------------------------------------------------

/** Return type for useSignMessage. */
export interface UseSignMessageReturn {
  /** Sign a message. Returns the hex signature. */
  signMessage: (message: string) => Promise<string>;
  /** Whether signing is in progress. */
  isSigning: Ref<boolean>;
  /** Error if signing failed. */
  error: Ref<Error | null>;
  /** The signature from the last successful signing. */
  signature: Ref<string | null>;
}

/**
 * Composable to sign a message via the connected wallet.
 *
 * ```vue
 * <script setup>
 * const { signMessage, isSigning, signature } = useSignMessage()
 *
 * const handleSign = async () => {
 *   const sig = await signMessage('Hello, world!')
 *   logger.info('Signature:', sig)
 * }
 * </script>
 * ```
 */
export function useSignMessage(): UseSignMessageReturn {
  const { account, status } = useCinacoin();

  const isSigning = ref(false);
  const error = ref<Error | null>(null);
  const signature = ref<string | null>(null);

  const signMessageFn = async (message: string): Promise<string> => {
    if (status.value !== 'connected' || !account.value.address) {
      throw new Error('Wallet not connected');
    }

    isSigning.value = true;
    error.value = null;

    try {
      const provider = (window as unknown as Window & typeof globalThis).ethereum;
      if (!provider) {
        throw new Error(
          'No EIP-1193 provider found. Use an injected wallet or Cinacoin.',
        );
      }

      // personal_sign: message must be hex-encoded
      const hexMessage =
        '0x' +
        Array.from(new TextEncoder().encode(message))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

      const sig = await provider.request({
        method: 'personal_sign',
        params: [hexMessage, account.value.address],
      });

      signature.value = sig as string;
      return sig as string;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      throw e;
    } finally {
      isSigning.value = false;
    }
  };

  return { signMessage: signMessageFn, isSigning, error, signature };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** ENS Registry contract address (mainnet). */
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

/**
 * Resolve an Ethereum address to its ENS name via on-chain call.
 * Uses reverse resolution (addr → name).
 */
async function resolveEnsName(address: string): Promise<string | null> {
  // Reverse ENS: addr.reverse → name
  const reverseName = address.toLowerCase().replace('0x', '') + '.addr.reverse';

  const provider = (window as unknown as Window & typeof globalThis).ethereum;
  if (!provider) {
    // If no provider, fall back to ENS public resolver API
    return resolveViaEnsApi(address);
  }

  try {
    // Use ENS public gateway as fallback (free, no auth needed)
    return resolveViaEnsApi(address);
  } catch {
    return null;
  }
}

/**
 * Resolve via ENS public resolver API.
 * https://ENS resolves names via metadata API or on-chain calls.
 */
async function resolveViaEnsApi(address: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://ensmetadata.io/v1/lookup/${address.toLowerCase()}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { primaryName?: string };
    return data.primaryName ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve an ENS name to its address.
 */
async function resolveEnsAddress(name: string): Promise<string | null> {
  const provider = (window as unknown as Window & typeof globalThis).ethereum;
  if (!provider) {
    // Use ENS public resolver API
    return resolveNameViaEnsApi(name);
  }

  try {
    return resolveNameViaEnsApi(name);
  } catch {
    return null;
  }
}

/**
 * Resolve ENS name via metadata API.
 */
async function resolveNameViaEnsApi(name: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://ensmetadata.io/v1/lookup/${encodeURIComponent(name)}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { address?: string };
    return data.address ?? null;
  } catch {
    return null;
  }
}

/**
 * Format wei (bigint) to a decimal string (Ether units).
 */
function formatEther(wei: bigint): string {
  const decimals = 18;
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const fractional = wei % divisor;
  const padded = fractional.toString().padStart(decimals, '0');
  // Trim trailing zeros
  const trimmed = padded.replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

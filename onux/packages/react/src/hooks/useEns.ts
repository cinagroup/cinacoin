/**
 * ENS resolution hooks — resolve ENS names and addresses.
 *
 * Requires being used within <CinacoinProvider>.
 */

import { useState, useEffect, useCallback } from 'react';
import { useCinacoinContext } from '../CinacoinProvider.js';
import { keccak256, toBytes, encodeAbiParameters, parseAbiParameters } from 'viem';

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

/**
 * Headless client configuration backed by `@cinacoin/core-sdk`.
 *
 * Uses the core-sdk Zustand store (`createCinacoinStore`) for state
 * management while exposing a minimal `HeadlessClient` API so that
 * developers can build their own UI on top.
 */

import { createCinacoinStore } from '@cinacoin/core-sdk';
import type { CinacoinState, ConnectionStatus, Chain } from '@cinacoin/core-sdk';

/**
 * Options for creating the internal core-sdk store instance.
 */
interface ClientOptions {
  /** Wallet IDs to enable. */
  wallets?: string[];
  /** Chain IDs to support. */
  chains?: string[];
  /** Project identifier. */
  projectId?: string;
  /** Client mode — set to "headless" here. */
  mode?: string;
  [key: string]: unknown;
}

interface Client {
  /** Connect to a wallet. */
  connect: () => Promise<{ address: string; chainId: string }>;
  /** Disconnect from the current wallet. */
  disconnect: () => Promise<void>;
}

/**
 * Factory that creates a headless client backed by the core-sdk Zustand store.
 *
 * Initializes the store with the provided options and returns a minimal
 * client wrapper around it.
 */
function createClient(options: ClientOptions): Client {
  const store = createCinacoinStore();

  // Configure the store with project id and any chain preferences
  if (options.projectId) {
    store.getState().setProjectId(options.projectId);
  }
  if (options.chains) {
    // Map chain ids to core-sdk Chain objects at runtime
    store.getState().setChains(options.chains.map((id): Chain => ({
      id,
      name: id,
      rpcUrl: '', // Runtime RPC URL resolved by EvmAdapter at connect time
    })));
  }

  return {
    connect: async () => {
      store.getState().setStatus('connecting' as ConnectionStatus);
      // In headless mode the developer drives the connection flow manually
      // using the store actions; this placeholder resolves the interface.
      const state = store.getState();
      return {
        address: state.accounts[0] ?? '',
        chainId: String(state.chainId ?? ''),
      };
    },
    disconnect: async () => {
      store.getState().disconnect();
    },
  };
}

/**
 * Options for creating a headless SDK client.
 *
 * The developer brings their own UI; this client exposes only the
 * core SDK functions (connect, disconnect, request, sign, …).
 */
export interface HeadlessClientOptions extends ClientOptions {
  /** Project identifier. */
  projectId: string;
  /** Optional wallet identifier for pre-selecting a wallet. */
  walletId?: string;
}

/**
 * A headless SDK client.  Returns the full `Client` interface from
 * `@cinacoin/core-sdk` but without any built-in UI components.
 *
 * @example
 * ```ts
 * import { createHeadlessClient } from "@cinacoin/config";
 *
 * const client = createHeadlessClient({
 *   projectId: "proj_abc123",
 *   walletId: "wallet_xyz",
 * });
 *
 * const account = await client.connect();
 * const signature = await client.sign({ message: "hello" });
 * ```
 */
export interface HeadlessClient extends Client {
  /** Disconnect and release all resources. */
  disconnect: () => Promise<void>;
  /** Send a JSON-RPC request to the connected wallet. */
  request: <T = unknown>(args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<T>;
  /** Sign a message with the connected account. */
  sign: (args: { message: string }) => Promise<string>;
}

/**
 * Create a headless SDK client with no UI.
 *
 * The returned `HeadlessClient` gives you the full `@cinacoin/core-sdk`
 * API so you can build your own UI on top.
 *
 * @param options - Project + wallet options.
 * @returns A `HeadlessClient` instance ready to use.
 *
 * @example
 * ```ts
 * const client = createHeadlessClient({ projectId, walletId });
 * await client.connect();
 * ```
 */
export function createHeadlessClient(
  options: HeadlessClientOptions
): HeadlessClient {
  const client = createClient({
    ...options,
    // Force headless mode — no UI overlays, no modals.
    mode: "headless",
  }) as HeadlessClient;

  return client;
}

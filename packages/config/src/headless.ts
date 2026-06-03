/**
 * Stub types for headless client configuration.
 *
 * NOTE: These mirror the planned `@cinacoin/core-sdk` `Client`/`ClientOptions`
 * interfaces.  Once `createClient` lands in core-sdk, swap the import here.
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
 * Placeholder factory for headless client creation.
 * Replace with actual `@cinacoin/core-sdk` implementation.
 */
function createClient(options: ClientOptions): Client {
  void options; // TODO: replace with real core-sdk createClient
  return {
    connect: async () => ({ address: '', chainId: '' }),
    disconnect: async () => {},
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

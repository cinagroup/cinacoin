/**
 * EIP-5792: Wallet Call API Support
 *
 * Implements the EIP-5792 standard for batched wallet calls:
 *   - wallet_sendCalls: Submit a batch of calls for execution
 *   - wallet_getCallsStatus: Check the status of submitted calls
 *   - wallet_showCallsStatus: Request wallet to show calls status (optional)
 *   - wallet_getCapabilities: Get wallet capabilities (optional)
 *
 * @see https://eips.ethereum.org/EIPS/eip-5792
 */

import type { Address, Hash, Hex } from 'viem';

// ============================================================
// Types
// ============================================================

/**
 * A single call in an EIP-5792 batch.
 */
export interface EIP5792Call {
  /** Target contract or EOA address. */
  to: Address;
  /** Native token value to send (in wei, hex-encoded). */
  value?: Hex;
  /** Calldata for the call. */
  data: Hex;
  /** Gas limit for this specific call (optional). */
  gas?: Hex;
}

/**
 * Parameters for wallet_sendCalls.
 */
export interface EIP5792SendCallsParams {
  /** Chain ID (hex-encoded). */
  chainId?: Hex;
  /** From address (the smart account). */
  from: Address;
  /** Array of calls to execute atomically. */
  calls: EIP5792Call[];
  /** Capabilities the wallet should support for this batch. */
  capabilities?: Record<string, unknown>;
  /** API version (default: "1.0"). */
  version?: string;
}

/**
 * Result from wallet_sendCalls.
 */
export interface EIP5792SendCallsResult {
  /** Unique identifier for the batch of calls. */
  callsId: string;
}

/**
 * Status of an individual call within a batch.
 */
export interface EIP5792CallReceipt {
  /** Status: '0x0' = reverted, '0x1' = success. */
  status: Hex;
  /** Transaction hash that included this call. */
  txHash: Hash;
  /** Index of the call within the batch. */
  callIndex: number;
}

/**
 * Response from wallet_getCallsStatus.
 */
export interface EIP5792CallsStatus {
  /** Current status of the calls batch. */
  state:
    | 'PENDING'
    | 'CONFIRMED'
    | 'INCLUDED'
    | 'FINALIZED';
  /** Transaction hashes associated with this batch. */
  receipts?: EIP5792CallReceipt[];
  /** Optional capabilities the wallet reported. */
  capabilities?: Record<string, unknown>;
}

/**
 * Parameters for wallet_getCallsStatus.
 */
export interface EIP5792GetCallsStatusParams {
  /** The calls ID returned from wallet_sendCalls. */
  callsId: string;
}

/**
 * Wallet capabilities response (EIP-5792 optional method).
 */
export interface EIP5792Capabilities {
  [chainId: string]: {
    atomicBatch?: { supported: boolean };
    paymaster?: { supported: boolean; url?: string };
    sessionKeys?: { supported: boolean };
  };
}

// ============================================================
// EIP-5792 Client
// ============================================================

/**
 * Configuration for the EIP-5792 client.
 */
export interface EIP5792Config {
  /** JSON-RPC endpoint URL. */
  rpcUrl: string;
  /** Optional API key for the bundler/wallet. */
  apiKey?: string;
  /** Chain ID (decimal). */
  chainId: number;
}

/**
 * EIP-5792 Client for wallet call API.
 *
 * Provides methods to interact with wallets/bundlers that support
 * the EIP-5792 standard for batched transaction execution.
 *
 * @example
 * ```ts
 * const client = createEIP5792Client({
 *   rpcUrl: 'https://bundler.example.com/rpc',
 *   chainId: 1,
 * });
 *
 * const { callsId } = await client.sendCalls({
 *   from: '0x...',
 *   calls: [
 *     { to: '0x...', data: '0x...', value: '0x0' },
 *     { to: '0x...', data: '0x...' },
 *   ],
 * });
 *
 * const status = await client.getCallsStatus(callsId);
 * console.log(status.state); // 'PENDING' | 'CONFIRMED' | ...
 * ```
 */
export class EIP5792Client {
  private readonly rpcUrl: string;
  private readonly apiKey?: string;
  private readonly chainId: number;

  constructor(config: EIP5792Config) {
    this.rpcUrl = config.rpcUrl;
    this.apiKey = config.apiKey;
    this.chainId = config.chainId;
  }

  /**
   * wallet_sendCalls — Submit a batch of calls for execution.
   *
   * Sends multiple calls to be executed atomically by the wallet/bundler.
   * Returns a callsId that can be used to poll for status.
   */
  async sendCalls(params: EIP5792SendCallsParams): Promise<EIP5792SendCallsResult> {
    const chainIdHex = params.chainId ?? `0x${this.chainId.toString(16)}`;

    const result = await this.rpcCall<string>('wallet_sendCalls', [
      {
        version: params.version ?? '1.0',
        from: params.from,
        chainId: chainIdHex,
        calls: params.calls.map(call => ({
          to: call.to,
          value: call.value ?? '0x0',
          data: call.data,
          ...(call.gas ? { gas: call.gas } : {}),
        })),
        ...(params.capabilities ? { capabilities: params.capabilities } : {}),
      },
    ]);

    return { callsId: result };
  }

  /**
   * wallet_getCallsStatus — Check the status of a submitted calls batch.
   *
   * Returns the current state (PENDING, CONFIRMED, INCLUDED, FINALIZED)
   * and any receipts for completed calls.
   */
  async getCallsStatus(
    params: EIP5792GetCallsStatusParams,
  ): Promise<EIP5792CallsStatus> {
    const result = await this.rpcCall<{
      state: EIP5792CallsStatus['state'];
      receipts?: EIP5792CallReceipt[];
      capabilities?: Record<string, unknown>;
    }>('wallet_getCallsStatus', [params.callsId]);

    return {
      state: result.state,
      receipts: result.receipts,
      capabilities: result.capabilities,
    };
  }

  /**
   * wallet_showCallsStatus — Request the wallet to display calls status.
   *
   * This is an optional method that prompts the wallet UI to show
   * the status of a calls batch to the user.
   */
  async showCallsStatus(callsId: string): Promise<void> {
    await this.rpcCall<null>('wallet_showCallsStatus', [callsId]);
  }

  /**
   * wallet_getCapabilities — Get the wallet's supported capabilities.
   *
   * Returns what features the wallet supports per chain (atomicBatch,
   * paymaster, sessionKeys, etc.).
   */
  async getCapabilities(): Promise<EIP5792Capabilities> {
    return this.rpcCall<EIP5792Capabilities>('wallet_getCapabilities', []);
  }

  /**
   * Poll for calls status until the batch reaches a terminal state.
   *
   * @param callsId - The calls ID from sendCalls
   * @param opts - Polling options
   * @returns The final status when the batch is confirmed/included/finalized
   */
  async waitForCallsStatus(
    callsId: string,
    opts?: {
      /** Polling interval in ms (default: 2000). */
      intervalMs?: number;
      /** Max polling attempts (default: 60). */
      maxAttempts?: number;
      /** Callback on each poll. */
      onPoll?: (attempt: number, status: EIP5792CallsStatus) => void;
    },
  ): Promise<EIP5792CallsStatus> {
    const interval = opts?.intervalMs ?? 2_000;
    const maxAttempts = opts?.maxAttempts ?? 60;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getCallsStatus({ callsId });
      opts?.onPoll?.(attempt, status);

      // Terminal states
      if (
        status.state === 'CONFIRMED' ||
        status.state === 'INCLUDED' ||
        status.state === 'FINALIZED'
      ) {
        return status;
      }

      // Exponential backoff: start at interval, double every 3 attempts, cap at 30s
      const backoffMs = Math.min(
        interval * Math.pow(2, Math.floor(attempt / 3)),
        30_000,
      );
      await this.sleep(backoffMs);
    }

    throw new Error(
      `waitForCallsStatus timed out after ${maxAttempts} attempts for callsId: ${callsId}`,
    );
  }

  // ── Internal ──────────────────────────────────────────────────

  private async rpcCall<T>(method: string, params: unknown[]): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `EIP-5792 RPC error: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as {
      result?: T;
      error?: { code: number; message: string; data?: unknown };
    };

    if (json.error) {
      throw new Error(
        `EIP-5792 RPC error (${json.error.code}): ${json.error.message}`,
      );
    }

    if (json.result === undefined) {
      throw new Error('EIP-5792 RPC error: missing result');
    }

    return json.result;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

/**
 * Create an EIP-5792 client instance.
 */
export function createEIP5792Client(config: EIP5792Config): EIP5792Client {
  return new EIP5792Client(config);
}

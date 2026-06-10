import type {
import { logger } from '@cinacoin/logger';
  BitcoinConnector,
  BitcoinPlatform,
  BitcoinFeature,
  BitcoinConnectionResult,
  BitcoinConnectorEvents,
} from '../types';

// Re-export sats-connect types so consumers don't need to install the package separately
export type {
  AddressPurpose,
  GetAddressResponse,
  SignTransactionResponse,
  SendBtcTransactionResponse,
} from '@sats-connect/core';

/**
 * Shape of an address entry returned by sats-connect.
 * The SDK's response typing is `Promise<void>` in v0.2.x,
 * so we narrow via `unknown` here.
 */
interface SatsConnectAddressEntry {
  purpose?: string;
  address?: string;
  publicKey?: string;
}

/**
 * SatsConnect connector.
 *
 * Uses the `@sats-connect/core` SDK to connect to multiple Bitcoin wallets
 * through a unified interface. SatsConnect acts as an abstraction layer over
 * wallets like Xverse, Oyl, Leather, and others that implement the sats-connect protocol.
 *
 * @see https://github.com/secretkeylabs/sats-connect
 *
 * @example
 * ```ts
 * import { SatsConnectConnector } from '@cinacoin/adapter-bitcoin';
 *
 * const connector = new SatsConnectConnector();
 * if (connector.isAvailable()) {
 *   const result = await connector.connect();
 *   logger.info(result.accounts);
 * }
 * ```
 */
export class SatsConnectConnector implements BitcoinConnector {
  readonly id = 'sats-connect';
  readonly name = 'SatsConnect';
  readonly icon =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23FF9500"/><text x="16" y="22" text-anchor="middle" font-size="12" fill="white" font-family="sans-serif" font-weight="bold">S</text></svg>';
  readonly platforms: BitcoinPlatform[] = ['browser', 'mobile', 'extension'];
  readonly supportedFeatures: BitcoinFeature[] = [
    'bitcoin:connect',
    'bitcoin:signMessage',
    'bitcoin:signTransaction',
    'bitcoin:sendTransfer',
  ];

  private _handlers: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private _connectedAccounts: string[] = [];
  private _network: string = 'mainnet';

  // ─── Availability ────────────────────────────────────────────────

  isAvailable(): boolean {
    // SatsConnect uses postMessage-based communication,
    // so it's always "available" in a browser context.
    return typeof window !== 'undefined';
  }

  // ─── Lifecycle ───────────────────────────────────────────────────

  async connect(params?: { accounts?: string[] }): Promise<BitcoinConnectionResult> {
    const { getAddress, AddressPurpose, BitcoinNetworkType } = await import('@sats-connect/core');

    // Request Bitcoin address(es) from the sats-connect protocol.
    // SDK v0.2.x uses callback-based API with payload network requirement.
    const result = await new Promise<{ address?: string; addresses?: SatsConnectAddressEntry[] }>((resolve, reject) => {
      getAddress({
        payload: { purposes: [AddressPurpose.Payment], network: { type: BitcoinNetworkType.Mainnet }, message: 'Connect to application' },
        onFinish: (response) => resolve(response as unknown as { address?: string; addresses?: SatsConnectAddressEntry[] }),
        onCancel: () => reject(new Error('User cancelled wallet connection')),
      });
    });

    if (!result.address && (!result.addresses || result.addresses.length === 0)) {
      throw new Error('No addresses returned from SatsConnect wallet');
    }

    const addresses = (result.addresses ?? [])
      .filter((a: SatsConnectAddressEntry) => a.purpose === 'payment')
      .map((a: SatsConnectAddressEntry) => a.address)
      .filter((a): a is string => typeof a === 'string');

    this._connectedAccounts = addresses.length > 0 ? addresses : [result.address!];
    this._network = result.addresses?.[0]?.publicKey ? 'mainnet' : 'mainnet';

    this._bindGlobalEvents();

    return {
      accounts: this._connectedAccounts,
      network: this._network,
    };
  }

  async disconnect(): Promise<void> {
    this._connectedAccounts = [];
    const handlers = this._handlers.get('disconnect') ?? new Set();
    for (const handler of handlers) {
      handler();
    }
  }

  // ─── RPC ─────────────────────────────────────────────────────────

  async request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T> {
    // SatsConnect uses a postMessage-based RPC system.
    // makeRPC was removed in @sats-connect/core v0.2.x.
    // Production use should implement a proper wallet picker.
    throw new Error(
      `SatsConnect direct RPC not yet implemented for method: ${args.method}. ` +
        `Use the typed methods (signMessage, signTransaction, sendTransfer) instead.`
    );
  }

  async getAccounts(): Promise<string[]> {
    if (this._connectedAccounts.length === 0) {
      throw new Error('Not connected. Call connect() first.');
    }
    return this._connectedAccounts;
  }

  async getNetwork(): Promise<string> {
    return this._network;
  }

  async switchNetwork(network: string): Promise<void> {
    // SatsConnect wallet selection happens at connect time;
    // network is determined by the selected wallet.
    throw new Error(
      `SatsConnect does not support programmatic network switching. ` +
        `Reconnect with a wallet configured for "${network}".`
    );
  }

  // ─── Bitcoin-native methods ─────────────────────────────────────

  async signMessage(params: {
    message: string;
    address: string;
  }): Promise<{ signature: string }> {
    const { signMessage, BitcoinNetworkType } = await import('@sats-connect/core');

    // SDK v0.2.x types signMessage as returning void, but the actual
    // response resolves with a signature string. Narrow via unknown.
    const result = await new Promise<string>((resolve, reject) => {
      signMessage({
        payload: { address: params.address, message: params.message, network: { type: BitcoinNetworkType.Mainnet } },
        onFinish: (response) => resolve(response as unknown as string),
        onCancel: () => reject(new Error('User cancelled signing')),
      });
    });

    if (!result) {
      throw new Error('SatsConnect signMessage returned no signature');
    }

    return { signature: result };
  }

  async signPsbt(params: {
    psbt: string;
    signInputs?: Record<number, number[]>;
  }): Promise<{ psbt: string }> {
    const { signTransaction, BitcoinNetworkType } = await import('@sats-connect/core');

    // signPsbt maps to signTransaction in sats-connect.
    // SDK v0.2.x returns void; narrow via unknown.
    const result = await new Promise<{ psbtBase64?: string }>((resolve, reject) => {
      signTransaction({
        payload: { psbtBase64: params.psbt, inputsToSign: [], broadcast: false, message: 'Sign transaction', network: { type: BitcoinNetworkType.Mainnet } },
        onFinish: (response) => resolve(response as unknown as { psbtBase64?: string }),
        onCancel: () => reject(new Error('User cancelled transaction signing')),
      });
    });

    if (!result?.psbtBase64) {
      throw new Error('SatsConnect signTransaction returned no PSBT');
    }

    return { psbt: result.psbtBase64 };
  }

  async sendTransfer(params: {
    recipient: string;
    amount: number;
    feeRate?: number;
  }): Promise<{ txid: string }> {
    const { sendBtcTransaction, BitcoinNetworkType } = await import('@sats-connect/core');

    // sendBtcTransaction replaces sendTransfer in sats-connect v0.2.x.
    // SDK returns void; narrow via unknown.
    const result = await new Promise<string>((resolve, reject) => {
      sendBtcTransaction({
        payload: {
          recipients: [{ address: params.recipient, amountSats: BigInt(params.amount) }],
          senderAddress: this._connectedAccounts[0] ?? '',
          network: { type: BitcoinNetworkType.Mainnet },
        },
        onFinish: (response) => resolve(response as unknown as string),
        onCancel: () => reject(new Error('User cancelled transaction')),
      });
    });

    if (!result) {
      throw new Error('SatsConnect sendTransfer returned no txid');
    }

    return { txid: result };
  }

  // ─── Events ──────────────────────────────────────────────────────

  on<E extends keyof BitcoinConnectorEvents>(
    event: E,
    handler: BitcoinConnectorEvents[E]
  ): void;
  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event)!.add(handler);
  }

  off<E extends keyof BitcoinConnectorEvents>(
    event: E,
    handler: BitcoinConnectorEvents[E]
  ): void;
  off(event: string, handler: (...args: unknown[]) => void): void {
    this._handlers.get(event)?.delete(handler);
  }

  // ─── Internal ────────────────────────────────────────────────────

  /**
   * Bind to sats-connect global events.
   *
   * SatsConnect uses postMessage, so we listen on window for relevant events.
   */
  private _bindGlobalEvents(): void {
    if (typeof window === 'undefined') return;

    // Listen for wallet disconnect events from sats-connect
    window.addEventListener('message', (event: MessageEvent) => {
      // SatsConnect events are namespaced; filter relevant ones
      if (typeof event.data === 'object' && event.data !== null) {
        const { type } = event.data;
        if (type === 'bitcoin_disconnected' || type === 'wallet_disconnected') {
          const handlers = this._handlers.get('disconnect') ?? new Set();
          for (const handler of handlers) {
            handler(new Error('Wallet disconnected'));
          }
        }
      }
    });
  }
}

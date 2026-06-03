/**
 * Starknet Chain Adapter — provides Starknet-specific wallet connection and transaction operations.
 *
 * Supports Argent X and Braavos wallets with native Starknet account abstraction.
 * Implements the ChainAdapter interface from @cinacoin/core-sdk.
 */

import type { ChainAdapter } from '@cinacoin/core-sdk';
import type { Connector } from '@cinacoin/core-sdk';
import type { Chain } from '@cinacoin/core-sdk';
import type { StarknetWalletConnector } from './types.js';
import { STARKNET_CHAINS, STARKNET_WALLETS, type StarknetCall } from './types.js';
import { ArgentXConnector } from './connectors/argent-x.js';
import { BraavosConnector } from './connectors/braavos.js';
import {
  buildDeployAccountTx,
  computeAccountAddress,
  buildExecuteTx,
  buildEstimateFeeRpc,
  buildGetNonceRpc,
  buildGetClassHashRpc,
  buildGetStorageAtRpc,
  buildErc20TransferOnStarknet,
  buildErc20ApproveOnStarknet,
  verifyStarknetSignature,
  broadcastTransaction,
  deployAccount,
  estimateFee,
  estimateFeeAndExecute,
  executeDeployAccount,
  buildDeployAccountRpc,
  getNonce,
  type DeployAccountParams,
  type ExecuteOptions,
  type FeeEstimate,
  type BroadcastResult,
} from './services/starknet-ops.js';

/* ------------------------------------------------------------------ */
/*  Minimal Starknet RPC types                                         */
/* ------------------------------------------------------------------ */

interface StarknetRpcBalance {
  result: { value: string } | string;
  error?: { message: string };
}

/* ------------------------------------------------------------------ */
/*  StarknetChainAdapter                                                */
/* ------------------------------------------------------------------ */

/**
 * Starknet chain adapter implementing ChainAdapter from @cinacoin/core-sdk.
 *
 * Provides a unified interface for Starknet wallet operations:
 * - Wallet connection (Argent X, Braavos)
 * - Transaction signing and execution
 * - Balance queries
 * - Native account abstraction support
 */
export class StarknetChainAdapter implements ChainAdapter {
  readonly id = 'starknet';
  readonly name = 'Starknet Adapter';

  private chains: Chain[] = [...STARKNET_CHAINS];
  private activeConnector: StarknetWalletConnector | null = null;
  private connectorInstance: Connector | null = null;
  private rpcUrl: string = STARKNET_CHAINS[0].rpcUrl;

  // Wallet connector instances (lazy-created)
  private _argentX: ArgentXConnector | null = null;
  private _braavos: BraavosConnector | null = null;

  /* ---- Configuration ---- */

  /** Register supported Starknet chains. */
  registerChains(chains: Chain[]): void {
    this.chains = chains;
  }

  /** Set the connector from the core SDK. */
  setConnector(connector: Connector): void {
    this.connectorInstance = connector;
  }

  /** Set a custom RPC URL. */
  setRpcUrl(url: string): void {
    this.rpcUrl = url;
  }

  /** Set a client for advanced use cases. */
  setClient(_client: unknown): void {
    // Starknet client configuration is handled via RPC URL
  }

  /** Get the active wallet connector. */
  getActiveConnector(): StarknetWalletConnector | null {
    return this.activeConnector;
  }

  /** Get the currently connected account address. */
  getAddress(): string | null {
    return this.activeConnector?.getAccount() ?? null;
  }

  /* ---- Connection ---- */

  /**
   * Connect to a Starknet wallet.
   * @param walletId - Wallet id ('argent-x' or 'braavos'). Auto-detects if omitted.
   * @returns The connected Starknet account address.
   */
  async connect(walletId?: string): Promise<string> {
    const connector = this._resolveConnector(walletId);
    if (!connector) {
      throw new Error(
        'No Starknet wallet found. Install Argent X (https://www.argent.xyz/argent-x/) or Braavos (https://braavos.app/)',
      );
    }

    const address = await connector.connect();
    this.activeConnector = connector;
    return address;
  }

  /** Disconnect from the current wallet. */
  async disconnect(): Promise<void> {
    if (this.activeConnector) {
      await this.activeConnector.disconnect();
      this.activeConnector = null;
    }
  }

  /* ---- ChainAdapter Interface ---- */

  /** Get connected account addresses. */
  async getAccounts(): Promise<string[]> {
    const account = this.activeConnector?.getAccount();
    return account ? [account] : [];
  }

  /**
   * Get native balance for a Starknet address.
   * @param address - Starknet address (hex with 0x prefix).
   * @returns Balance in ETH (as a decimal string, e.g. "1.234").
   */
  async getBalance(address: string): Promise<string> {
    if (!this._isValidAddress(address)) {
      throw new Error(`Invalid Starknet address: ${address}`);
    }

    // Use JSON-RPC to get ETH balance
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'starknet_getBalance',
        params: [address],
      }),
    });

    if (!response.ok) {
      throw new Error(`Starknet RPC error ${response.status}: ${response.statusText}`);
    }
    const data = (await response.json()) as StarknetRpcBalance;
    if (data.error) throw new Error(data.error.message);

    const value = typeof data.result === 'string' ? data.result : (data.result?.value ?? '0');
    // Convert from wei (18 decimals) to ETH
    const wei = BigInt(value);
    const eth = Number(wei) / 1e18;
    return eth.toString();
  }

  /**
   * Sign a Starknet transaction.
   * @param tx - Transaction as calls array or single call.
   * @returns Signed transaction data (not broadcast).
   */
  async signTransaction(tx: unknown): Promise<string> {
    if (!this.activeConnector) {
      throw new Error('No wallet connected. Call connect() first.');
    }

    const calls = this._toCalls(tx);
    const result = await this.activeConnector.signTransaction(calls);
    return JSON.stringify(result);
  }

  /**
   * Send a transaction (sign + execute).
   * Delegates to the connected wallet's account abstraction layer.
   * @param tx - Transaction as calls array or single call.
   * @returns Transaction hash.
   */
  async sendTransaction(tx: unknown): Promise<string> {
    if (!this.activeConnector) {
      throw new Error('No wallet connected. Call connect() first.');
    }

    const calls = this._toCalls(tx);
    const details = typeof tx === 'object' && tx !== null && 'details' in tx
      ? (tx as { details?: Record<string, unknown> }).details
      : undefined;

    const result = await this.activeConnector.executeTransaction(calls, details);
    return result.transactionHash;
  }

  /**
   * Sign a message with the connected wallet.
   * @param message - Message to sign (string or Starknet TypedData).
   * @returns Signature as JSON string.
   */
  async signMessage(message: string): Promise<string> {
    if (!this.activeConnector) {
      throw new Error('No wallet connected. Call connect() first.');
    }

    return this.activeConnector.signMessage(message);
  }

  /**
   * Starknet does not have traditional chain switching — it has networks.
   * This method switches the RPC URL to match the target chain.
   * @param _chainId - Chain ID (mapped to chain).
   */
  async switchChain(_chainId: number): Promise<void> {
    // Starknet uses network switching rather than chain ID switching
    // The wallet handles network selection internally
  }

  /**
   * Execute a Starknet transaction (alias for sendTransaction).
   * @param calls - Transaction calls.
   * @param details - Optional transaction details.
   * @returns Transaction hash.
   */
  async executeTransaction(
    calls: StarknetCall | StarknetCall[],
    details?: Record<string, unknown>,
  ): Promise<string> {
    if (!this.activeConnector) {
      throw new Error('No wallet connected. Call connect() first.');
    }

    const normalizedCalls = Array.isArray(calls) ? calls : [calls];
    const result = await this.activeConnector.executeTransaction(normalizedCalls, details);
    return result.transactionHash;
  }

  /* ---- Advanced RPC Operations ---- */

  /**
   * Broadcast a pre-signed Starknet invoke transaction directly via RPC.
   * Useful for hardware wallets or external signers.
   *
   * @param invokeTx - Signed invoke transaction.
   * @returns Transaction hash.
   */
  async broadcastTransaction(invokeTx: {
    sender_address: string;
    calldata: string[];
    nonce: string;
    max_fee?: string;
    version: string;
    signature: string[];
  }): Promise<BroadcastResult> {
    return broadcastTransaction(this.rpcUrl, invokeTx);
  }

  /**
   * Deploy a new Starknet account contract via RPC.
   * Estimates fee automatically if maxFee is not provided.
   *
   * @param params - Account deployment parameters (classHash, salt, constructorCalldata, signature).
   * @returns Transaction hash and deployed account address.
   */
  async deployAccount(params: DeployAccountParams): Promise<{
    transactionHash: string;
    accountAddress: string;
  }> {
    return executeDeployAccount(this.rpcUrl, params);
  }

  /**
   * Estimate fee for a set of contract calls.
   *
   * @param senderAddress - Account address.
   * @param calls - Contract calls to estimate.
   * @param nonce - Current nonce.
   * @returns Fee estimate (gasConsumed, gasPrice, overallFee, unit).
   */
  async estimateFee(
    senderAddress: string,
    calls: StarknetCall | StarknetCall[],
    nonce: string,
  ): Promise<FeeEstimate> {
    return estimateFee(this.rpcUrl, senderAddress, calls, nonce);
  }

  /**
   * Get the current nonce for an account.
   *
   * @param address - Account address.
   * @returns Nonce as hex string.
   */
  async getNonce(address: string): Promise<string> {
    return getNonce(this.rpcUrl, address);
  }

  /**
   * Sign with the wallet and execute via direct RPC with auto fee estimation.
   *
   * This method:
   * 1. Fetches the current nonce
   * 2. Estimates the transaction fee (+50% buffer)
   * 3. Builds the signed invoke transaction
   * 4. Broadcasts it via starknet_addInvokeTransaction
   *
   * @param calls - Contract calls.
   * @param options - Optional overrides (maxFee, nonce, version).
   * @returns Transaction hash.
   */
  async signAndExecute(
    calls: StarknetCall | StarknetCall[],
    options?: ExecuteOptions,
  ): Promise<BroadcastResult> {
    if (!this.activeConnector) {
      throw new Error('No wallet connected. Call connect() first.');
    }

    const senderAddress = this.activeConnector.getAccount();
    if (!senderAddress) {
      throw new Error('No account available from connected wallet.');
    }

    const normalizedCalls = Array.isArray(calls) ? calls : [calls];

    // Get nonce and estimate fee if not overridden
    const nonce = options?.nonce ?? (await getNonce(this.rpcUrl, senderAddress));
    let maxFee = options?.maxFee;
    if (!maxFee) {
      const fee = await estimateFee(this.rpcUrl, senderAddress, normalizedCalls, nonce);
      const estimated = BigInt(fee.overallFee);
      maxFee = '0x' + (estimated + (estimated / 2n)).toString(16);
    }

    // Sign the transaction via the wallet
    const signedResult = await this.activeConnector.signTransaction(normalizedCalls);

    // Extract signature from the wallet response
    const signature: string[] = this._extractSignature(signedResult);

    return estimateFeeAndExecute(this.rpcUrl, senderAddress, normalizedCalls, signature, {
      ...options,
      maxFee,
      nonce,
    });
  }

  /**
   * Verify a Starknet ECDSA signature against a message and public key.
   *
   * @param message - Message hash (felt252).
   * @param signature - Signature (r, s).
   * @param publicKey - Public key x coordinate.
   * @returns True if the signature is valid.
   */
  static verifySignature(
    message: string,
    signature: { r: string; s: string },
    publicKey: string,
  ): boolean {
    return verifyStarknetSignature(message, signature, publicKey);
  }

  /* ---- Private helpers ---- */

  /** Extract signature array from wallet response. */
  private _extractSignature(signedResult: unknown): string[] {
    if (Array.isArray(signedResult)) {
      return signedResult.map(s => typeof s === 'string' ? s : String(s));
    }
    if (typeof signedResult === 'object' && signedResult !== null) {
      const obj = signedResult as Record<string, unknown>;
      if (Array.isArray(obj.signature)) {
        return obj.signature.map(s => String(s));
      }
      if (typeof obj.signature === 'string') {
        // If signature is a single hex string, split into r and s
        return [obj.signature];
      }
      if (typeof obj.r === 'string' && typeof obj.s === 'string') {
        return [obj.r, obj.s];
      }
    }
    throw new Error('Unable to extract signature from wallet response');
  }

  /** Find a Starknet chain by its ID. */
  findChain(chainId: number): Chain | undefined {
    return this.chains.find((c) => c.id === `starknet:${chainId}`);
  }

  /** Get supported Starknet wallets. */
  getSupportedWallets() {
    return STARKNET_WALLETS.map((w) => ({
      ...w,
      available: this._getConnector(w.id)?.isInstalled() ?? false,
    }));
  }

  /** Validate a Starknet address. */
  static isValidAddress(address: string): boolean {
    if (!address.startsWith('0x')) return false;
    const hex = address.slice(2);
    if (hex.length === 0 || hex.length > 66) return false;
    return /^[0-9a-fA-F]+$/.test(hex);
  }

  private _resolveConnector(walletId?: string): StarknetWalletConnector | null {
    if (walletId) {
      return this._getConnector(walletId);
    }

    // Auto-detect: Argent X → Braavos
    const argentX = this._getConnector('argent-x');
    if (argentX?.isInstalled()) return argentX;

    const braavos = this._getConnector('braavos');
    if (braavos?.isInstalled()) return braavos;

    return null;
  }

  private _getConnector(walletId: string): StarknetWalletConnector | null {
    switch (walletId) {
      case 'argent-x':
        if (!this._argentX) this._argentX = new ArgentXConnector();
        return this._argentX.isInstalled() ? this._argentX : null;
      case 'braavos':
        if (!this._braavos) this._braavos = new BraavosConnector();
        return this._braavos.isInstalled() ? this._braavos : null;
      default:
        return null;
    }
  }

  private _toCalls(tx: unknown): StarknetCall[] {
    if (Array.isArray(tx)) return tx as StarknetCall[];
    if (typeof tx === 'object' && tx !== null && 'calls' in tx) {
      const calls = (tx as { calls: StarknetCall | StarknetCall[] }).calls;
      return Array.isArray(calls) ? calls : [calls];
    }
    return [tx as StarknetCall];
  }

  private _isValidAddress(address: string): boolean {
    return StarknetChainAdapter.isValidAddress(address);
  }
}

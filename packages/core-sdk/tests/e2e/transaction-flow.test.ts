/**
 * E2E Test — Transaction Sending Flow
 *
 * Mocks full transaction lifecycle:
 *   build → estimate gas → send → track status → failure handling
 *
 * ~200 lines covering transaction management end-to-end.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Connector } from '../../src/connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../../src/types.js';

// ── Transaction Status Types ──────────────────────────────────────

type TxStatus = 'pending' | 'confirmed' | 'failed' | 'replaced';

interface TxReceipt {
  txHash: string;
  status: TxStatus;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  from: string;
  to: string;
  value: string;
}

// ── Mock Transaction Tracker ──────────────────────────────────────

class MockTxTracker {
  private transactions = new Map<string, TxReceipt>();

  track(hash: string, receipt: TxReceipt): void {
    this.transactions.set(hash, receipt);
  }

  get(hash: string): TxReceipt | undefined {
    return this.transactions.get(hash);
  }

  getAll(): TxReceipt[] {
    return Array.from(this.transactions.values());
  }

  updateStatus(hash: string, status: TxStatus, blockNumber?: number): boolean {
    const tx = this.transactions.get(hash);
    if (!tx) return false;
    tx.status = status;
    if (blockNumber !== undefined) tx.blockNumber = blockNumber;
    return true;
  }
}

// ── Mock Gas Estimator ────────────────────────────────────────────

class MockGasEstimator {
  estimateGas(tx: Partial<TransactionRequest>): string {
    const base = 21000;
    const dataCost = tx.data ? Math.floor(tx.data.length / 2) * 4 : 0;
    return (base + dataCost).toString();
  }

  getMaxFeePerGas(): string {
    return '30000000000'; // 30 gwei
  }

  getMaxPriorityFeePerGas(): string {
    return '1500000000'; // 1.5 gwei
  }
}

// ── Mock Transaction Connector ────────────────────────────────────

class MockTxConnector extends Connector {
  readonly id = 'tx-flow-e2e';
  readonly name = 'Transaction Flow Test';
  readonly icon = 'data:image/svg+xml;base64,mock';
  readonly installed = true;
  readonly type = 'injected';

  private _connected = false;
  private _chainId = 1;
  private _account = '0x1234567890abcdef1234567890abcdef12345678';
  private _txTracker = new MockTxTracker();
  private _gasEstimator = new MockGasEstimator();
  private _shouldFail = false;

  setShouldFail(should: boolean): void {
    this._shouldFail = should;
  }

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    if (this._connected) throw new Error('Already connected');
    this._connected = true;
    this._chainId = params?.chains?.[0] ?? 1;
    return {
      sessionId: 'session_tx_test',
      accounts: [this._account],
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this.emit('disconnect');
  }

  async getAccounts(): Promise<string[]> {
    return this._connected ? [this._account] : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  // Build transaction with gas estimation
  buildTransaction(tx: Partial<TransactionRequest>): TransactionRequest {
    if (!this._connected) throw new Error('Not connected');
    return {
      from: this._account,
      to: tx.to ?? '0x0000000000000000000000000000000000000000',
      value: tx.value ?? '0x0',
      data: tx.data ?? '0x',
      gas: tx.gas ?? '0x' + BigInt(this._gasEstimator.estimateGas(tx)).toString(16),
      maxFeePerGas: tx.maxFeePerGas ?? '0x' + BigInt(this._gasEstimator.getMaxFeePerGas()).toString(16),
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? '0x' + BigInt(this._gasEstimator.getMaxPriorityFeePerGas()).toString(16),
      chainId: tx.chainId ?? this._chainId,
    };
  }

  // Estimate gas
  async estimateGas(tx: Partial<TransactionRequest>): Promise<string> {
    if (!this._connected) throw new Error('Not connected');
    return this._gasEstimator.estimateGas(tx);
  }

  // Send transaction
  async sendTransaction(tx: TransactionRequest): Promise<string> {
    if (!this._connected) throw new Error('Not connected');
    const randomHex = Math.random().toString(16).slice(2).padStart(64, '0').slice(0, 64);
    const txHash = '0x' + randomHex;
    const receipt: TxReceipt = {
      txHash,
      status: 'pending',
      from: tx.from,
      to: tx.to,
      value: tx.value ?? '0x0',
    };
    this._txTracker.track(txHash, receipt);
    this.emit('transaction_sent', { txHash, tx });
    return txHash;
  }

  // Track transaction status
  async getTransactionReceipt(txHash: string): Promise<TxReceipt | undefined> {
    return this._txTracker.get(txHash);
  }

  // Simulate mining/confirmation
  async simulateConfirmation(txHash: string, blockNumber: number): Promise<TxReceipt | null> {
    if (this._shouldFail) {
      this._txTracker.updateStatus(txHash, 'failed');
    } else {
      this._txTracker.updateStatus(txHash, 'confirmed', blockNumber);
    }
    const updated = this._txTracker.get(txHash);
    if (updated) {
      this.emit('transaction_confirmed', updated);
    }
    return updated ?? null;
  }

  get isConnected() { return this._connected; }
  get transactionCount() { return this._txTracker.getAll().length; }
  get allTransactions() { return this._txTracker.getAll(); }
}

// ── Tests ─────────────────────────────────────────────────────────

describe('E2E — Transaction Sending Flow', () => {
  let connector: MockTxConnector;

  beforeEach(() => {
    connector = new MockTxConnector();
  });

  afterEach(() => {
    connector.removeAllListeners();
  });

  // ── Build Transaction ─────────────────────────────────────────

  it('should build a valid transaction', async () => {
    await connector.connect();
    const tx = connector.buildTransaction({
      to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      value: '0xde0b6b3a7640000', // 1 ETH
    });
    expect(tx.from).toBe('0x1234567890abcdef1234567890abcdef12345678');
    expect(tx.to).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
    expect(tx.value).toBe('0xde0b6b3a7640000');
    expect(tx.gas).toBeTruthy();
  });

  it('should include gas estimation in built transaction', async () => {
    await connector.connect();
    const tx = connector.buildTransaction({
      to: '0xabc',
      data: '0xa9059cbb', // transfer(address,uint256)
    });
    expect(tx.gas).toBeTruthy();
    expect(parseInt(tx.gas!, 16)).toBeGreaterThan(21000); // data adds gas
  });

  it('should reject building tx when not connected', () => {
    expect(() => connector.buildTransaction({ to: '0xabc' })).toThrow('Not connected');
  });

  // ── Estimate Gas ──────────────────────────────────────────────

  it('should estimate gas for simple transfer', async () => {
    await connector.connect();
    const gas = await connector.estimateGas({ to: '0xabc', value: '0x0' });
    expect(gas).toBe('21000');
  });

  it('should estimate more gas for contract interaction', async () => {
    await connector.connect();
    const gas = await connector.estimateGas({
      to: '0xabc',
      data: '0xa9059cbb' + '0'.repeat(64), // ERC20 transfer
    });
    expect(parseInt(gas)).toBeGreaterThan(21000);
  });

  it('should reject gas estimation when not connected', async () => {
    await expect(connector.estimateGas({ to: '0xabc' })).rejects.toThrow('Not connected');
  });

  // ── Send Transaction ──────────────────────────────────────────

  it('should send transaction and return hash', async () => {
    await connector.connect();
    const tx = connector.buildTransaction({
      to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      value: '0x0',
    });
    const hash = await connector.sendTransaction(tx);
    expect(hash).toMatch(/^0x[a-f0-9]+$/);
    expect(hash.length).toBe(66); // 0x + 64 hex chars
  });

  it('should emit transaction_sent event', async () => {
    await connector.connect();
    const handler = vi.fn();
    connector.on('transaction_sent', handler);

    const tx = connector.buildTransaction({ to: '0xabc' });
    await connector.sendTransaction(tx);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].txHash).toBeTruthy();
  });

  it('should reject sending when not connected', async () => {
    const tx: TransactionRequest = {
      from: '0x1',
      to: '0x2',
      value: '0x0',
    };
    await expect(connector.sendTransaction(tx)).rejects.toThrow('Not connected');
  });

  // ── Track Transaction Status ──────────────────────────────────

  it('should track pending transaction', async () => {
    await connector.connect();
    const tx = connector.buildTransaction({ to: '0xabc' });
    const hash = await connector.sendTransaction(tx);
    const receipt = await connector.getTransactionReceipt(hash);
    expect(receipt).toBeTruthy();
    expect(receipt!.status).toBe('pending');
  });

  it('should confirm transaction successfully', async () => {
    await connector.connect();
    const tx = connector.buildTransaction({ to: '0xabc' });
    const hash = await connector.sendTransaction(tx);

    const receipt = await connector.simulateConfirmation(hash, 12345);
    expect(receipt).toBeTruthy();
    expect(receipt!.status).toBe('confirmed');
    expect(receipt!.blockNumber).toBe(12345);
  });

  it('should handle failed transaction', async () => {
    connector.setShouldFail(true);
    await connector.connect();
    const tx = connector.buildTransaction({ to: '0xabc' });
    const hash = await connector.sendTransaction(tx);

    const receipt = await connector.simulateConfirmation(hash, 12346);
    expect(receipt).toBeTruthy();
    expect(receipt!.status).toBe('failed');
  });

  it('should emit transaction_confirmed event', async () => {
    await connector.connect();
    const handler = vi.fn();
    connector.on('transaction_confirmed', handler);

    const tx = connector.buildTransaction({ to: '0xabc' });
    const hash = await connector.sendTransaction(tx);
    await connector.simulateConfirmation(hash, 100);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].status).toBe('confirmed');
  });

  // ── Full Transaction Flow ─────────────────────────────────────

  it('should complete full build → estimate → send → confirm flow', async () => {
    await connector.connect();

    // Step 1: Build
    const tx = connector.buildTransaction({
      to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      value: '0xde0b6b3a7640000',
    });

    // Step 2: Estimate (already done in build, but verify)
    const gas = await connector.estimateGas({ to: tx.to, value: tx.value });
    expect(parseInt(gas)).toBeGreaterThanOrEqual(21000);

    // Step 3: Send
    const hash = await connector.sendTransaction(tx);
    expect(hash).toBeTruthy();

    // Step 4: Check pending
    const pending = await connector.getTransactionReceipt(hash);
    expect(pending!.status).toBe('pending');

    // Step 5: Confirm
    const confirmed = await connector.simulateConfirmation(hash, 5000);
    expect(confirmed!.status).toBe('confirmed');
  });

  it('should handle multiple sequential transactions', async () => {
    await connector.connect();
    const hashes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const tx = connector.buildTransaction({
        to: '0xabc',
        value: '0x' + (i * 1e15).toString(16),
      });
      const hash = await connector.sendTransaction(tx);
      hashes.push(hash);
    }

    // All pending
    expect(connector.transactionCount).toBe(5);
    for (const hash of hashes) {
      const receipt = await connector.getTransactionReceipt(hash);
      expect(receipt!.status).toBe('pending');
    }

    // Confirm all
    for (let i = 0; i < hashes.length; i++) {
      await connector.simulateConfirmation(hashes[i], 1000 + i);
    }
    expect(connector.allTransactions.every(t => t.status === 'confirmed')).toBe(true);
  });

  it('should track transaction count correctly', async () => {
    await connector.connect();
    expect(connector.transactionCount).toBe(0);

    const tx = connector.buildTransaction({ to: '0xabc' });
    await connector.sendTransaction(tx);
    expect(connector.transactionCount).toBe(1);

    await connector.sendTransaction(tx);
    expect(connector.transactionCount).toBe(2);
  });
});

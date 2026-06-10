/**
 * Paymaster Balance Management
 *
 * Monitors and manages Paymaster contract ETH/token balances.
 * Handles funding thresholds, alerts, and automated top-ups.
 *
 * @packageDocumentation
 */

import { logger } from '@cinacoin/logger';
import type { Address, Hex } from 'viem';

/** Paymaster balance information. */
export interface PaymasterBalance {
  /** Paymaster address. */
  address: Address;
  /** ETH balance in wei. */
  ethBalance: bigint;
  /** Native currency symbol (usually ETH). */
  symbol: string;
  /** Number of UserOps this paymaster can sponsor at current gas price. */
  estimatedOpsRemaining: number;
  /** Whether balance is above the minimum threshold. */
  isHealthy: boolean;
  /** Timestamp of last check. */
  checkedAt: number;
}

/** Alert notification callback. */
export type BalanceAlertFn = (params: {
  paymaster: Address;
  balance: bigint;
  threshold: bigint;
  message: string;
}) => void;

/** Auto top-up configuration. */
export interface AutoTopUpConfig {
  /** Minimum balance threshold (wei) that triggers a top-up. */
  minBalance: bigint;
  /** Amount to add on top-up (wei). */
  topUpAmount: bigint;
  /** Whether auto top-up is enabled. */
  enabled: boolean;
}

/** Default balance thresholds. */
export const DEFAULT_MIN_BALANCE = 50_000_000_000_000_000n; // 0.05 ETH
export const DEFAULT_TOP_UP_AMOUNT = 100_000_000_000_000_000n; // 0.1 ETH

/**
 * Paymaster balance manager.
 *
 * Monitors paymaster balances, sends alerts when they drop below thresholds,
 * and optionally triggers automated top-ups.
 *
 * ```ts
 * const manager = new PaymasterBalanceManager({
 *   publicClient,
 *   walletClient,
 *   alertFn: (alert) => logger.warn(alert.message),
 * });
 *
 * const balance = await manager.checkBalance(paymasterAddress);
 * if (!balance.isHealthy) {
 *   await manager.topUp(paymasterAddress);
 * }
 * ```
 */
export class PaymasterBalanceManager {
  private readonly publicClient: {
    getBalance: (args: { address: Address }) => Promise<bigint>;
    getGasPrice: () => Promise<bigint>;
  };
  private readonly walletClient?: {
    sendTransaction: (args: {
      to: Address;
      value: bigint;
    }) => Promise<Hex>;
  };
  private readonly alertFn?: BalanceAlertFn;
  private readonly topUpConfigs: Map<Address, AutoTopUpConfig>;

  constructor(params: {
    publicClient: {
      getBalance: (args: { address: Address }) => Promise<bigint>;
      getGasPrice: () => Promise<bigint>;
    };
    walletClient?: {
      sendTransaction: (args: {
        to: Address;
        value: bigint;
      }) => Promise<Hex>;
    };
    alertFn?: BalanceAlertFn;
  }) {
    this.publicClient = params.publicClient;
    this.walletClient = params.walletClient;
    this.alertFn = params.alertFn;
    this.topUpConfigs = new Map();
  }

  /**
   * Check the balance of a paymaster contract.
   */
  async checkBalance(
    paymaster: Address,
    minBalance?: bigint,
  ): Promise<PaymasterBalance> {
    const ethBalance = await this.publicClient.getBalance({ address: paymaster });
    const gasPrice = await this.publicClient.getGasPrice();
    const threshold = minBalance ?? DEFAULT_MIN_BALANCE;

    // Estimate remaining ops: balance / (avg gas cost per op)
    // Average UserOp gas cost ~ 200k gas at current gas price
    const avgGasPerOp = 200_000n;
    const costPerOp = gasPrice * avgGasPerOp;
    const estimatedOpsRemaining = costPerOp > 0n ? Number(ethBalance / costPerOp) : 0;

    const isHealthy = ethBalance >= threshold;

    if (!isHealthy && this.alertFn) {
      this.alertFn({
        paymaster,
        balance: ethBalance,
        threshold,
        message: `Paymaster ${paymaster} balance (${ethBalance} wei) is below threshold (${threshold} wei). Remaining ops: ~${estimatedOpsRemaining}`,
      });
    }

    return {
      address: paymaster,
      ethBalance,
      symbol: 'ETH',
      estimatedOpsRemaining,
      isHealthy,
      checkedAt: Date.now(),
    };
  }

  /**
   * Check balances of multiple paymasters.
   */
  async checkAllBalances(
    paymasters: Address[],
    minBalance?: bigint,
  ): Promise<PaymasterBalance[]> {
    return Promise.all(
      paymasters.map((pm) => this.checkBalance(pm, minBalance)),
    );
  }

  /**
   * Top up a paymaster with ETH.
   *
   * @param paymaster - Paymaster address.
   * @param amount - Amount to send (wei). Defaults to config or DEFAULT_TOP_UP_AMOUNT.
   */
  async topUp(paymaster: Address, amount?: bigint): Promise<Hex> {
    if (!this.walletClient) {
      throw new Error('No wallet client configured for top-ups');
    }

    const config = this.topUpConfigs.get(paymaster);
    const topUpAmount = amount ?? config?.topUpAmount ?? DEFAULT_TOP_UP_AMOUNT;

    const txHash = await this.walletClient.sendTransaction({
      to: paymaster,
      value: topUpAmount,
    });

    return txHash;
  }

  /**
   * Set auto top-up configuration for a paymaster.
   */
  setAutoTopUpConfig(paymaster: Address, config: AutoTopUpConfig): void {
    this.topUpConfigs.set(paymaster, config);
  }

  /**
   * Check and optionally auto top-up a paymaster.
   * Returns the balance info and whether a top-up was performed.
   */
  async checkAndAutoTopUp(
    paymaster: Address,
    minBalance?: bigint,
  ): Promise<{ balance: PaymasterBalance; toppedUp: boolean }> {
    const balance = await this.checkBalance(paymaster, minBalance);

    if (!balance.isHealthy) {
      const config = this.topUpConfigs.get(paymaster);
      if (config?.enabled) {
        await this.topUp(paymaster, config.topUpAmount);
        return { balance: await this.checkBalance(paymaster, minBalance), toppedUp: true };
      }
    }

    return { balance, toppedUp: false };
  }

  /**
   * Get the total ETH balance across all paymasters.
   */
  async getTotalBalance(paymasters: Address[]): Promise<bigint> {
    const balances = await Promise.all(
      paymasters.map((pm) => this.publicClient.getBalance({ address: pm })),
    );
    return balances.reduce((sum, b) => sum + b, 0n);
  }
}

export default PaymasterBalanceManager;

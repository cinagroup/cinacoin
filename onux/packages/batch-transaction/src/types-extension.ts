/**
 * Extended wallet client types for batch transaction execution.
 * These extend the base viem WalletClient with methods needed for EIP-5792 and custom operations.
 */

import type { Address, Hex, WalletClient } from 'viem';

/**
 * Extended wallet client with wallet_sendCalls support (EIP-5792)
 */
export interface Eip5792WalletClient extends WalletClient {
  /**
   * Send a request to the wallet (used for wallet_sendCalls)
   */
  request: (args: { method: string; params: unknown[] }) => Promise<{ id: string }>;
  
  /**
   * Send a transaction with full parameters
   */
  sendTransaction: (args: {
    account: Address;
    to?: Address;
    data?: Hex;
    value?: bigint;
    gas?: bigint;
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
  }) => Promise<Hex>;
}

/**
 * Transaction parameters for single operation execution
 */
export interface SingleTxParams {
  account: Address;
  to?: Address;
  data?: Hex;
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}
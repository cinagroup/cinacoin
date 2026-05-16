/**
 * Operation and result types for batch transactions.
 */

export type OperationType = 'transfer' | 'approve' | 'swap' | 'custom';

export interface OperationBase {
  type: OperationType;
  chainId: number;
  /** Estimated gas limit for this operation (in wei). */
  gasEstimate?: bigint;
  /** Optional label for human readability. */
  label?: string;
}

export interface TransferOperation extends OperationBase {
  type: 'transfer';
  from: string;
  to: string;
  value: bigint;
  tokenAddress?: string; // native transfer if undefined
}

export interface ApproveOperation extends OperationBase {
  type: 'approve';
  from: string;
  tokenAddress: string;
  spender: string;
  amount: bigint;
}

export interface SwapOperation extends OperationBase {
  type: 'swap';
  from: string;
  fromToken: string;
  toToken: string;
  fromAmount: bigint;
  minToAmount: bigint;
  routerAddress?: string;
  routeData?: string;
}

export interface CustomOperation extends OperationBase {
  type: 'custom';
  from: string;
  to: string;
  data: string;
  value?: bigint;
}

export type Operation = TransferOperation | ApproveOperation | SwapOperation | CustomOperation;

export interface OperationResult {
  index: number;
  success: boolean;
  txHash?: string;
  gasUsed?: bigint;
  error?: string;
}

export interface BatchResult {
  success: boolean;
  atomic: boolean;
  results: OperationResult[];
  totalGasUsed: bigint;
  batchTxHash?: string;
  error?: string;
}

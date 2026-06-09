/**
 * Transfer operation factory.
 */

import { TransferOperation } from '../types.js';

export interface TransferParams {
  chainId: number;
  from: string;
  to: string;
  value: bigint;
  tokenAddress?: string;
  label?: string;
}

export function createTransferOperation(params: TransferParams): TransferOperation {
  return {
    type: 'transfer',
    chainId: params.chainId,
    from: params.from,
    to: params.to,
    value: params.value,
    tokenAddress: params.tokenAddress,
    label: params.label,
  };
}

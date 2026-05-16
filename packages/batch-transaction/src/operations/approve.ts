/**
 * Approve operation factory.
 */

import { ApproveOperation } from '../types.js';

export interface ApproveParams {
  chainId: number;
  from: string;
  tokenAddress: string;
  spender: string;
  amount: bigint;
  label?: string;
}

export function createApproveOperation(params: ApproveParams): ApproveOperation {
  return {
    type: 'approve',
    chainId: params.chainId,
    from: params.from,
    tokenAddress: params.tokenAddress,
    spender: params.spender,
    amount: params.amount,
    label: params.label,
  };
}

/**
 * Custom operation factory for arbitrary contract calls.
 */

import { CustomOperation } from '../types.js';

export interface CustomParams {
  chainId: number;
  from: string;
  to: string;
  data: string;
  value?: bigint;
  label?: string;
}

export function createCustomOperation(params: CustomParams): CustomOperation {
  return {
    type: 'custom',
    chainId: params.chainId,
    from: params.from,
    to: params.to,
    data: params.data,
    value: params.value,
    label: params.label,
  };
}

/**
 * Swap operation factory.
 *
 * Integrates with the swap-sdk for DEX routing data.
 */

import { SwapOperation } from '../types.js';

export interface SwapParams {
  chainId: number;
  from: string;
  fromToken: string;
  toToken: string;
  fromAmount: bigint;
  minToAmount: bigint;
  routerAddress?: string;
  routeData?: string;
  label?: string;
}

export function createSwapOperation(params: SwapParams): SwapOperation {
  return {
    type: 'swap',
    chainId: params.chainId,
    from: params.from,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    minToAmount: params.minToAmount,
    routerAddress: params.routerAddress,
    routeData: params.routeData,
    label: params.label,
  };
}

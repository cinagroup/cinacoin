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
export declare function createSwapOperation(params: SwapParams): SwapOperation;
//# sourceMappingURL=swap.d.ts.map
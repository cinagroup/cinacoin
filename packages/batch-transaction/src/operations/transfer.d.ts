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
export declare function createTransferOperation(params: TransferParams): TransferOperation;
//# sourceMappingURL=transfer.d.ts.map
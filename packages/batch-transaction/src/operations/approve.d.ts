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
export declare function createApproveOperation(params: ApproveParams): ApproveOperation;
//# sourceMappingURL=approve.d.ts.map
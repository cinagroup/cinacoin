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
export declare function createCustomOperation(params: CustomParams): CustomOperation;
//# sourceMappingURL=custom.d.ts.map
/**
 * Batch transaction builder.
 *
 * Collects operations, validates integrity, estimates gas,
 * and delegates execution to the BatchExecutor.
 */
import { Operation, BatchResult } from './types.js';
import { ExecuteOptions } from './executor.js';
export interface BatchConfig {
    /** Chain ID for the batch (all operations must match). */
    chainId: number;
    /** Whether the batch should be atomic (all or nothing). */
    atomic?: boolean;
    /** Maximum total gas allowed. */
    maxGas?: bigint;
}
export interface BatchSummary {
    operationCount: number;
    estimatedGas: bigint;
    valid: boolean;
    errors: string[];
}
export declare class BatchTransaction {
    private operations;
    private chainId;
    private atomic;
    private maxGas?;
    constructor(config: BatchConfig);
    /** Add an operation to the batch */
    add(operation: Operation): this;
    /** Remove an operation by index */
    removeAt(index: number): Operation | undefined;
    /** Get all operations */
    getOperations(): ReadonlyArray<Operation>;
    /** Get operation count */
    size(): number;
    /** Clear all operations */
    clear(): void;
    /** Validate batch integrity */
    validate(): {
        valid: boolean;
        errors: string[];
    };
    /** Estimate total gas for the batch */
    estimate(): bigint;
    /** Build a summary */
    summary(): BatchSummary;
    /** Execute the batch */
    execute(options?: ExecuteOptions): Promise<BatchResult>;
}
//# sourceMappingURL=batch.d.ts.map
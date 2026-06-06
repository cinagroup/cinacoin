/**
 * Batch executor with atomicity support.
 *
 * Executes a series of operations, either atomically (all succeed or
 * all fail) or sequentially (individual success/failure tracked).
 */
import { Operation, BatchResult } from './types.js';
export interface ExecuteOptions {
    /** Override atomicity for this execution. */
    atomic?: boolean;
    /** Simulate execution (dry run, no actual tx). */
    simulate?: boolean;
}
export interface BatchExecutionResult extends BatchResult {
}
export interface ExecutorConfig {
    atomic?: boolean;
}
export declare class BatchExecutor {
    private atomic;
    constructor(config?: ExecutorConfig);
    /** Execute a batch of operations */
    execute(operations: Operation[], options?: ExecuteOptions): Promise<BatchResult>;
    /** Execute a single operation (simulated) */
    private executeOperation;
}
//# sourceMappingURL=executor.d.ts.map
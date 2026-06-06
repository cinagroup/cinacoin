/**
 * Batch transaction builder.
 *
 * Collects operations, validates integrity, estimates gas,
 * and delegates execution to the BatchExecutor.
 */
import { BatchExecutor } from './executor.js';
export class BatchTransaction {
    constructor(config) {
        this.operations = [];
        this.chainId = config.chainId;
        this.atomic = config.atomic ?? true;
        this.maxGas = config.maxGas;
    }
    /** Add an operation to the batch */
    add(operation) {
        if (operation.chainId !== this.chainId) {
            throw new Error(`Operation chain ${operation.chainId} does not match batch chain ${this.chainId}`);
        }
        this.operations.push(operation);
        return this;
    }
    /** Remove an operation by index */
    removeAt(index) {
        return this.operations.splice(index, 1)[0];
    }
    /** Get all operations */
    getOperations() {
        return this.operations;
    }
    /** Get operation count */
    size() {
        return this.operations.length;
    }
    /** Clear all operations */
    clear() {
        this.operations = [];
    }
    /** Validate batch integrity */
    validate() {
        const errors = [];
        if (this.operations.length === 0) {
            errors.push('Batch is empty');
        }
        // Check all operations match batch chain
        for (let i = 0; i < this.operations.length; i++) {
            const op = this.operations[i];
            if (op.chainId !== this.chainId) {
                errors.push(`Operation ${i}: chain mismatch (${op.chainId} !== ${this.chainId})`);
            }
            // Type-specific validation
            if (op.type === 'transfer' && !op.to) {
                errors.push(`Operation ${i}: transfer missing recipient`);
            }
            if (op.type === 'approve' && !op.spender) {
                errors.push(`Operation ${i}: approve missing spender`);
            }
            if (op.type === 'custom' && !op.data) {
                errors.push(`Operation ${i}: custom operation missing data`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
    /** Estimate total gas for the batch */
    estimate() {
        let total = 0n;
        for (const op of this.operations) {
            // Default gas estimates per operation type
            const defaults = {
                transfer: 65000n,
                approve: 46000n,
                swap: 150000n,
                custom: 100000n,
            };
            total += op.gasEstimate ?? defaults[op.type] ?? 100000n;
        }
        return total;
    }
    /** Build a summary */
    summary() {
        const validation = this.validate();
        return {
            operationCount: this.operations.length,
            estimatedGas: this.estimate(),
            valid: validation.valid,
            errors: validation.errors,
        };
    }
    /** Execute the batch */
    async execute(options = {}) {
        const validation = this.validate();
        if (!validation.valid) {
            return {
                success: false,
                atomic: this.atomic,
                results: [],
                totalGasUsed: 0n,
                error: validation.errors.join('; '),
            };
        }
        if (this.maxGas) {
            const estimated = this.estimate();
            if (estimated > this.maxGas) {
                return {
                    success: false,
                    atomic: this.atomic,
                    results: [],
                    totalGasUsed: 0n,
                    error: `Estimated gas ${estimated} exceeds max ${this.maxGas}`,
                };
            }
        }
        const executor = new BatchExecutor({ atomic: this.atomic });
        return executor.execute(this.operations, options);
    }
}
//# sourceMappingURL=batch.js.map
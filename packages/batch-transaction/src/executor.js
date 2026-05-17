/**
 * Batch executor with atomicity support.
 *
 * Executes a series of operations, either atomically (all succeed or
 * all fail) or sequentially (individual success/failure tracked).
 */
export class BatchExecutor {
    constructor(config = {}) {
        this.atomic = config.atomic ?? true;
    }
    /** Execute a batch of operations */
    async execute(operations, options = {}) {
        const useAtomic = options.atomic ?? this.atomic;
        const results = [];
        let totalGasUsed = 0n;
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            const result = await this.executeOperation(op, i, options);
            results.push(result);
            totalGasUsed += result.gasUsed ?? 0n;
            if (!result.success && useAtomic) {
                // Atomic mode: fail fast, mark remaining as skipped
                for (let j = i + 1; j < operations.length; j++) {
                    results.push({
                        index: j,
                        success: false,
                        error: 'Skipped due to atomic failure',
                    });
                }
                return {
                    success: false,
                    atomic: useAtomic,
                    results,
                    totalGasUsed,
                    error: `Operation ${i} failed: ${result.error}`,
                };
            }
        }
        return {
            success: results.every((r) => r.success),
            atomic: useAtomic,
            results,
            totalGasUsed,
        };
    }
    /** Execute a single operation (simulated) */
    async executeOperation(operation, index, options) {
        if (options.simulate) {
            return {
                index,
                success: true,
                gasUsed: operation.gasEstimate ?? 50000n,
            };
        }
        // In production, this would send actual transactions.
        // For now, simulate based on operation structure.
        try {
            switch (operation.type) {
                case 'transfer':
                    if (!operation.to)
                        throw new Error('Missing recipient');
                    break;
                case 'approve':
                    if (!operation.spender)
                        throw new Error('Missing spender');
                    break;
                case 'swap':
                    if (!operation.fromToken || !operation.toToken)
                        throw new Error('Missing tokens');
                    break;
                case 'custom':
                    if (!operation.data)
                        throw new Error('Missing calldata');
                    break;
            }
            return {
                index,
                success: true,
                txHash: `0xsim${index}${Date.now().toString(16)}`,
                gasUsed: operation.gasEstimate ?? 50000n,
            };
        }
        catch (err) {
            return {
                index,
                success: false,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=executor.js.map
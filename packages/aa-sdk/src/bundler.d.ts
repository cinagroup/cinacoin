import type { BundlerConfig, BundlerEstimate, BundlerSendResult, UserOperation } from './types.js';
/**
 * BundlerClient — Client for sending user operations to ERC-4337 bundlers.
 */
export declare class BundlerClient {
    readonly config: BundlerConfig;
    constructor(config: BundlerConfig);
    /**
     * Send a user operation to the bundler.
     */
    sendUserOperation(userOp: UserOperation): Promise<BundlerSendResult>;
    /**
     * Estimate gas for a user operation.
     */
    estimateUserOperationGas(userOp: UserOperation): Promise<BundlerEstimate>;
    /**
     * Get the status of a user operation.
     */
    getUserOperationStatus(userOpHash: string): Promise<{
        status: string;
        transactionHash?: string;
    }>;
    /**
     * Get supported entry points from the bundler.
     */
    getSupportedEntryPoints(): Promise<string[]>;
    /**
     * Estimate gas and fill defaults for missing fields.
     */
    fillUserOperationDefaults(userOp: Partial<UserOperation>): Promise<UserOperation>;
    private hashUserOp;
}
//# sourceMappingURL=bundler.d.ts.map
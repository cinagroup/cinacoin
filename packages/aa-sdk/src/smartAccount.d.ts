import type { SmartAccountConfig, SmartAccountState, UserOperation, UserOperationResult, BatchTransaction } from './types.js';
/**
 * SmartAccount — ERC-4337 compatible smart account implementation.
 */
export declare class SmartAccount {
    readonly config: SmartAccountConfig;
    private state;
    constructor(config: SmartAccountConfig);
    /**
     * Create a new smart account (derives address, not deployed yet).
     */
    static create(config: SmartAccountConfig): Promise<SmartAccount>;
    /**
     * Get the current account state.
     */
    getState(): SmartAccountState;
    /**
     * Derive the smart account address from the owner and factory.
     */
    getAddress(): string;
    /**
     * Execute a single transaction through the smart account.
     */
    execute(to: string, value: bigint, data: string): Promise<UserOperationResult>;
    /**
     * Execute multiple transactions in a batch.
     */
    executeBatch(transactions: BatchTransaction[]): Promise<UserOperationResult>;
    /**
     * Sign a UserOperation.
     */
    sign(userOp: UserOperation): Promise<string>;
    /**
     * Build a UserOperation from batch transactions.
     */
    buildUserOperation(transactions: BatchTransaction[]): UserOperation;
    /**
     * Hash a UserOperation according to EIP-4337.
     */
    hashUserOperation(userOp: UserOperation): string;
    /**
     * Get the account nonce.
     */
    getNonce(): bigint;
    /**
     * Update the account balance.
     */
    updateBalance(balance: bigint): void;
    /**
     * Mark the account as deployed.
     */
    markDeployed(): void;
    private deriveAddress;
    private encodeBatch;
    private getInitCode;
    private encodeUserOpForHash;
}
//# sourceMappingURL=smartAccount.d.ts.map
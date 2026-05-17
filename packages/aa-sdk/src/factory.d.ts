import type { FactoryConfig } from './types.js';
/**
 * SmartAccountFactory — Account factory for creating new smart accounts.
 */
export declare class SmartAccountFactory {
    readonly config: FactoryConfig;
    private deployedAccounts;
    constructor(config: FactoryConfig);
    /**
     * Compute the address for a new account without deploying it.
     */
    computeAddress(owner: string, salt?: bigint): string;
    /**
     * Deploy a new smart account.
     * Returns the deployed address.
     */
    deploy(owner: string, salt?: bigint): Promise<{
        address: string;
        hash: string;
    }>;
    /**
     * Check if an account has been deployed.
     */
    isDeployed(address: string): boolean;
    /**
     * Get the factory entry point address.
     */
    getEntryPoint(): string;
}
//# sourceMappingURL=factory.d.ts.map
import type { PaymasterConfig, PaymasterRequest, PaymasterResponse, UserOperation } from './types.js';
/**
 * PaymasterClient — Client for interacting with ERC-4337 paymaster services.
 */
export declare class PaymasterClient {
    readonly config: PaymasterConfig;
    constructor(config: PaymasterConfig);
    /**
     * Sponsor a user operation by returning paymasterAndData.
     */
    sponsor(request: PaymasterRequest): Promise<PaymasterResponse>;
    /**
     * Get paymaster gas limits for a user operation.
     */
    getGasLimits(_userOp: UserOperation): Promise<{
        verificationGasLimit: bigint;
        callGasLimit: bigint;
        preVerificationGas: bigint;
    }>;
    /**
     * Get the paymaster balance.
     */
    getBalance(): Promise<bigint>;
    /**
     * Verify if the paymaster can sponsor a given operation.
     */
    canSponsor(_request: PaymasterRequest): boolean;
    private generatePaymasterData;
}
//# sourceMappingURL=paymaster.d.ts.map
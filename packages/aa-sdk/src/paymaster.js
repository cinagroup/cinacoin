/**
 * PaymasterClient — Client for interacting with ERC-4337 paymaster services.
 */
export class PaymasterClient {
    constructor(config) {
        this.config = config;
    }
    /**
     * Sponsor a user operation by returning paymasterAndData.
     */
    async sponsor(request) {
        // In production, this would call the paymaster API
        const paymasterAndData = this.generatePaymasterData(request);
        return {
            paymasterAndData,
            preVerificationGas: 50000n,
            verificationGasLimit: 100000n,
            callGasLimit: 200000n,
        };
    }
    /**
     * Get paymaster gas limits for a user operation.
     */
    async getGasLimits(_userOp) {
        return {
            verificationGasLimit: 100000n,
            callGasLimit: 200000n,
            preVerificationGas: 50000n,
        };
    }
    /**
     * Get the paymaster balance.
     */
    async getBalance() {
        // In production, this would query the paymaster contract
        return 1000000000000000000n; // 1 ETH
    }
    /**
     * Verify if the paymaster can sponsor a given operation.
     */
    canSponsor(_request) {
        return this.config.sponsorType !== undefined;
    }
    generatePaymasterData(request) {
        // Simplified paymaster data encoding
        const paymaster = '0x0000000000000000000000000000000000000001';
        const validity = '0x' + Date.now().toString(16).padStart(16, '0');
        return paymaster + validity;
    }
}
//# sourceMappingURL=paymaster.js.map
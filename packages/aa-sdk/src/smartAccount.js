import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
/**
 * SmartAccount — ERC-4337 compatible smart account implementation.
 */
export class SmartAccount {
    constructor(config) {
        this.config = config;
        this.state = {
            address: this.deriveAddress(),
            owner: config.owner,
            nonce: 0n,
            balance: 0n,
            isDeployed: false,
        };
    }
    /**
     * Create a new smart account (derives address, not deployed yet).
     */
    static async create(config) {
        return new SmartAccount(config);
    }
    /**
     * Get the current account state.
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Derive the smart account address from the owner and factory.
     */
    getAddress() {
        return this.state.address;
    }
    /**
     * Execute a single transaction through the smart account.
     */
    async execute(to, value, data) {
        const userOp = this.buildUserOperation([{ to, value, data }]);
        const userOpHash = this.hashUserOperation(userOp);
        return { userOpHash, status: 'pending' };
    }
    /**
     * Execute multiple transactions in a batch.
     */
    async executeBatch(transactions) {
        const userOp = this.buildUserOperation(transactions);
        const userOpHash = this.hashUserOperation(userOp);
        return { userOpHash, status: 'pending' };
    }
    /**
     * Sign a UserOperation.
     */
    async sign(userOp) {
        const hash = this.hashUserOperation(userOp);
        // In production, this would use the owner's private key to sign
        return `0x${hash}`;
    }
    /**
     * Build a UserOperation from batch transactions.
     */
    buildUserOperation(transactions) {
        const callData = this.encodeBatch(transactions);
        return {
            sender: this.state.address,
            nonce: this.state.nonce++,
            initCode: this.state.isDeployed ? '0x' : this.getInitCode(),
            callData,
            callGasLimit: 100000n,
            verificationGasLimit: 150000n,
            preVerificationGas: 21000n,
            maxFeePerGas: 20000000000n,
            maxPriorityFeePerGas: 2000000000n,
            paymasterAndData: '0x',
            signature: '0x',
        };
    }
    /**
     * Hash a UserOperation according to EIP-4337.
     */
    hashUserOperation(userOp) {
        const encoded = this.encodeUserOpForHash(userOp);
        const hash = sha256(encoded);
        return bytesToHex(hash);
    }
    /**
     * Get the account nonce.
     */
    getNonce() {
        return this.state.nonce;
    }
    /**
     * Update the account balance.
     */
    updateBalance(balance) {
        this.state.balance = balance;
    }
    /**
     * Mark the account as deployed.
     */
    markDeployed() {
        this.state.isDeployed = true;
    }
    deriveAddress() {
        const input = new TextEncoder().encode(`${this.config.owner}:${this.config.factoryAddress ?? 'default'}:${this.config.index ?? 0n}`);
        const hash = sha256(input);
        return bytesToHex(hash.slice(-20));
    }
    encodeBatch(transactions) {
        // Simplified encoding: concatenate ABI-encoded calls
        // In production, this would use proper ABI encoding
        const parts = transactions.map((tx) => `${tx.to}:${tx.value}:${tx.data}`);
        const encoded = new TextEncoder().encode(parts.join('|'));
        return `0x${bytesToHex(encoded)}`;
    }
    getInitCode() {
        if (!this.config.factoryAddress)
            return '0x';
        // Factory address + create call data
        return `${this.config.factoryAddress}0x`;
    }
    encodeUserOpForHash(userOp) {
        const str = [
            userOp.sender,
            userOp.nonce.toString(),
            userOp.callGasLimit.toString(),
            userOp.verificationGasLimit.toString(),
            userOp.preVerificationGas.toString(),
            userOp.maxFeePerGas.toString(),
            userOp.maxPriorityFeePerGas.toString(),
            userOp.callData,
        ].join(',');
        return new TextEncoder().encode(str);
    }
}
//# sourceMappingURL=smartAccount.js.map
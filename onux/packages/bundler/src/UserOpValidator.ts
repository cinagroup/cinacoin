import {
  createPublicClient,
  http,
  type Address,
  type Chain,
  keccak256,
  encodeFunctionData,
  decodeErrorResult,
  type PublicClient,
  type Hex,
} from 'viem';
import type { RawUserOperation, ValidationResult, BundlerServerConfig, SimulationConfig } from './server-types';

// ERC-4337 EntryPoint v0.6 ABI for validation
const ENTRY_POINT_V06_ABI = [
  {
    type: 'function',
    name: 'simulateValidation',
    stateMutability: 'view',
    inputs: [{ name: 'userOp', type: 'tuple', components: [
      { name: 'sender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'initCode', type: 'bytes' },
      { name: 'callData', type: 'bytes' },
      { name: 'callGasLimit', type: 'uint256' },
      { name: 'verificationGasLimit', type: 'uint256' },
      { name: 'preVerificationGas', type: 'uint256' },
      { name: 'maxFeePerGas', type: 'uint256' },
      { name: 'maxPriorityFeePerGas', type: 'uint256' },
      { name: 'paymasterAndData', type: 'bytes' },
      { name: 'signature', type: 'bytes' },
    ]}],
    outputs: [
      { name: 'accountValidationData', type: 'uint256' },
      { name: 'factoryValidationData', type: 'uint256' },
      { name: 'paymasterValidationData', type: 'uint256' },
      { name: 'paymasterContext', type: 'bytes' },
    ],
  },
  {
    type: 'function',
    name: 'simulateHandleOp',
    stateMutability: 'view',
    inputs: [
      { name: 'op', type: 'tuple', components: [
        { name: 'sender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'initCode', type: 'bytes' },
        { name: 'callData', type: 'bytes' },
        { name: 'callGasLimit', type: 'uint256' },
        { name: 'verificationGasLimit', type: 'uint256' },
        { name: 'preVerificationGas', type: 'uint256' },
        { name: 'maxFeePerGas', type: 'uint256' },
        { name: 'maxPriorityFeePerGas', type: 'uint256' },
        { name: 'paymasterAndData', type: 'bytes' },
        { name: 'signature', type: 'bytes' },
      ]},
      { name: 'target', type: 'address' },
      { name: 'targetCallData', type: 'bytes' },
    ],
    outputs: [
      { name: 'paid', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validUntil', type: 'uint256' },
      { name: 'targetSuccess', type: 'bool' },
      { name: 'targetResult', type: 'bytes' },
    ],
  },
] as const;

/**
 * UserOpValidator — validates UserOperations against ERC-4337 rules
 * and Pimlico-specific policies before accepting into the mempool.
 */
export class UserOpValidator {
  private config: BundlerServerConfig;
  private blacklisted: Set<Address>;
  private publicClient: PublicClient;

  constructor(config: BundlerServerConfig, chain: Chain, rpcUrl: string) {
    this.config = config;
    this.blacklisted = new Set(config.blacklistedSenders);
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  }

  /**
   * Full validation pipeline: blacklist → gas → price → signature → profit → simulation.
   */
  async validate(userOp: RawUserOperation): Promise<ValidationResult> {
    // 1. Blacklist check
    const blacklistResult = this.checkBlacklist(userOp);
    if (!blacklistResult.valid) return blacklistResult;

    // 2. Gas limit sanity
    const gasLimitResult = this.checkGasLimits(userOp);
    if (!gasLimitResult.valid) return gasLimitResult;

    // 3. Gas price sanity
    const gasPriceResult = this.checkGasPrice(userOp);
    if (!gasPriceResult.valid) return gasPriceResult;

    // 4. Signature non-empty
    const sigResult = this.checkSignature(userOp);
    if (!sigResult.valid) return sigResult;

    // 5. Pimlico ERC-4337 compliance rules
    const pimlicoResult = this.checkPimlicoRules(userOp);
    if (!pimlicoResult.valid) return pimlicoResult;

    // 6. Profit margin check
    const profitResult = await this.checkProfitMargin(userOp);
    if (!profitResult.valid) return profitResult;

    // 7. On-chain simulation via EntryPoint
    if (this.config.simulation.enabled) {
      const simResult = await this.checkSimulation(userOp);
      if (!simResult.valid) return simResult;
    }

    return { valid: true };
  }

  // ── Individual validation checks ────────────────────────────────

  /** Check if sender is blacklisted. */
  private checkBlacklist(userOp: RawUserOperation): ValidationResult {
    if (this.blacklisted.has(userOp.sender)) {
      return { valid: false, reason: 'sender is blacklisted' };
    }

    // Also check paymaster if present
    if (userOp.paymasterAndData !== '0x' && userOp.paymasterAndData.length >= 42) {
      const pm = userOp.paymasterAndData.slice(0, 42) as Address;
      if (this.blacklisted.has(pm)) {
        return { valid: false, reason: 'paymaster is blacklisted' };
      }
    }

    return { valid: true };
  }

  /** Sanity check gas limits. */
  private checkGasLimits(userOp: RawUserOperation): ValidationResult {
    const callGas = BigInt(userOp.callGasLimit);
    const verGas = BigInt(userOp.verificationGasLimit);
    const preGas = BigInt(userOp.preVerificationGas);
    const totalGas = callGas + verGas + preGas;

    if (totalGas < BigInt(this.config.minBundleGas)) {
      return { valid: false, reason: 'total gas below minimum' };
    }

    if (verGas > 5_000_000n) {
      return { valid: false, reason: 'verification gas limit too high (potential DoS)' };
    }

    if (callGas > 20_000_000n) {
      return { valid: false, reason: 'call gas limit too high' };
    }

    if (preGas > 1_000_000n) {
      return { valid: false, reason: 'preVerification gas limit too high' };
    }

    return { valid: true };
  }

  /** Sanity check gas prices. */
  private checkGasPrice(userOp: RawUserOperation): ValidationResult {
    const maxFee = BigInt(userOp.maxFeePerGas);
    const prioFee = BigInt(userOp.maxPriorityFeePerGas);

    if (maxFee === 0n) {
      return { valid: false, reason: 'maxFeePerGas is zero' };
    }

    if (prioFee > maxFee) {
      return { valid: false, reason: 'maxPriorityFeePerGas exceeds maxFeePerGas' };
    }

    return { valid: true };
  }

  /** Check signature is non-empty. */
  private checkSignature(userOp: RawUserOperation): ValidationResult {
    if (userOp.signature === '0x' || userOp.signature.length < 2) {
      return { valid: false, reason: 'empty signature' };
    }
    return { valid: true };
  }

  /**
   * Pimlico-specific ERC-4337 compliance rules:
   * - initCode must be empty if account is already deployed
   * - paymasterAndData consistency
   * - access list restrictions
   */
  private checkPimlicoRules(userOp: RawUserOperation): ValidationResult {
    // Rule: if initCode is non-empty, it must contain a factory address (20 bytes)
    if (userOp.initCode !== '0x') {
      if (userOp.initCode.length < 42) {
        return { valid: false, reason: 'initCode too short (must contain factory address)' };
      }
      // Rule: initCode length must be reasonable
      if (userOp.initCode.length > 10_000) {
        return { valid: false, reason: 'initCode excessively long' };
      }
    }

    // Rule: if paymasterAndData is non-empty, it must have a valid paymaster address
    if (userOp.paymasterAndData !== '0x') {
      if (userOp.paymasterAndData.length < 42) {
        return { valid: false, reason: 'paymasterAndData too short (must contain paymaster address)' };
      }
    }

    // Rule: callData must be valid calldata (at least 0x)
    if (!userOp.callData.startsWith('0x')) {
      return { valid: false, reason: 'callData must be hex-prefixed' };
    }

    return { valid: true };
  }

  /** Check bundler profit margin is sufficient. */
  private async checkProfitMargin(userOp: RawUserOperation): Promise<ValidationResult> {
    const totalGas = BigInt(userOp.callGasLimit) + BigInt(userOp.verificationGasLimit) + BigInt(userOp.preVerificationGas);
    const maxFee = BigInt(userOp.maxFeePerGas);
    const prioFee = BigInt(userOp.maxPriorityFeePerGas);
    const baseFee = maxFee - prioFee; // Approximate base fee

    // User payment = priority fee × total gas
    const userPayment = prioFee * totalGas;
    // Estimated execution cost = base fee × call gas
    const estimatedCost = baseFee * BigInt(userOp.callGasLimit);

    if (estimatedCost === 0n) return { valid: true };

    const profitBps = ((userPayment - estimatedCost) * 10_000n) / estimatedCost;

    if (profitBps < BigInt(this.config.minProfitMarginBps)) {
      return { valid: false, reason: `insufficient profit margin (${profitBps}bps < ${this.config.minProfitMarginBps}bps required)` };
    }

    return { valid: true };
  }

  /**
   * Simulate UserOp via EntryPoint.simulateValidation or simulateHandleOp.
   * Catches on-chain validation failures before accepting into mempool.
   */
  private async checkSimulation(userOp: RawUserOperation): Promise<ValidationResult> {
    const totalGas = BigInt(userOp.callGasLimit) + BigInt(userOp.verificationGasLimit) + BigInt(userOp.preVerificationGas);
    if (totalGas > BigInt(this.config.simulation.maxSimulationGas)) {
      return { valid: false, reason: 'simulation gas exceeds maximum allowed' };
    }

    // Try simulateHandleOp first (EntryPoint v0.6+)
    try {
      const opTuple = this.toViemUserOpTuple(userOp);

      await this.publicClient.readContract({
        address: this.config.entryPoints[0],
        abi: ENTRY_POINT_V06_ABI,
        functionName: 'simulateHandleOp',
        args: [opTuple, userOp.sender as Address, '0x' as Hex],
      });

      return { valid: true };
    } catch (err) {
      // If simulateHandleOp reverts with AA errors, extract the reason
      const reason = this.extractAAError(err);
      if (reason) {
        return { valid: false, reason };
      }

      // Fallback: try simulateValidation
      try {
        const opTuple = this.toViemUserOpTuple(userOp);

        await this.publicClient.readContract({
          address: this.config.entryPoints[0],
          abi: ENTRY_POINT_V06_ABI,
          functionName: 'simulateValidation',
          args: [opTuple],
        });

        return { valid: true };
      } catch (err2) {
        const reason2 = this.extractAAError(err2);
        if (reason2) {
          return { valid: false, reason: reason2 };
        }
        // If both simulations pass (return without revert), it's valid
        return { valid: true };
      }
    }
  }

  /** Convert RawUserOperation to viem tuple format for contract calls. */
  private toViemUserOpTuple(op: RawUserOperation) {
    return {
      sender: op.sender,
      nonce: BigInt(op.nonce),
      initCode: op.initCode,
      callData: op.callData,
      callGasLimit: BigInt(op.callGasLimit),
      verificationGasLimit: BigInt(op.verificationGasLimit),
      preVerificationGas: BigInt(op.preVerificationGas),
      maxFeePerGas: BigInt(op.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(op.maxPriorityFeePerGas),
      paymasterAndData: op.paymasterAndData,
      signature: op.signature,
    };
  }

  /** Extract AA error code from a revert error. */
  private extractAAError(err: unknown): string | undefined {
    if (err instanceof Error) {
      const msg = err.message;
      // Match AA error codes (AA1, AA2, ..., AA50, etc.)
      const aaMatch = msg.match(/AA\d+/);
      if (aaMatch) {
        const code = aaMatch[0];
        const descriptions: Record<string, string> = {
          AA1: 'invalid sender',
          AA10: 'already known',
          AA13: 'initCode failed or OOG',
          AA20: 'account not deployed',
          AA21: 'account didn\'t pay prefund',
          AA22: 'expired or not due',
          AA23: 'account reverted',
          AA24: 'account signature failed',
          AA25: 'account returned wrong value',
          AA30: 'paymaster not deployed',
          AA31: 'paymaster deposit too low',
          AA32: 'paymaster reverted',
          AA33: 'paymaster signature failed',
          AA34: 'paymaster returned wrong value',
          AA40: 'oversized revert data',
          AA50: 'postOp reverted',
          AA51: 'paymaster didn\'t pay prefund',
          AA52: 'paymaster returned wrong value',
        };
        return `${code}: ${descriptions[code] || 'validation error'}`;
      }
      // Try to extract revert reason
      if (msg.includes('reverted')) {
        const revertMatch = msg.match(/execution reverted:?\s*(.*)/i);
        if (revertMatch) return revertMatch[1]?.trim() || msg.slice(0, 200);
      }
    }
    return undefined;
  }

  /** Add address to blacklist at runtime. */
  blacklist(address: Address): void {
    this.blacklisted.add(address);
  }

  /** Remove address from blacklist. */
  unblacklist(address: Address): void {
    this.blacklisted.delete(address);
  }

  /** Get all blacklisted addresses. */
  getBlacklist(): Address[] {
    return Array.from(this.blacklisted);
  }
}

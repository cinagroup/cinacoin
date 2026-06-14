import { Env, UserOperation } from '../types';
import { getGasPrices, calcRequiredPrefund } from './gasEstimator';

/**
 * Core bundler logic — validates and batches UserOperations.
 */
export class Bundler {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Validate a UserOperation before adding to mempool.
   */
  async validateUserOp(
    userOp: UserOperation,
    entryPoint: string
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check entry point
    if (entryPoint.toLowerCase() !== this.env.ENTRY_POINT_V07.toLowerCase()) {
      return { valid: false, reason: 'Unsupported entry point' };
    }

    // Check sender
    if (!userOp.sender || !userOp.sender.startsWith('0x')) {
      return { valid: false, reason: 'Invalid sender address' };
    }

    // Check gas limits
    const callGas = BigInt(userOp.callGasLimit || '0x0');
    const verificationGas = BigInt(userOp.verificationGasLimit || '0x0');
    const preVerificationGas = BigInt(userOp.preVerificationGas || '0x0');
    const maxFeePerGas = BigInt(userOp.maxFeePerGas || '0x0');

    if (callGas === 0n || verificationGas === 0n || preVerificationGas === 0n) {
      return { valid: false, reason: 'Gas limits must be > 0' };
    }

    if (maxFeePerGas === 0n) {
      return { valid: false, reason: 'maxFeePerGas must be > 0' };
    }

    // Check minimum verification gas
    if (verificationGas < 100_000n) {
      return { valid: false, reason: 'verificationGasLimit too low (min: 100000)' };
    }

    // Check prefund
    const requiredPrefund = calcRequiredPrefund(
      callGas,
      verificationGas,
      preVerificationGas,
      maxFeePerGas
    );

    // In production: check sender balance
    // For now, just validate the calculation
    if (requiredPrefund === 0n) {
      return { valid: false, reason: 'Required prefund is 0' };
    }

    return { valid: true };
  }

  /**
   * Get current gas prices for bundling.
   */
  async getGasPrices() {
    // Use a public RPC for gas estimation
    return getGasPrices('https://eth.llamarpc.com');
  }
}

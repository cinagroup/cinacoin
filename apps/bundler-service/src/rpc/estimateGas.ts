import { Env, UserOperation } from '../types';

/**
 * eth_estimateUserOperationGas
 * Estimates gas values for a UserOperation.
 */
export async function estimateUserOperationGas(
  userOp: UserOperation,
  entryPoint: string,
  env: Env
): Promise<{
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
}> {
  if (!userOp.sender) throw new Error('Missing sender');

  // Base gas estimates (conservative)
  let callGasLimit = 100_000n;
  let verificationGasLimit = 150_000n;
  const preVerificationGas = 21_000n;

  // If initCode is present, account is not yet deployed — increase verification gas
  if (userOp.initCode && userOp.initCode !== '0x') {
    verificationGasLimit = 500_000n;
  }

  // If paymaster data is present, increase verification gas
  if (userOp.paymasterAndData && userOp.paymasterAndData !== '0x') {
    verificationGasLimit += 100_000n;
  }

  // Estimate call gas based on callData size
  if (userOp.callData && userOp.callData !== '0x') {
    const dataLength = (userOp.callData.length - 2) / 2; // hex bytes
    callGasLimit = BigInt(Math.max(100_000, dataLength * 16 + 21_000));
  }

  return {
    callGasLimit: '0x' + callGasLimit.toString(16),
    verificationGasLimit: '0x' + verificationGasLimit.toString(16),
    preVerificationGas: '0x' + preVerificationGas.toString(16),
  };
}

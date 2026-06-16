/**
 * UserOperation serialization helpers
 */

import type { Address } from 'viem';
import type { UserOperation } from './types.js';

/**
 * Serialize a UserOperation to the paymaster RPC format
 */
export function serializeUserOp(op: UserOperation): {
  sender: Address;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
} {
  return {
    sender: op.sender,
    nonce: `0x${op.nonce.toString(16)}`,
    initCode: op.initCode,
    callData: op.callData,
    callGasLimit: `0x${op.callGasLimit.toString(16)}`,
    verificationGasLimit: `0x${op.verificationGasLimit.toString(16)}`,
    preVerificationGas: `0x${op.preVerificationGas.toString(16)}`,
    maxFeePerGas: `0x${op.maxFeePerGas.toString(16)}`,
    maxPriorityFeePerGas: `0x${op.maxPriorityFeePerGas.toString(16)}`,
    paymasterAndData: op.paymasterAndData,
    signature: op.signature,
  };
}

/**
 * Serialize a partial UserOperation for estimation requests
 */
export function serializePartialUserOp(
  op: Partial<UserOperation> & { sender: Address }
): Record<string, string> {
  const out: Record<string, string> = { sender: op.sender };
  if (op.nonce !== undefined) out.nonce = `0x${op.nonce.toString(16)}`;
  if (op.initCode) out.initCode = op.initCode;
  if (op.callData) out.callData = op.callData;
  if (op.callGasLimit !== undefined)
    out.callGasLimit = `0x${op.callGasLimit.toString(16)}`;
  if (op.verificationGasLimit !== undefined)
    out.verificationGasLimit = `0x${op.verificationGasLimit.toString(16)}`;
  if (op.preVerificationGas !== undefined)
    out.preVerificationGas = `0x${op.preVerificationGas.toString(16)}`;
  if (op.maxFeePerGas !== undefined)
    out.maxFeePerGas = `0x${op.maxFeePerGas.toString(16)}`;
  if (op.maxPriorityFeePerGas !== undefined)
    out.maxPriorityFeePerGas = `0x${op.maxPriorityFeePerGas.toString(16)}`;
  if (op.paymasterAndData) out.paymasterAndData = op.paymasterAndData;
  if (op.signature) out.signature = op.signature;
  return out;
}

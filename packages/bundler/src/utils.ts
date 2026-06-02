import { keccak256, encodeAbiParameters, type Hash, type Address, type Hex } from 'viem';
import type { RawUserOperation } from './server-types';

/**
 * Compute the keccak256 hash of a serialised UserOperation.
 * This matches the ERC-4337 specification for userOpHash.
 */
export function computeUserOpHash(op: RawUserOperation): Hash {
  const encoded = encodeAbiParameters(
    [
      { type: 'address' },
      { type: 'uint256' },
      { type: 'bytes32' }, // keccak256 of initCode
      { type: 'bytes32' }, // keccak256 of callData
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'bytes32' }, // keccak256 of paymasterAndData
    ],
    [
      op.sender,
      BigInt(op.nonce),
      keccak256(op.initCode as Hex),
      keccak256(op.callData as Hex),
      BigInt(op.callGasLimit),
      BigInt(op.verificationGasLimit),
      BigInt(op.preVerificationGas),
      BigInt(op.maxFeePerGas),
      BigInt(op.maxPriorityFeePerGas),
      keccak256(op.paymasterAndData as Hex),
    ],
  );
  return keccak256(encoded);
}

/**
 * Convert a RawUserOperation (hex strings) to a viem-compatible
 * UserOperation shape with bigints.
 */
export function toViemUserOp(op: RawUserOperation) {
  return {
    sender: op.sender,
    nonce: BigInt(op.nonce),
    initCode: op.initCode as Hex,
    callData: op.callData as Hex,
    callGasLimit: BigInt(op.callGasLimit),
    verificationGasLimit: BigInt(op.verificationGasLimit),
    preVerificationGas: BigInt(op.preVerificationGas),
    maxFeePerGas: BigInt(op.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(op.maxPriorityFeePerGas),
    paymasterAndData: op.paymasterAndData as Hex,
    signature: op.signature as Hex,
  };
}

/**
 * Convert a viem-compatible UserOperation to a RawUserOperation (hex strings).
 */
export function toRawUserOp(op: {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
}): RawUserOperation {
  return {
    sender: op.sender,
    nonce: ('0x' + op.nonce.toString(16)) as Hex,
    initCode: op.initCode,
    callData: op.callData,
    callGasLimit: ('0x' + op.callGasLimit.toString(16)) as Hex,
    verificationGasLimit: ('0x' + op.verificationGasLimit.toString(16)) as Hex,
    preVerificationGas: ('0x' + op.preVerificationGas.toString(16)) as Hex,
    maxFeePerGas: ('0x' + op.maxFeePerGas.toString(16)) as Hex,
    maxPriorityFeePerGas: ('0x' + op.maxPriorityFeePerGas.toString(16)) as Hex,
    paymasterAndData: op.paymasterAndData,
    signature: op.signature,
  };
}

/**
 * Convert a hex string to a Hex type.
 */
export function toHex(value: string): Hex {
  return value as Hex;
}

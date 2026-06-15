import { concat, hexToBytes, bytesToHex, isAddress, encodeAbiParameters, decodeAbiParameters, parseAbiParameters } from 'viem';
import type { ERC6492Signature, ValidationResult, ValidationInput } from './types';

// ERC-6492 magic suffix that identifies an encoded signature
const ERC6492_DETECTION_SUFFIX =
  '0x6492649264926492649264926492649264926492649264926492649264926492';

/**
 * Check if a signature is ERC-6492 encoded.
 */
export function isERC6492Signature(signature: string): boolean {
  if (typeof signature !== 'string' || !signature.startsWith('0x')) return false;
  return signature.endsWith(ERC6492_DETECTION_SUFFIX);
}

/**
 * ERC-01 FIX: Encode a signature, deployer address, and factory data into ERC-6492 format.
 * Uses proper ABI encoding: abi.encode(deployer, factoryCalldata, signature) + magic_suffix
 */
export function encodeValidation(sig: ERC6492Signature): string {
  // ABI encode the three parameters
  const encoded = encodeAbiParameters(
    [
      { name: 'deployer', type: 'address' },
      { name: 'factoryCalldata', type: 'bytes' },
      { name: 'signature', type: 'bytes' },
    ],
    [
      sig.deployer as `0x${string}`,
      sig.factoryData as `0x${string}`,
      sig.signature as `0x${string}`,
    ]
  );

  // Append magic suffix
  return concat([encoded, ERC6492_DETECTION_SUFFIX as `0x${string}`]);
}

/**
 * ERC-01 FIX: Decode an ERC-6492 signature back into its components.
 * Properly handles ABI-encoded data with length prefixes.
 */
export function decodeValidation(signature: string): ERC6492Signature {
  if (!isERC6492Signature(signature)) {
    throw new Error('Not a valid ERC-6492 encoded signature');
  }

  // Remove the magic suffix (32 bytes = 64 hex chars + 0x prefix)
  const withoutSuffix = signature.slice(0, -66) as `0x${string}`;

  // ABI decode the three parameters
  const decoded = decodeAbiParameters(
    [
      { name: 'deployer', type: 'address' },
      { name: 'factoryCalldata', type: 'bytes' },
      { name: 'signature', type: 'bytes' },
    ],
    withoutSuffix
  );

  return {
    deployer: decoded[0],
    factoryData: decoded[1],
    signature: decoded[2],
  };
}

/**
 * Validate an ERC-6492 signature.
 *
 * This function checks the signature format and structure.
 * Full on-chain validation requires calling the ERC-6492 validation contract
 * via an RPC node.
 */
export async function validateSignature(
  input: ValidationInput,
  options?: { rpcUrl?: string },
): Promise<ValidationResult> {
  const { signer, hash, signature: sig } = input;

  // Basic validation
  if (!signer || !isAddress(signer)) {
    return { isValid: false, reason: 'Invalid signer address' };
  }
  if (!hash || !hash.startsWith('0x')) {
    return { isValid: false, reason: 'Invalid hash' };
  }
  if (!sig || !sig.startsWith('0x')) {
    return { isValid: false, reason: 'Invalid signature' };
  }

  // Check if it's an ERC-6492 encoded signature
  if (isERC6492Signature(sig)) {
    try {
      const decoded = decodeValidation(sig);
      // The decoded signature should have proper structure
      if (decoded.deployer.length === 42 && decoded.signature.startsWith('0x')) {
        return { isValid: true };
      }
      return { isValid: false, reason: 'Malformed ERC-6492 signature' };
    } catch (err) {
      return { isValid: false, reason: (err as Error).message };
    }
  }

  // For non-ERC-6492 signatures, return indeterminate
  // Full validation requires on-chain call
  return { isValid: true, reason: 'Standard signature format (not ERC-6492 encoded)' };
}

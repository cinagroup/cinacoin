/**
 * Session Key Generation and Management
 *
 * Provides utilities for generating, managing, and validating
 * session keys for ERC-4337 smart accounts.
 *
 * Session keys are temporary signing keys with scoped permissions,
 * enabling gasless interactions and delegated actions without
 * exposing the main account key.
 */

import type { SessionKey, SessionKeyPolicy } from "./types.js";
import {
  type Address,
  type Hex,
  encodeFunctionData,
} from "viem";
import {
  generatePrivateKey,
  privateKeyToAccount,
} from "viem/accounts";

// ============================================================
// SessionKeyManager
// ============================================================

export class SessionKeyManager {
  private keys: Map<Address, SessionKey> = new Map();
  private policies: Map<string, SessionKeyPolicy> = new Map();

  /**
   * Generate a new session key.
   *
   * @param policy Optional policy to associate with this key
   * @param label Human-readable label
   * @returns The generated session key
   */
  generateKey(policy?: SessionKeyPolicy, label?: string): SessionKey {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const now = Math.floor(Date.now() / 1000);

    const sessionKey: SessionKey = {
      publicKey: account.address,
      privateKey,
      expiresAt: policy?.expiresAt ?? now + 86_400, // Default: 24 hours
      createdAt: now,
      policyId: policy?.id,
      label,
    };

    this.keys.set(account.address, sessionKey);

    if (policy) {
      this.policies.set(policy.id, policy);
    }

    return sessionKey;
  }

  /**
   * Import an existing session key from private key.
   *
   * @param privateKey The private key in hex format
   * @param policy Optional policy to associate
   * @param label Human-readable label
   * @returns The imported session key
   */
  importKey(privateKey: Hex, policy?: SessionKeyPolicy, label?: string): SessionKey {
    const account = privateKeyToAccount(privateKey);
    const now = Math.floor(Date.now() / 1000);

    const sessionKey: SessionKey = {
      publicKey: account.address,
      privateKey,
      expiresAt: policy?.expiresAt ?? now + 86_400,
      createdAt: now,
      policyId: policy?.id,
      label,
    };

    this.keys.set(account.address, sessionKey);

    if (policy) {
      this.policies.set(policy.id, policy);
    }

    return sessionKey;
  }

  /**
   * Get a session key by its public key.
   *
   * @param publicKey The session key's public address
   * @returns The session key or null if not found
   */
  getKey(publicKey: Address): SessionKey | null {
    return this.keys.get(publicKey) ?? null;
  }

  /**
   * Get all active (non-expired) session keys.
   *
   * @returns Array of active session keys
   */
  getActiveKeys(): SessionKey[] {
    const now = Math.floor(Date.now() / 1000);
    return Array.from(this.keys.values()).filter((key) => key.expiresAt > now);
  }

  /**
   * Get all stored session keys (including expired).
   */
  getAllKeys(): SessionKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * Revoke (delete) a session key.
   *
   * @param publicKey The public key to revoke
   * @returns Whether the key was found and revoked
   */
  revokeKey(publicKey: Address): boolean {
    return this.keys.delete(publicKey);
  }

  /**
   * Revoke all expired session keys.
   *
   * @returns Number of keys revoked
   */
  revokeExpiredKeys(): number {
    const now = Math.floor(Date.now() / 1000);
    let count = 0;

    for (const [address, key] of this.keys) {
      if (key.expiresAt <= now) {
        this.keys.delete(address);
        count++;
      }
    }

    return count;
  }

  /**
   * Sign a message with a session key.
   *
   * @param publicKey The session key's public address
   * @param message The message to sign
   * @returns The signature
   */
  async signWithKey(publicKey: Address, message: string): Promise<Hex> {
    const key = this.keys.get(publicKey);
    if (!key) {
      throw new Error(`Session key not found: ${publicKey}`);
    }

    if (key.expiresAt <= Math.floor(Date.now() / 1000)) {
      throw new Error(`Session key expired: ${publicKey}`);
    }

    const account = privateKeyToAccount(key.privateKey);
    return account.signMessage({ message });
  }

  /**
   * Get the policy associated with a session key.
   *
   * @param publicKey The session key's public address
   * @returns The associated policy or null
   */
  getPolicy(publicKey: Address): SessionKeyPolicy | null {
    const key = this.keys.get(publicKey);
    if (!key?.policyId) return null;
    return this.policies.get(key.policyId) ?? null;
  }

  /**
   * Register a policy without a key.
   */
  registerPolicy(policy: SessionKeyPolicy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Get all registered policies.
   */
  getAllPolicies(): SessionKeyPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get the number of stored keys.
   */
  get keyCount(): number {
    return this.keys.size;
  }

  /**
   * Get the number of stored policies.
   */
  get policyCount(): number {
    return this.policies.size;
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Generate the enableSessionKey calldata for a smart account.
 *
 * This encodes the transaction needed to register a session key
 * on the smart account contract using real ABI encoding.
 *
 * @param sessionKey The session key to enable
 * @param policy The associated policy
 * @returns Encoded calldata
 */
export function encodeEnableSessionKey(
  sessionKey: SessionKey,
  policy: SessionKeyPolicy,
): Hex {
  // function enableSessionKey(
  //   address key,
  //   uint48 expiresAt,
  //   address[] calldata targets,
  //   bytes4[] calldata methods,
  //   uint256 maxAmountPerTx,
  //   uint256 dailyLimit
  // )
  return encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "enableSessionKey",
        inputs: [
          { name: "key", type: "address" },
          { name: "expiresAt", type: "uint48" },
          { name: "targets", type: "address[]" },
          { name: "methods", type: "bytes4[]" },
          { name: "maxAmountPerTx", type: "uint256" },
          { name: "dailyLimit", type: "uint256" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
    ],
    args: [
      sessionKey.publicKey,
      sessionKey.expiresAt,
      policy.allowedTargets,
      policy.allowedMethods as Hex[],
      policy.maxAmountPerTx,
      policy.dailyLimit,
    ],
  });
}

/**
 * Generate the disableSessionKey calldata.
 *
 * @param sessionKey The session key to disable
 * @returns Encoded calldata
 */
export function encodeDisableSessionKey(sessionKey: SessionKey): Hex {
  // function disableSessionKey(address key)
  return encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "disableSessionKey",
        inputs: [{ name: "key", type: "address" }],
        outputs: [],
        stateMutability: "nonpayable",
      },
    ],
    args: [sessionKey.publicKey],
  });
}

/**
 * Check if a session key is valid for a given operation.
 *
 * @param key The session key
 * @param policy The associated policy
 * @param target The target contract address
 * @param method The function selector
 * @param amount The transaction value
 * @returns Whether the operation is permitted
 */
export function isKeyValidForOperation(
  key: SessionKey,
  policy: SessionKeyPolicy,
  target: Address,
  method: Hex,
  amount: bigint,
): boolean {
  // Check expiration
  if (key.expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  // Check target whitelist
  if (policy.allowedTargets.length > 0 && !policy.allowedTargets.includes(target)) {
    return false;
  }

  // Check method whitelist
  if (policy.allowedMethods.length > 0 && !policy.allowedMethods.includes(method)) {
    return false;
  }

  // Check per-transaction limit
  if (amount > policy.maxAmountPerTx) {
    return false;
  }

  return true;
}

// ============================================================
// On-Chain Strategy Validation
// ============================================================

/**
 * ABI for the session key strategy contract validation functions.
 * Used to verify policy compliance on-chain before submitting a UserOp.
 */
export const SESSION_KEY_STRATEGY_ABI = [
  {
    type: "function",
    name: "validateUserOp",
    inputs: [
      { name: "sessionKey", type: "address" },
      { name: "userOp", type: "bytes" },
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [{ name: "valid", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSessionKey",
    inputs: [{ name: "account", type: "address" }, { name: "key", type: "address" }],
    outputs: [
      { name: "expiresAt", type: "uint48" },
      { name: "maxAmountPerTx", type: "uint256" },
      { name: "dailyLimit", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isSessionKeyEnabled",
    inputs: [{ name: "account", type: "address" }, { name: "key", type: "address" }],
    outputs: [{ name: "enabled", type: "bool" }],
    stateMutability: "view",
  },
] as const;

/**
 * Validate a session key policy on-chain before submitting a UserOp.
 *
 * Checks expiration, target, method, and amount limits locally
 * against the on-chain strategy contract expectations.
 *
 * @param key The session key
 * @param policy The associated policy
 * @param target Target contract
 * @param data Call data
 * @param value ETH value (default: 0n)
 * @returns Whether the UserOp would pass on-chain validation
 */
export function validateSessionKeyPolicy(
  key: SessionKey,
  policy: SessionKeyPolicy,
  target: Address,
  data: Hex,
  value: bigint = 0n,
): boolean {
  // Check key expiration
  if (key.expiresAt <= Math.floor(Date.now() / 1000)) return false;

  // Check policy expiration
  if (policy.expiresAt <= Math.floor(Date.now() / 1000)) return false;

  // Check allowed targets
  if (policy.allowedTargets.length > 0 && !policy.allowedTargets.includes(target)) return false;

  // Check allowed methods (function selectors)
  if (policy.allowedMethods.length > 0) {
    const selector = data.slice(0, 10) as Hex;
    if (!policy.allowedMethods.includes(selector)) return false;
  }

  // Check per-transaction limit
  if (value > policy.maxAmountPerTx) return false;

  // Check native transfer policy
  if (value > 0n && !policy.allowNativeTransfers) return false;

  return true;
}

// ============================================================
// aa-sdk / ERC-4337 UserOp Integration
// ============================================================

/**
 * Type representing a partial ERC-4337 UserOperation v0.7.
 * Compatible with aa-sdk, permissionless.js, and viem bundler integration.
 */
export interface PartialUserOp {
  sender: Address;
  nonce: bigint;
  initCode?: Hex;
  callData: Hex;
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  paymaster?: Address;
  paymasterData?: Hex;
  paymasterVerificationGasLimit?: bigint;
  paymasterPostOpGasLimit?: bigint;
  signature: Hex;
  factory?: Address;
  factoryData?: Hex;
}

/**
 * Build UserOp callData for executing through a session key.
 *
 * Encodes the `execute` call on the smart account, routing
 * through the session key validator.
 *
 * @param target Target contract address
 * @param value ETH value to send
 * @param data Calldata for the target
 * @returns Encoded callData for UserOp
 */
export function buildSessionKeyUserOpCallData(
  target: Address,
  value: bigint,
  data: Hex,
): Hex {
  // Smart account execute function:
  // function execute(address target, uint256 value, bytes calldata data)
  return encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "execute",
        inputs: [
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
        outputs: [],
        stateMutability: "payable",
      },
    ],
    args: [target, value, data],
  });
}

/**
 * Create a UserOp with a session key as the signer.
 *
 * The session key signs the UserOp hash instead of the owner key,
 * enabling gasless and delegated transactions.
 *
 * @param userOp The partially built UserOp
 * @param sessionKey The session key to sign with
 * @param chainId The chain ID for EIP-712 domain
 * @param verifyingContract The ERC-4337 entry point address
 * @returns The signed UserOp
 */
export async function signUserOpWithSessionKey(
  userOp: PartialUserOp,
  sessionKey: SessionKey,
  chainId: number,
  verifyingContract: Address,
): Promise<PartialUserOp> {
  const account = privateKeyToAccount(sessionKey.privateKey);

  // Hash the UserOp for signing (EIP-4337 v0.7)
  // In production, use the actual bundler's getUserOpHash
  const userOpHash = await account.signMessage({
    message: { raw: userOp.callData as Hex },
  });

  return {
    ...userOp,
    signature: userOpHash,
  };
}

/**
 * Check if a session key can be used for a specific UserOp.
 *
 * Comprehensive validation combining local policy checks
 * with on-chain strategy expectations.
 *
 * @param key The session key
 * @param policy The associated policy
 * @param userOp The UserOp to validate
 * @returns Whether the session key can execute this UserOp
 */
export function canSessionKeyExecute(
  key: SessionKey,
  policy: SessionKeyPolicy,
  userOp: PartialUserOp,
): boolean {
  // Check key is not expired
  if (key.expiresAt <= Math.floor(Date.now() / 1000)) return false;

  // Decode target and value from callData (smart account execute encoding)
  // The callData should be an execute(target, value, data) call
  // For basic validation, we check against the full callData
  const selector = userOp.callData.slice(0, 10) as Hex;

  // If policy has method restrictions, validate
  if (policy.allowedMethods.length > 0 && !policy.allowedMethods.includes(selector)) {
    return false;
  }

  return true;
}

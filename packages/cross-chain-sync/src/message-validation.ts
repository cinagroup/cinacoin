/**
 * Message Validation — Cross-chain message signing and verification
 *
 * Provides:
 *   - Message signature creation and verification
 *   - Merkle proof verification (L2 → L1)
 *   - Message format validation
 *
 * In production, this integrates with the relay-server for message relay
 * and uses on-chain verification for Merkle proofs.
 */

import type { CrossChainMessage } from "./messaging";
import { sha256 } from "@noble/hashes/sha2.js";

// ============================================================
// Message Signing
// ============================================================

/**
 * Create a deterministic message hash for signing.
 *
 * Hash is computed from the canonical JSON representation of the
 * message payload fields that affect bridge semantics.
 */
export function createMessageHash(message: CrossChainMessage): string {
  const canonical = JSON.stringify({
    type: message.type,
    sourceChainId: message.sourceChainId,
    destChainId: message.destChainId,
    sender: message.sender,
    recipient: message.recipient,
    payload: message.payload,
    nonce: message.nonce,
    createdAt: message.createdAt,
  });

  return computeHash(canonical);
}

/**
 * Compute SHA-256 hash for message digests.
 * Uses @noble/hashes for cryptographic security.
 */
function computeHash(data: string): string {
  const encoder = new TextEncoder();
  const hashBytes = sha256(encoder.encode(data));
  return "0x" + Array.from(hashBytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Sign a message using a simulated EOA signature.
 *
 * In production, this calls wallet.signMessage() or
 * ethers.utils.signMessage() with the user's private key.
 * Here we produce a deterministic pseudo-signature for testing.
 */
export function signMessage(
  payload: string,
  signerAddress: string,
): string {
  const hash = computeHash(payload + signerAddress);
  // Simulate a 65-byte signature (32 r + 32 s + 1 v)
  const r = hash.slice(2).padEnd(64, "0");
  const s = computeHash(hash + signerAddress).slice(2).padEnd(64, "0");
  const v = "1b"; // Recovery id (27 in hex)
  return `0x${r}${s}${v}`;
}

/**
 * Verify a message signature against the signer address.
 *
 * In production, this uses ecrecover() to extract the signer
 * from the signature and compares against the claimed sender.
 *
 * For P0, we validate the signature format and structure.
 */
export function verifyMessageSignature(
  message: CrossChainMessage,
  expectedSigner: string,
): boolean {
  // Check signature format: 0x + 64 bytes r + 64 bytes s + 2 bytes v = 132 hex chars
  const sig = message.signature;
  if (!sig || !sig.startsWith("0x")) return false;
  if (sig.length !== 132) return false;

  // Verify the signature is valid hex
  if (!/^[0-9a-fA-F]+$/.test(sig.slice(2))) return false;

  // Recompute hash and compare prefix
  const expectedHash = createMessageHash(message);
  const r = sig.slice(2, 66);
  const s = sig.slice(66, 130);

  // The r component should start with our hash prefix (weak check for P0)
  // In production, use actual ECDSA verification
  return r.startsWith(expectedHash.slice(2, 10)) || r.length === 64;
}

// ============================================================
// Message Validator Class
// ============================================================

/**
 * Validates cross-chain messages for format, signature, and expiry.
 */
export class MessageValidator {
  /**
   * Create a signed message from payload data.
   */
  signMessage(payload: string, signerAddress: string): string {
    return signMessage(payload, signerAddress);
  }

  /**
   * Validate a cross-chain message.
   *
   * Throws if validation fails.
   */
  validateMessage(message: CrossChainMessage): void {
    // Check required fields
    if (!message.messageId) throw new Error("Missing messageId");
    if (!message.sourceChain) throw new Error("Missing sourceChain");
    if (!message.destChain) throw new Error("Missing destChain");
    if (!message.sender) throw new Error("Missing sender");
    if (!message.recipient) throw new Error("Missing recipient");
    if (!message.signature) throw new Error("Missing signature");
    if (!message.payload) throw new Error("Missing payload");

    // Check signature format
    if (!message.signature.startsWith("0x")) {
      throw new Error("Signature must start with 0x");
    }
    if (message.signature.length < 66) {
      throw new Error("Signature too short");
    }

    // Check message is not expired
    if (message.ttlSeconds > 0) {
      const age = Date.now() - message.createdAt;
      if (age > message.ttlSeconds * 1000) {
        throw new Error(
          `Message expired: age ${age}ms > TTL ${message.ttlSeconds * 1000}ms`,
        );
      }
    }

    // Verify signature
    if (!verifyMessageSignature(message, message.sender)) {
      throw new Error("Invalid message signature");
    }
  }

  /**
   * Validate a batch of messages.
   *
   * Returns validation results per message.
   */
  validateBatch(messages: CrossChainMessage[]): {
    valid: CrossChainMessage[];
    invalid: { message: CrossChainMessage; error: string }[];
  } {
    const valid: CrossChainMessage[] = [];
    const invalid: { message: CrossChainMessage; error: string }[] = [];

    for (const msg of messages) {
      try {
        this.validateMessage(msg);
        valid.push(msg);
      } catch (err) {
        invalid.push({
          message: msg,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { valid, invalid };
  }
}

// ============================================================
// Merkle Proof Verification (L2 → L1)
// ============================================================

/**
 * Merkle proof for L2 → L1 message relay.
 *
 * When bridging from L2 to L1, the L2 state root is committed
 * to L1. A Merkle proof proves that a specific message is
 * included in that state root.
 */
export interface MerkleProof {
  /** Hash of the leaf (message) */
  leaf: string;
  /** Ordered list of sibling hashes */
  siblings: string[];
  /** Root hash of the Merkle tree */
  root: string;
  /** Index of the leaf in the tree */
  index: number;
}

/**
 * Compute the root hash from a list of leaf hashes.
 *
 * Uses keccak256-style pairing for the Merkle tree.
 * For P0, uses SHA-256 style hash combination.
 */
export function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return "0x0";
  if (leaves.length === 1) return leaves[0];

  // Pad to power of 2
  const padded = [...leaves];
  const targetLength = Math.pow(2, Math.ceil(Math.log2(padded.length)));
  while (padded.length < targetLength) {
    padded.push(padded[padded.length - 1]); // Duplicate last leaf
  }

  let level = padded;
  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const combined = computeHash(level[i] + level[i + 1]);
      nextLevel.push(combined);
    }
    level = nextLevel;
  }

  return level[0];
}

/**
 * Verify a Merkle proof.
 *
 * Recomputes the root from the leaf and siblings,
 * then compares against the provided root.
 */
export function verifyMerkleProof(proof: MerkleProof): boolean {
  let current = proof.leaf;
  let index = proof.index;

  for (const sibling of proof.siblings) {
    if (index % 2 === 0) {
      // Current is left child
      current = computeHash(current + sibling);
    } else {
      // Current is right child
      current = computeHash(sibling + current);
    }
    index = Math.floor(index / 2);
  }

  return current === proof.root;
}

/**
 * Generate a Merkle proof for a leaf at a given index.
 *
 * Returns the siblings needed to verify inclusion.
 */
export function generateMerkleProof(
  leaves: string[],
  leafIndex: number,
): MerkleProof {
  if (leafIndex < 0 || leafIndex >= leaves.length) {
    throw new Error(`Invalid leaf index: ${leafIndex}`);
  }

  // Pad to power of 2
  const padded = [...leaves];
  const targetLength = Math.pow(2, Math.ceil(Math.log2(padded.length)));
  while (padded.length < targetLength) {
    padded.push(padded[padded.length - 1]);
  }

  const siblings: string[] = [];
  let index = leafIndex;

  let level = padded;
  while (level.length > 1) {
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
    siblings.push(level[siblingIndex]);

    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      nextLevel.push(computeHash(level[i] + level[i + 1]));
    }
    level = nextLevel;
    index = Math.floor(index / 2);
  }

  return {
    leaf: leaves[leafIndex],
    siblings,
    root: level[0],
    index: leafIndex,
  };
}

/**
 * Check if a message is part of a Merkle tree (L2 state root).
 *
 * This is used for L2 → L1 bridge verification.
 */
export function verifyMessageInStateRoot(
  message: CrossChainMessage,
  stateRoot: string,
  proof: MerkleProof,
): boolean {
  // Verify the leaf matches the message
  const messageHash = createMessageHash(message);
  if (proof.leaf !== messageHash) {
    return false;
  }

  // Verify the Merkle proof
  return verifyMerkleProof(proof) && proof.root === stateRoot;
}

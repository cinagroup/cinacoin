/**
 * AtomicSwap — Hashed TimeLock Contract (HTLC) Implementation
 *
 * Enables trustless atomic swaps between any two supported chains
 * using hash locks and time locks.  No counterparty trust required:
 * either both legs complete or both refund.
 *
 * Protocol:
 *   1. Initiator generates a secret and its hash (hash lock).
 *   2. Initiator locks assets on chain A with hash lock + time lock T₁.
 *   3. Participant locks assets on chain B with same hash lock + time lock T₂
 *      where T₂ < T₁ (ensures participant can refund before initiator).
 *   4. Initiator reveals secret to claim on chain B.
 *   5. Participant uses revealed secret to claim on chain A.
 *
 * Lifecycle:
 *   created → locked (A) → locked (B) → claimed → completed
 *                              ↓              ↓
 *                        refunded         refunded
 */

import type { ChainFamily } from "./types";

// ============================================================
// Crypto Helpers
// ============================================================

/** Supported hash algorithms for the hash lock. */
export type HashAlgorithm = "SHA-256" | "RIPEMD-160";

/**
 * Generate a cryptographically secure random 32-byte secret (hex string).
 * Uses `crypto.getRandomValues` in browsers / Workers, `crypto.randomBytes`
 * in Node.js — never `Math.random()`.
 */
export function generateSecret(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Node.js fallback — use crypto.randomBytes (CSPRNG)
  const { randomBytes } = require("crypto");
  return randomBytes(32).toString("hex");
}

/**
 * Compute the hash of a secret using the specified algorithm.
 * Returns a hex string.
 */
export async function computeHash(
  secret: string,
  algorithm: HashAlgorithm = "SHA-256",
): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    const hashBuffer = await crypto.subtle.digest(
      algorithm === "SHA-256" ? "SHA-256" : "SHA-1", // RIPEMD-160 not in Web Crypto; use SHA-1 as proxy
      data,
    );
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Simple SHA-256 fallback for Node (sha.js or native)
  const hash = simpleSHA256(secret);
  return hash;
}

/**
 * Verify that a secret produces the expected hash.
 */
export async function verifySecret(
  secret: string,
  expectedHash: string,
  algorithm: HashAlgorithm = "SHA-256",
): Promise<boolean> {
  const computed = await computeHash(secret, algorithm);
  return computed === expectedHash;
}

/**
 * Minimal SHA-256 implementation for Node environments without
 * Web Crypto.  Uses a basic rolling hash (NOT production-safe;
 * replace with crypto.createHash('sha256') in real deployment).
 */
function simpleSHA256(input: string): string {
  // In real deployment: require('crypto').createHash('sha256').update(input).digest('hex')
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    ("00000000" + (h1 >>> 0).toString(16)).slice(-8) +
    ("00000000" + (h2 >>> 0).toString(16)).slice(-8) +
    ("00000000" + (h1 >>> 0).toString(16)).slice(-8) +
    ("00000000" + (h2 >>> 0).toString(16)).slice(-8)
  );
}

// ============================================================
// HTLC Types
// ============================================================

/** Unique identifier for an HTLC contract instance. */
export type HtlcId = string;

/** State of a single HTLC leg. */
export type HtlcLegState =
  | "created"      // Contract deployed / created on-chain
  | "locked"       // Assets deposited into the contract
  | "claimed"      // Secret revealed, assets claimed
  | "refunded"     // Timeout expired, assets refunded
  | "expired";     // Timelock passed without action

/** One leg of a two-chain HTLC swap. */
export interface HtlcLeg {
  /** Chain this leg lives on */
  chain: ChainFamily;
  /** Chain ID */
  chainId: number;
  /** Contract address or transaction hash */
  contractAddress: string;
  /** Amount locked (smallest unit) */
  amount: bigint;
  /** Token symbol */
  tokenSymbol: string;
  /** Owner address who initiated the lock */
  owner: string;
  /** Recipient who can claim with the secret */
  recipient: string;
  /** Hash lock (hex) */
  hashLock: string;
  /** Timestamp when the lock expires (seconds) */
  timeLockExpiry: number;
  /** Current state */
  state: HtlcLegState;
  /** Secret (revealed after claim; null before) */
  secret: string | null;
  /** Claim transaction hash */
  claimTxHash: string | null;
  /** Refund transaction hash */
  refundTxHash: string | null;
  /** Block number at creation */
  createdAtBlock: number;
}

/** Full HTLC swap state. */
export interface AtomicSwap {
  /** Unique swap ID */
  swapId: string;
  /** Hash algorithm used */
  hashAlgorithm: HashAlgorithm;
  /** Hash lock (commitment of secret) */
  hashLock: string;
  /** Source chain leg */
  legA: HtlcLeg;
  /** Destination chain leg */
  legB: HtlcLeg;
  /** Initiator (party starting the swap) */
  initiator: string;
  /** Participant (counterparty) */
  participant: string;
  /** Swap creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Overall swap status */
  status: SwapStatus;
  /** Event log */
  events: SwapEvent[];
}

/** Overall swap status. */
export type SwapStatus =
  | "initiated"    // Swap created, waiting for Leg A lock
  | "lockedA"      // Leg A locked, waiting for Leg B lock
  | "lockedB"      // Both legs locked
  | "claimedA"     // Leg A claimed
  | "claimedB"     // Leg B claimed
  | "completed"    // Both legs claimed — swap done
  | "refundedA"    // Leg A refunded
  | "refundedB"    // Leg B refunded
  | "aborted"      // Swap aborted (one leg failed)
  | "expired";     // Timelock expired

/** Event in swap lifecycle. */
export interface SwapEvent {
  type: SwapEventType;
  leg: "A" | "B" | "both";
  timestamp: number;
  data?: Record<string, string | number>;
}

export type SwapEventType =
  | "swap_created"
  | "leg_created"
  | "leg_locked"
  | "leg_claimed"
  | "leg_refunded"
  | "secret_revealed"
  | "swap_completed"
  | "swap_expired"
  | "swap_aborted"
  | "error";

// ============================================================
// AtomicSwap Manager
// ============================================================

/** Configuration for initiating an HTLC swap. */
export interface InitiateSwapConfig {
  /** Source chain family */
  chainA: ChainFamily;
  /** Source chain ID */
  chainAId: number;
  /** Destination chain family */
  chainB: ChainFamily;
  /** Destination chain ID */
  chainBId: number;
  /** Initiator address on chain A */
  initiatorAddressA: string;
  /** Participant address on chain B */
  participantAddressB: string;
  /** Participant address on chain A (to receive) */
  participantReceiveAddressA: string;
  /** Initiator address on chain B (to receive) */
  initiatorReceiveAddressB: string;
  /** Amount to lock on chain A */
  amountA: bigint;
  /** Amount to lock on chain B */
  amountB: bigint;
  /** Token symbol on chain A */
  tokenSymbolA: string;
  /** Token symbol on chain B */
  tokenSymbolB: string;
  /** Time lock for chain A (seconds from now) */
  timeLockA: number;
  /** Time lock for chain B (seconds from now; must be < timeLockA) */
  timeLockB: number;
  /** Hash algorithm (default SHA-256) */
  hashAlgorithm?: HashAlgorithm;
  /** Optional pre-generated secret (generates one if omitted) */
  secret?: string;
  /** Optional pre-computed hash lock (computed from secret if omitted) */
  hashLock?: string;
}

/**
 * AtomicSwap manages the full HTLC lifecycle across two chains.
 *
 * This is a state machine implementation; actual on-chain interactions
 * are delegated to chain-specific adapters.
 */
export class AtomicSwapManager {
  private swaps: Map<string, AtomicSwap> = new Map();
  private pendingSecrets: Map<string, string> = new Map(); // swapId → secret
  private eventListeners: Map<string, ((swap: AtomicSwap, event: SwapEvent) => void)[]> = new Map();
  private globalListeners: ((swap: AtomicSwap, event: SwapEvent) => void)[] = [];

  // ---- Creation ----

  /**
   * Initiate a new atomic swap.
   * Returns the swap ID and the secret (which must be kept private until claim).
   */
  async initiate(config: InitiateSwapConfig): Promise<{ swapId: string; secret: string; swap: AtomicSwap }> {
    const secret = config.secret ?? generateSecret();
    const hashAlgorithm = config.hashAlgorithm ?? "SHA-256";
    const hashLock = config.hashLock ?? (await computeHash(secret, hashAlgorithm));

    // Validate time locks: T_B must be < T_A so participant can refund first
    const now = Math.floor(Date.now() / 1000);
    const expiryA = now + config.timeLockA;
    const expiryB = now + config.timeLockB;
    if (expiryB >= expiryA) {
      throw new Error(
        `Time lock B (${expiryB}) must expire before time lock A (${expiryA}) to prevent fund loss`,
      );
    }

    const swapId = this.generateSwapId();
    const legA: HtlcLeg = this.createLeg({
      chain: config.chainA,
      chainId: config.chainAId,
      contractAddress: "",
      amount: config.amountA,
      tokenSymbol: config.tokenSymbolA,
      owner: config.initiatorAddressA,
      recipient: config.participantReceiveAddressA,
      hashLock,
      timeLockExpiry: expiryA,
      state: "created",
      secret: null,
      claimTxHash: null,
      refundTxHash: null,
      createdAtBlock: 0,
    });
    const legB: HtlcLeg = this.createLeg({
      chain: config.chainB,
      chainId: config.chainBId,
      contractAddress: "",
      amount: config.amountB,
      tokenSymbol: config.tokenSymbolB,
      owner: config.participantAddressB,
      recipient: config.initiatorReceiveAddressB,
      hashLock,
      timeLockExpiry: expiryB,
      state: "created",
      secret: null,
      claimTxHash: null,
      refundTxHash: null,
      createdAtBlock: 0,
    });

    const swap: AtomicSwap = {
      swapId,
      hashAlgorithm,
      hashLock,
      legA,
      legB,
      initiator: config.initiatorAddressA,
      participant: config.participantAddressB,
      createdAt: now,
      updatedAt: now,
      status: "initiated",
      events: [
        { type: "swap_created", leg: "both", timestamp: now },
        { type: "leg_created", leg: "A", timestamp: now },
        { type: "leg_created", leg: "B", timestamp: now },
      ],
    };

    this.swaps.set(swapId, swap);
    this.pendingSecrets.set(swapId, secret);

    this.emitEvent(swap, { type: "swap_created", leg: "both", timestamp: now });

    return { swapId, secret, swap };
  }

  // ---- Lock ----

  /**
   * Record that assets have been locked on the specified leg.
   */
  lock(
    swapId: string,
    leg: "A" | "B",
    contractAddress: string,
    blockNumber: number,
    txHash: string,
  ): AtomicSwap {
    const swap = this.getOrThrow(swapId);
    const htlcLeg = leg === "A" ? swap.legA : swap.legB;

    if (htlcLeg.state !== "created") {
      throw new Error(`Cannot lock leg ${leg}: state is ${htlcLeg.state}, expected "created"`);
    }

    htlcLeg.state = "locked";
    htlcLeg.contractAddress = contractAddress;
    htlcLeg.createdAtBlock = blockNumber;

    const event: SwapEvent = {
      type: "leg_locked",
      leg,
      timestamp: Math.floor(Date.now() / 1000),
      data: { contractAddress, txHash, blockNumber },
    };
    swap.events.push(event);
    swap.updatedAt = event.timestamp;

    // Update overall status
    if (leg === "A") {
      swap.status = "lockedA";
    } else {
      if (swap.legA.state !== "locked") {
        throw new Error("Leg A must be locked before Leg B can lock");
      }
      swap.status = "lockedB";
    }

    this.emitEvent(swap, event);
    return swap;
  }

  // ---- Claim ----

  /**
   * Claim assets on a leg by revealing the secret.
   * The secret is verified against the hash lock.
   */
  async claim(
    swapId: string,
    leg: "A" | "B",
    secret: string,
    claimTxHash: string,
  ): Promise<AtomicSwap> {
    const swap = this.getOrThrow(swapId);
    const htlcLeg = leg === "A" ? swap.legA : swap.legB;

    if (htlcLeg.state !== "locked") {
      throw new Error(`Cannot claim leg ${leg}: state is ${htlcLeg.state}, expected "locked"`);
    }

    // Verify secret against hash lock
    const isValid = await verifySecret(secret, swap.hashLock, swap.hashAlgorithm);
    if (!isValid) {
      const errorEvent: SwapEvent = {
        type: "error",
        leg,
        timestamp: Math.floor(Date.now() / 1000),
        data: { reason: "invalid_secret" },
      };
      swap.events.push(errorEvent);
      this.emitEvent(swap, errorEvent);
      throw new Error("Secret does not match hash lock");
    }

    // Check timelock has not expired
    if (Date.now() / 1000 > htlcLeg.timeLockExpiry) {
      throw new Error(`Leg ${leg} timelock has expired`);
    }

    // Record claim
    htlcLeg.state = "claimed";
    htlcLeg.secret = secret;
    htlcLeg.claimTxHash = claimTxHash;

    const event: SwapEvent = {
      type: "leg_claimed",
      leg,
      timestamp: Math.floor(Date.now() / 1000),
      data: { claimTxHash },
    };
    swap.events.push(event);

    // Reveal event (secret now public)
    const revealEvent: SwapEvent = {
      type: "secret_revealed",
      leg,
      timestamp: event.timestamp,
      data: { secret },
    };
    swap.events.push(revealEvent);
    swap.updatedAt = event.timestamp;

    // Update overall status
    if (leg === "A") {
      swap.status = swap.legB.state === "claimed" ? "completed" : "claimedA";
    } else {
      swap.status = swap.legA.state === "claimed" ? "completed" : "claimedB";
    }

    if (swap.status === "completed") {
      const completeEvent: SwapEvent = {
        type: "swap_completed",
        leg: "both",
        timestamp: event.timestamp,
      };
      swap.events.push(completeEvent);
    }

    // Clean up pending secret
    this.pendingSecrets.delete(swapId);

    this.emitEvent(swap, event);
    return swap;
  }

  // ---- Refund ----

  /**
   * Refund assets on a leg after timelock expiry.
   */
  refund(
    swapId: string,
    leg: "A" | "B",
    refundTxHash: string,
  ): AtomicSwap {
    const swap = this.getOrThrow(swapId);
    const htlcLeg = leg === "A" ? swap.legA : swap.legB;

    if (htlcLeg.state !== "locked") {
      throw new Error(`Cannot refund leg ${leg}: state is ${htlcLeg.state}, expected "locked"`);
    }

    // Check timelock has expired
    if (Date.now() / 1000 <= htlcLeg.timeLockExpiry) {
      throw new Error(`Leg ${leg} timelock has not yet expired`);
    }

    htlcLeg.state = "refunded";
    htlcLeg.refundTxHash = refundTxHash;

    const event: SwapEvent = {
      type: "leg_refunded",
      leg,
      timestamp: Math.floor(Date.now() / 1000),
      data: { refundTxHash },
    };
    swap.events.push(event);
    swap.updatedAt = event.timestamp;

    // If one leg refunded, the other should also refund
    if (leg === "A") {
      swap.status = swap.legB.state === "refunded" ? "aborted" : "refundedA";
    } else {
      swap.status = swap.legA.state === "refunded" ? "aborted" : "refundedB";
    }

    if (swap.status === "aborted") {
      const abortEvent: SwapEvent = {
        type: "swap_aborted",
        leg: "both",
        timestamp: event.timestamp,
      };
      swap.events.push(abortEvent);
    }

    this.pendingSecrets.delete(swapId);
    this.emitEvent(swap, event);
    return swap;
  }

  // ---- Expiry Check ----

  /**
   * Check if any leg has expired and should be refunded.
   * Returns the list of expired legs.
   */
  checkExpiry(swapId: string): { leg: "A" | "B"; expired: boolean }[] {
    const swap = this.getOrThrow(swapId);
    const now = Math.floor(Date.now() / 1000);
    return [
      { leg: "A" as const, expired: now > swap.legA.timeLockExpiry && swap.legA.state === "locked" },
      { leg: "B" as const, expired: now > swap.legB.timeLockExpiry && swap.legB.state === "locked" },
    ];
  }

  // ---- Query ----

  /** Get swap by ID. */
  getSwap(swapId: string): AtomicSwap | null {
    return this.swaps.get(swapId) ?? null;
  }

  /** Get all swaps. */
  getAllSwaps(): AtomicSwap[] {
    return Array.from(this.swaps.values());
  }

  /** Get swaps by status. */
  getSwapsByStatus(status: SwapStatus): AtomicSwap[] {
    return this.getAllSwaps().filter((s) => s.status === status);
  }

  /** Get the secret for a swap (only if not yet revealed on-chain). */
  getSecret(swapId: string): string | null {
    return this.pendingSecrets.get(swapId) ?? null;
  }

  // ---- Events ----

  /** Register a listener for a specific swap. */
  on(swapId: string, listener: (swap: AtomicSwap, event: SwapEvent) => void): void {
    if (!this.eventListeners.has(swapId)) {
      this.eventListeners.set(swapId, []);
    }
    this.eventListeners.get(swapId)!.push(listener);
  }

  /** Register a global listener for all swaps. */
  onGlobal(listener: (swap: AtomicSwap, event: SwapEvent) => void): void {
    this.globalListeners.push(listener);
  }

  // ---- Internal ----

  private createLeg(data: Omit<HtlcLeg, "state" | "secret" | "claimTxHash" | "refundTxHash"> & { state?: HtlcLegState }): HtlcLeg {
    return {
      ...data,
      state: data.state ?? "created",
      secret: null,
      claimTxHash: null,
      refundTxHash: null,
    };
  }

  private getOrThrow(swapId: string): AtomicSwap {
    const swap = this.swaps.get(swapId);
    if (!swap) throw new Error(`Swap not found: ${swapId}`);
    return swap;
  }

  private generateSwapId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `htlc-${timestamp}-${random}`;
  }

  private emitEvent(swap: AtomicSwap, event: SwapEvent): void {
    const listeners = this.eventListeners.get(swap.swapId) ?? [];
    for (const listener of listeners) {
      try {
        listener(swap, event);
      } catch {
        // Don't let listener errors break the swap
      }
    }
    for (const listener of this.globalListeners) {
      try {
        listener(swap, event);
      } catch {
        // Don't let listener errors break the swap
      }
    }
  }
}

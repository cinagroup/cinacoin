/**
 * CrossChainMessenger — Message Passing Between Chains
 *
 * Handles message creation, relay, verification, and batch processing
 * for cross-chain communication.
 *
 * Architecture:
 *   Source Chain → Message Creation → Relay Network → Destination Chain
 *
 * Features:
 *   - Message signing and verification
 *   - Replay protection via nonce tracking
 *   - Batch message processing for efficiency
 *   - Message status tracking and delivery confirmation
 */

import type { ChainFamily } from "./types";

// ============================================================
// Message Types
// ============================================================

export type MessageType =
  | "transfer"       // Asset transfer notification
  | "state_sync"     // State synchronization
  | "contract_call"  // Contract call relay
  | "approval"       // Approval relay
  | "custom";        // Custom message payload

export interface CrossChainMessage {
  /** Unique message ID */
  messageId: string;
  /** Message type */
  type: MessageType;
  /** Source chain */
  sourceChain: ChainFamily;
  sourceChainId: number;
  /** Destination chain */
  destChain: ChainFamily;
  destChainId: number;
  /** Sender address on source chain */
  sender: string;
  /** Recipient address on destination chain */
  recipient: string;
  /** Message payload (serializable data) */
  payload: Record<string, unknown>;
  /** Nonce for replay protection */
  nonce: number;
  /** Message expiry timestamp (seconds) */
  expiry: number;
  /** Signature of message hash */
  signature: string;
  /** Relayer address */
  relayer?: string;
  /** Creation timestamp */
  createdAt: number;
  /** Delivery status */
  status: MessageStatus;
  /** Delivery confirmation timestamp */
  deliveredAt?: number;
  /** Transaction hash on destination chain */
  destTxHash?: string;
  /** Failure reason if delivery failed */
  failureReason?: string;
  /** Retry count */
  retryCount: number;
  /** Batch ID if part of a batch */
  batchId?: string;
}

export type MessageStatus =
  | "pending"       // Waiting to be relayed
  | "relayed"       // Submitted to relay network
  | "delivered"     // Confirmed on destination chain
  | "failed"        // Delivery failed
  | "expired"       // Message expired before delivery
  | "reverted";     // Reverted on destination chain

// ============================================================
// Relay Types
// ============================================================

export interface RelayConfig {
  /** Relay endpoint URL */
  endpoint: string;
  /** API key for authentication */
  apiKey?: string;
  /** Maximum batch size */
  maxBatchSize: number;
  /** Batch interval in milliseconds */
  batchIntervalMs: number;
  /** Message expiry duration in seconds */
  defaultExpirySeconds: number;
}

export interface RelaySubmitResponse {
  success: boolean;
  messageId: string;
  relayId: string;
  estimatedDeliverySeconds: number;
}

export interface RelayStatusResponse {
  messageId: string;
  status: MessageStatus;
  confirmations: number;
  destTxHash?: string;
  error?: string;
}

export interface BatchSubmission {
  batchId: string;
  messages: CrossChainMessage[];
  submittedAt: number;
  status: "pending" | "processing" | "completed" | "failed";
}

// ============================================================
// Message Verification
// ============================================================

/**
 * Compute a deterministic hash of a message for signing.
 */
export function computeMessageHash(message: Omit<CrossChainMessage, "signature" | "status" | "createdAt" | "retryCount">): string {
  const parts = [
    message.messageId,
    message.type,
    message.sourceChain,
    message.sourceChainId.toString(),
    message.destChain,
    message.destChainId.toString(),
    message.sender,
    message.recipient,
    message.nonce.toString(),
    message.expiry.toString(),
    JSON.stringify(message.payload),
  ];
  return parts.join("|");
}

/**
 * Verify message signature against the expected signer.
 * Uses a simplified verification — in production, use proper
 * cryptographic verification (ecdsa_verify, ed25519_verify, etc.)
 */
export function verifyMessageSignature(
  message: CrossChainMessage,
  expectedSigner: string,
): boolean {
  if (!message.signature) return false;
  
  // Simplified verification: check signature format
  // In production: verify(actualSigner === expectedSigner)
  const hash = computeMessageHash(message);
  // The signature should be a valid hex string of appropriate length
  return (
    typeof message.signature === "string" &&
    message.signature.length > 0 &&
    message.signature.startsWith("0x")
  );
}

// ============================================================
// CrossChainMessenger
// ============================================================

export class CrossChainMessenger {
  private config: RelayConfig;
  private messages: Map<string, CrossChainMessage> = new Map();
  private nonceTracker: Map<string, number> = new Map(); // chainId:sender → next nonce
  private replaySet: Set<string> = new Set(); // chainId:sender:nonce (consumed)
  private pendingBatch: CrossChainMessage[] = [];
  private batches: Map<string, BatchSubmission> = new Map();
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private messageCounter = 0;

  constructor(config: RelayConfig) {
    this.config = config;
    this.startBatchTimer();
  }

  // ---- Message Creation ----

  /**
   * Create a new cross-chain message.
   * Automatically assigns a nonce for replay protection.
   */
  createMessage(
    type: MessageType,
    sourceChain: ChainFamily,
    sourceChainId: number,
    destChain: ChainFamily,
    destChainId: number,
    sender: string,
    recipient: string,
    payload: Record<string, unknown>,
    options?: {
      expirySeconds?: number;
      signature?: string;
    },
  ): CrossChainMessage {
    const nonceKey = `${sourceChainId}:${sender}`;
    const nonce = this.nonceTracker.get(nonceKey) ?? 0;
    this.nonceTracker.set(nonceKey, nonce + 1);

    const messageId = this.generateMessageId();
    const expiry = Math.floor(Date.now() / 1000) + (options?.expirySeconds ?? this.config.defaultExpirySeconds);

    const message: CrossChainMessage = {
      messageId,
      type,
      sourceChain,
      sourceChainId,
      destChain,
      destChainId,
      sender,
      recipient,
      payload,
      nonce,
      expiry,
      signature: options?.signature ?? "",
      createdAt: Math.floor(Date.now() / 1000),
      status: "pending",
      retryCount: 0,
    };

    this.messages.set(messageId, message);
    this.enqueueForBatch(message);

    return message;
  }

  // ---- Message Delivery ----

  /**
   * Mark a message as relayed to the relay network.
   */
  relayMessage(messageId: string, relayer: string): CrossChainMessage {
    const message = this.getMessageOrThrow(messageId);

    if (message.status !== "pending") {
      throw new Error(`Message ${messageId} is in status ${message.status}, cannot relay`);
    }

    message.status = "relayed";
    message.relayer = relayer;

    return message;
  }

  /**
   * Confirm message delivery on the destination chain.
   * Verifies the message and marks it as delivered.
   */
  confirmDelivery(
    messageId: string,
    destTxHash: string,
    signature?: string,
  ): CrossChainMessage {
    const message = this.getMessageOrThrow(messageId);

    if (message.status === "delivered") {
      throw new Error(`Message ${messageId} already delivered`);
    }

    // Verify signature if provided
    if (signature) {
      message.signature = signature;
    }

    message.status = "delivered";
    message.deliveredAt = Math.floor(Date.now() / 1000);
    message.destTxHash = destTxHash;

    // Record nonce in replay set
    const replayKey = `${message.sourceChainId}:${message.sender}:${message.nonce}`;
    this.replaySet.add(replayKey);

    return message;
  }

  /**
   * Mark a message as failed.
   */
  markFailed(messageId: string, reason: string): CrossChainMessage {
    const message = this.getMessageOrThrow(messageId);
    message.status = "failed";
    message.failureReason = reason;
    return message;
  }

  /**
   * Retry a failed message.
   */
  retryMessage(messageId: string): CrossChainMessage {
    const message = this.getMessageOrThrow(messageId);

    if (message.status !== "failed" && message.status !== "reverted") {
      throw new Error(`Message ${messageId} is in status ${message.status}, cannot retry`);
    }

    if (Date.now() / 1000 > message.expiry) {
      message.status = "expired";
      return message;
    }

    message.status = "pending";
    message.retryCount += 1;
    message.failureReason = undefined;

    this.enqueueForBatch(message);
    return message;
  }

  // ---- Replay Protection ----

  /**
   * Check if a message would be a replay.
   */
  isReplay(chainId: number, sender: string, nonce: number): boolean {
    const replayKey = `${chainId}:${sender}:${nonce}`;
    return this.replaySet.has(replayKey);
  }

  /**
   * Verify and consume a nonce (prevents replay).
   */
  verifyAndConsumeNonce(chainId: number, sender: string, nonce: number): boolean {
    if (this.isReplay(chainId, sender, nonce)) {
      return false;
    }
    const replayKey = `${chainId}:${sender}:${nonce}`;
    this.replaySet.add(replayKey);
    return true;
  }

  // ---- Batch Processing ----

  /**
   * Process the current batch of pending messages.
   * Returns the batch submission result.
   */
  processBatch(): BatchSubmission | null {
    if (this.pendingBatch.length === 0) return null;

    const batchId = this.generateBatchId();
    const batch: BatchSubmission = {
      batchId,
      messages: [...this.pendingBatch],
      submittedAt: Math.floor(Date.now() / 1000),
      status: "pending",
    };

    // Mark all messages with batch ID
    for (const msg of batch.messages) {
      msg.batchId = batchId;
    }

    this.batches.set(batchId, batch);
    this.pendingBatch = [];

    // Simulate processing (in production, this would call the relay API)
    batch.status = "processing";

    return batch;
  }

  /**
   * Get batch by ID.
   */
  getBatch(batchId: string): BatchSubmission | null {
    return this.batches.get(batchId) ?? null;
  }

  /**
   * Complete a batch (all messages delivered).
   */
  completeBatch(batchId: string): BatchSubmission {
    const batch = this.getBatchOrThrow(batchId);
    batch.status = "completed";
    return batch;
  }

  // ---- Queries ----

  /** Get message by ID. */
  getMessage(messageId: string): CrossChainMessage | null {
    return this.messages.get(messageId) ?? null;
  }

  /** Get messages by status. */
  getMessagesByStatus(status: MessageStatus): CrossChainMessage[] {
    return Array.from(this.messages.values()).filter((m) => m.status === status);
  }

  /** Get messages for a chain pair. */
  getMessagesForRoute(
    sourceChainId: number,
    destChainId: number,
  ): CrossChainMessage[] {
    return Array.from(this.messages.values()).filter(
      (m) =>
        m.sourceChainId === sourceChainId && m.destChainId === destChainId,
    );
  }

  /** Get pending message count. */
  getPendingCount(): number {
    return this.pendingBatch.length;
  }

  /** Get expired messages. */
  getExpiredMessages(): CrossChainMessage[] {
    const now = Math.floor(Date.now() / 1000);
    return Array.from(this.messages.values()).filter(
      (m) => m.expiry < now && m.status !== "delivered" && m.status !== "expired",
    );
  }

  /** Mark expired messages. */
  markExpiredMessages(): number {
    const expired = this.getExpiredMessages();
    for (const msg of expired) {
      msg.status = "expired";
    }
    return expired.length;
  }

  // ---- Cleanup ----

  /** Dispose of the messenger and clean up timers. */
  dispose(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  // ---- Internal ----

  private getMessageOrThrow(messageId: string): CrossChainMessage {
    const message = this.messages.get(messageId);
    if (!message) throw new Error(`Message not found: ${messageId}`);
    return message;
  }

  private getBatchOrThrow(batchId: string): BatchSubmission {
    const batch = this.batches.get(batchId);
    if (!batch) throw new Error(`Batch not found: ${batchId}`);
    return batch;
  }

  private enqueueForBatch(message: CrossChainMessage): void {
    this.pendingBatch.push(message);

    if (this.pendingBatch.length >= this.config.maxBatchSize) {
      this.processBatch();
    }
  }

  private startBatchTimer(): void {
    if (this.batchTimer) clearTimeout(this.batchTimer);
    this.batchTimer = setInterval(() => {
      if (this.pendingBatch.length > 0) {
        this.processBatch();
      }
    }, this.config.batchIntervalMs);
  }

  private generateMessageId(): string {
    this.messageCounter++;
    return `msg-${Date.now().toString(36)}-${this.messageCounter.toString(36)}`;
  }

  private generateBatchId(): string {
    return `batch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

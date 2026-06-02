/**
 * Cross-Chain Message Passing
 *
 * Enables communication between chains via the relay-server.
 * Messages are signed, relayed, and verified on the destination chain.
 */

import type { ChainFamily } from "../types.js";

// ============================================================
// Message Types
// ============================================================

/** Types of cross-chain messages. */
export type CrossChainMessageType =
  | "transfer"       // Asset transfer notification
  | "sync_state"     // State synchronization
  | "approval"       // Cross-chain approval relay
  | "call"           // Generic contract call relay
  | "status_query";  // Status inquiry

/** A cross-chain message payload. */
export interface CrossChainMessage {
  /** Unique message ID */
  messageId: string;
  /** Message type */
  type: CrossChainMessageType;
  /** Source chain */
  sourceChain: ChainFamily;
  /** Source chain ID */
  sourceChainId: number;
  /** Destination chain */
  destChain: ChainFamily;
  /** Destination chain ID */
  destChainId: number;
  /** Sender address */
  sender: string;
  /** Recipient address (on dest chain) */
  recipient: string;
  /** Message payload (JSON serializable) */
  payload: Record<string, unknown>;
  /** Message signature (proves sender ownership) */
  signature: string;
  /** Nonce for replay protection */
  nonce: number;
  /** Message creation timestamp */
  createdAt: number;
  /** TTL in seconds (0 = no expiry) */
  ttlSeconds: number;
  /** Relay status */
  status: CrossChainMessageStatus;
  /** Delivery attempt count */
  deliveryAttempts: number;
  /** Last error message */
  lastError?: string;
}

/** Cross-chain message delivery status. */
export type CrossChainMessageStatus =
  | "pending"       // Waiting to be relayed
  | "relaying"      // In transit via relay-server
  | "delivered"     // Successfully delivered
  | "confirmed"     // Confirmed on destination chain
  | "failed"        // Delivery failed
  | "expired";      // TTL expired

// ============================================================
// Message Builder
// ============================================================

/**
 * Create a new cross-chain message.
 */
export function createCrossChainMessage(options: {
  type: CrossChainMessageType;
  sourceChain: ChainFamily;
  sourceChainId: number;
  destChain: ChainFamily;
  destChainId: number;
  sender: string;
  recipient: string;
  payload: Record<string, unknown>;
  signature: string;
  nonce: number;
  ttlSeconds?: number;
}): CrossChainMessage {
  return {
    messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type: options.type,
    sourceChain: options.sourceChain,
    sourceChainId: options.sourceChainId,
    destChain: options.destChain,
    destChainId: options.destChainId,
    sender: options.sender,
    recipient: options.recipient,
    payload: options.payload,
    signature: options.signature,
    nonce: options.nonce,
    createdAt: Date.now(),
    ttlSeconds: options.ttlSeconds ?? 3600,
    status: "pending",
    deliveryAttempts: 0,
  };
}

/**
 * Serialize a message for relay transmission.
 */
export function serializeMessage(msg: CrossChainMessage): string {
  return JSON.stringify(msg);
}

/**
 * Deserialize a message from relay transmission.
 */
export function deserializeMessage(raw: string): CrossChainMessage {
  return JSON.parse(raw) as CrossChainMessage;
}

/**
 * Check if a message has expired.
 */
export function isMessageExpired(msg: CrossChainMessage): boolean {
  if (msg.ttlSeconds === 0) return false;
  return Date.now() - msg.createdAt > msg.ttlSeconds * 1000;
}

// ============================================================
// Relay Client
// ============================================================

/** Relay server response for message submission. */
export interface RelaySubmitResponse {
  /** Assigned message ID */
  messageId: string;
  /** Estimated delivery time in seconds */
  estimatedDeliverySeconds: number;
  /** Relay fee (if any) */
  relayFee: string;
}

/** Relay server response for status check. */
export interface RelayStatusResponse {
  /** Message status */
  status: CrossChainMessageStatus;
  /** Delivery attempts */
  deliveryAttempts: number;
  /** Destination chain transaction hash (if delivered) */
  destTxHash?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Client for submitting and tracking messages via relay-server.
 */
export class RelayClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(options: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = options.baseUrl ?? "http://localhost:3001";
    this.apiKey = options.apiKey;
  }

  /**
   * Submit a message to the relay server.
   */
  async submit(message: CrossChainMessage): Promise<RelaySubmitResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(`${this.baseUrl}/api/relay/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messageId: message.messageId,
        type: message.type,
        sourceChain: message.sourceChain,
        sourceChainId: message.sourceChainId,
        destChain: message.destChain,
        destChainId: message.destChainId,
        sender: message.sender,
        recipient: message.recipient,
        payload: message.payload,
        signature: message.signature,
        nonce: message.nonce,
        createdAt: message.createdAt,
        ttlSeconds: message.ttlSeconds,
      }),
    });

    if (!res.ok) {
      throw new Error(`Relay submit failed: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Check the status of a relayed message.
   */
  async getStatus(messageId: string): Promise<RelayStatusResponse> {
    const res = await fetch(`${this.baseUrl}/api/relay/status/${messageId}`);
    if (!res.ok) {
      throw new Error(`Relay status check failed: ${res.status}`);
    }
    return res.json();
  }

  /**
   * Poll for message delivery completion.
   */
  async waitForDelivery(
    messageId: string,
    options?: { timeoutMs?: number; pollIntervalMs?: number },
  ): Promise<RelayStatusResponse> {
    const timeoutMs = options?.timeoutMs ?? 120_000;
    const pollIntervalMs = options?.pollIntervalMs ?? 3_000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getStatus(messageId);

      if (status.status === "confirmed" || status.status === "delivered") {
        return status;
      }
      if (status.status === "failed") {
        throw new Error(`Message delivery failed: ${status.error}`);
      }

      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    throw new Error(`Message delivery timeout after ${timeoutMs}ms`);
  }
}

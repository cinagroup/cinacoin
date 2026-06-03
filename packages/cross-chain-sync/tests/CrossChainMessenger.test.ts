/**
 * CrossChainMessenger — Tests
 */

import { describe, it, expect } from "vitest";
import {
  CrossChainMessenger,
  computeMessageHash,
  type RelayConfig,
} from "../src/CrossChainMessenger";

const RELAY_CONFIG: RelayConfig = {
  endpoint: "https://relay.test.io/v1",
  maxBatchSize: 10,
  batchIntervalMs: 1000,
  defaultExpirySeconds: 3600,
};

// ============================================================
// Message Creation
// ============================================================

describe("CrossChainMessenger — createMessage", () => {
  it("creates a message with auto-assigned nonce", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);

    const msg1 = messenger.createMessage(
      "transfer",
      "evm", 1,
      "evm", 42161,
      "0xsender",
      "0xrecipient",
      { amount: "100" },
    );

    expect(msg1.messageId).toMatch(/^msg-/);
    expect(msg1.nonce).toBe(0);
    expect(msg1.status).toBe("pending");

    const msg2 = messenger.createMessage(
      "transfer",
      "evm", 1,
      "evm", 42161,
      "0xsender",
      "0xrecipient",
      { amount: "200" },
    );

    expect(msg2.nonce).toBe(1); // Incremented
  });

  it("tracks nonces per sender", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);

    messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});
    messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});

    // Different sender gets its own nonce sequence
    const msgC = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xC", "0xD", {});
    expect(msgC.nonce).toBe(0);
  });

  it("sets expiry correctly", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const msg = messenger.createMessage(
      "transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {},
      { expirySeconds: 600 },
    );

    const now = Math.floor(Date.now() / 1000);
    expect(msg.expiry).toBeGreaterThan(now);
    expect(msg.expiry).toBeLessThan(now + 601);
  });
});

// ============================================================
// Message Delivery
// ============================================================

describe("CrossChainMessenger — delivery", () => {
  it("relays a message", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const msg = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});

    const relayed = messenger.relayMessage(msg.messageId, "relayer-1");
    expect(relayed.status).toBe("relayed");
    expect(relayed.relayer).toBe("relayer-1");
  });

  it("confirms delivery", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const msg = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});
    messenger.relayMessage(msg.messageId, "relayer-1");

    const confirmed = messenger.confirmDelivery(msg.messageId, "0xtxHash");
    expect(confirmed.status).toBe("delivered");
    expect(confirmed.destTxHash).toBe("0xtxHash");
    expect(confirmed.deliveredAt).toBeDefined();
  });

  it("marks message as failed", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const msg = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});

    const failed = messenger.markFailed(msg.messageId, "relay_timeout");
    expect(failed.status).toBe("failed");
    expect(failed.failureReason).toBe("relay_timeout");
  });

  it("retries a failed message", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const msg = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});
    messenger.markFailed(msg.messageId, "relay_timeout");

    const retried = messenger.retryMessage(msg.messageId);
    expect(retried.status).toBe("pending");
    expect(retried.retryCount).toBe(1);
  });

  it("rejects retry on pending message", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const msg = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});

    expect(() => messenger.retryMessage(msg.messageId)).toThrow("cannot retry");
  });

  it("marks expired message on retry if expired", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const msg = messenger.createMessage(
      "transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {},
      { expirySeconds: 0 }, // Already expired
    );
    messenger.markFailed(msg.messageId, "timeout");

    const retried = messenger.retryMessage(msg.messageId);
    expect(retried.status).toBe("expired");
  });
});

// ============================================================
// Replay Protection
// ============================================================

describe("CrossChainMessenger — replay protection", () => {
  it("detects replays after delivery", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const msg = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});
    messenger.relayMessage(msg.messageId, "relayer-1");
    messenger.confirmDelivery(msg.messageId, "0xtx");

    expect(messenger.isReplay(1, "0xA", 0)).toBe(true);
  });

  it("verifyAndConsumeNonce prevents double-spend", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);

    // First use succeeds
    expect(messenger.verifyAndConsumeNonce(1, "0xA", 0)).toBe(true);
    // Second use fails
    expect(messenger.verifyAndConsumeNonce(1, "0xA", 0)).toBe(false);
  });
});

// ============================================================
// Batch Processing
// ============================================================

describe("CrossChainMessenger — batch processing", () => {
  it("auto-batches when maxBatchSize reached", () => {
    const config: RelayConfig = { ...RELAY_CONFIG, maxBatchSize: 3 };
    const messenger = new CrossChainMessenger(config);

    messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});
    messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xC", "0xD", {});

    // Not yet batched
    expect(messenger.getPendingCount()).toBe(2);

    // Third message triggers batch
    const msg3 = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xE", "0xF", {});
    expect(messenger.getPendingCount()).toBe(0);
    expect(msg3.batchId).toBeDefined();
  });

  it("manual batch processing", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});
    messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xC", "0xD", {});

    const batch = messenger.processBatch();
    expect(batch).not.toBeNull();
    expect(batch!.messages.length).toBe(2);
    expect(batch!.status).toBe("processing");
  });

  it("returns null when no pending messages", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    expect(messenger.processBatch()).toBeNull();
  });

  it("retrieves batch by ID", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});

    const batch = messenger.processBatch()!;
    const retrieved = messenger.getBatch(batch.batchId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.batchId).toBe(batch.batchId);
  });

  it("completes a batch", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});

    const batch = messenger.processBatch()!;
    const completed = messenger.completeBatch(batch.batchId);
    expect(completed.status).toBe("completed");
  });
});

// ============================================================
// Message Queries
// ============================================================

describe("CrossChainMessenger — queries", () => {
  it("retrieves message by ID", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const msg = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});

    const retrieved = messenger.getMessage(msg.messageId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.messageId).toBe(msg.messageId);
  });

  it("filters by status", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    const m1 = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});
    const m2 = messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xC", "0xD", {});
    messenger.markFailed(m2.messageId, "error");

    const failed = messenger.getMessagesByStatus("failed");
    expect(failed.length).toBe(1);
    expect(failed[0].messageId).toBe(m2.messageId);
  });

  it("filters by route", () => {
    const messenger = new CrossChainMessenger(RELAY_CONFIG);
    messenger.createMessage("transfer", "evm", 1, "evm", 42161, "0xA", "0xB", {});
    messenger.createMessage("transfer", "evm", 10, "evm", 1, "0xA", "0xB", {});

    const route1to42161 = messenger.getMessagesForRoute(1, 42161);
    expect(route1to42161.length).toBe(1);
  });
});

// ============================================================
// computeMessageHash
// ============================================================

describe("computeMessageHash", () => {
  it("produces deterministic hash", () => {
    const h1 = computeMessageHash({
      messageId: "m1",
      type: "transfer",
      sourceChain: "evm",
      sourceChainId: 1,
      destChain: "evm",
      destChainId: 42161,
      sender: "0xA",
      recipient: "0xB",
      nonce: 0,
      expiry: 12345,
      payload: {},
    });

    const h2 = computeMessageHash({
      messageId: "m1",
      type: "transfer",
      sourceChain: "evm",
      sourceChainId: 1,
      destChain: "evm",
      destChainId: 42161,
      sender: "0xA",
      recipient: "0xB",
      nonce: 0,
      expiry: 12345,
      payload: {},
    });

    expect(h1).toBe(h2);
  });

  it("different messages produce different hashes", () => {
    const h1 = computeMessageHash({
      messageId: "m1",
      type: "transfer",
      sourceChain: "evm",
      sourceChainId: 1,
      destChain: "evm",
      destChainId: 42161,
      sender: "0xA",
      recipient: "0xB",
      nonce: 0,
      expiry: 12345,
      payload: {},
    });

    const h2 = computeMessageHash({
      messageId: "m2", // Different ID
      type: "transfer",
      sourceChain: "evm",
      sourceChainId: 1,
      destChain: "evm",
      destChainId: 42161,
      sender: "0xA",
      recipient: "0xB",
      nonce: 0,
      expiry: 12345,
      payload: {},
    });

    expect(h1).not.toBe(h2);
  });
});

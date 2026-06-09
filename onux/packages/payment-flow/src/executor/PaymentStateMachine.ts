/**
 * PaymentStateMachine — manages payment lifecycle transitions and receipt polling.
 *
 * State flow:
 *   pending → processing → confirmed | failed | cancelled
 *
 * Supports:
 * - State transition validation
 * - Event callbacks on state changes
 * - Automatic receipt polling for "processing" payments
 */

import type { PaymentRequest, PaymentState } from "../types";
import type { PublicClient } from "viem";

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type PaymentEventName =
  | "stateChange"
  | "confirmed"
  | "failed"
  | "cancelled";

export interface PaymentEventListener {
  onStateChange?: (payment: PaymentRequest, from: PaymentState, to: PaymentState) => void;
  onConfirmed?: (payment: PaymentRequest) => void;
  onFailed?: (payment: PaymentRequest, error?: Error) => void;
  onCancelled?: (payment: PaymentRequest) => void;
}

/** Valid state transitions. */
const VALID_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  pending: ["processing", "cancelled"],
  processing: ["confirmed", "failed", "cancelled"],
  confirmed: [],
  failed: [],
  cancelled: [],
};

// ---------------------------------------------------------------------------
// PaymentStateMachine
// ---------------------------------------------------------------------------

export class PaymentStateMachine {
  private listeners: Map<string, PaymentEventListener> = new Map();
  private activePolls: Map<string, boolean> = new Map();

  /**
   * Validate and apply a state transition.
   * Returns true if transition was applied, false if invalid.
   */
  transition(payment: PaymentRequest, newState: PaymentState): boolean {
    const allowed = VALID_TRANSITIONS[payment.state];
    if (!allowed.includes(newState)) {
      return false;
    }

    const prevState = payment.state;
    payment.state = newState;
    payment.updatedAt = Date.now();

    // Notify listeners
    this.notifyListeners(payment, prevState, newState);

    return true;
  }

  /**
   * Start polling for a payment's on-chain receipt.
   * Automatically transitions to "confirmed" or "failed" on receipt.
   */
  startPolling(
    payment: PaymentRequest,
    publicClient: PublicClient,
    maxAttempts: number = 30,
    baseDelayMs: number = 1000,
  ): void {
    if (this.activePolls.has(payment.id)) return;
    this.activePolls.set(payment.id, true);

    this._poll(payment, publicClient, 0, maxAttempts, baseDelayMs);
  }

  /** Stop polling for a payment. */
  stopPolling(paymentId: string): void {
    this.activePolls.delete(paymentId);
  }

  /** Register an event listener for a specific payment. */
  on(paymentId: string, listener: PaymentEventListener): void {
    const existing = this.listeners.get(paymentId) ?? {};
    this.listeners.set(paymentId, { ...existing, ...listener });
  }

  /** Remove a listener. */
  off(paymentId: string): void {
    this.listeners.delete(paymentId);
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private notifyListeners(
    payment: PaymentRequest,
    from: PaymentState,
    to: PaymentState,
  ): void {
    const listener = this.listeners.get(payment.id);
    if (!listener) return;

    listener.onStateChange?.(payment, from, to);

    if (to === "confirmed") listener.onConfirmed?.(payment);
    if (to === "failed") listener.onFailed?.(payment);
    if (to === "cancelled") listener.onCancelled?.(payment);
  }

  private async _poll(
    payment: PaymentRequest,
    publicClient: PublicClient,
    attempt: number,
    maxAttempts: number,
    baseDelayMs: number,
  ): Promise<void> {
    if (!this.activePolls.has(payment.id)) return;
    if (attempt >= maxAttempts) {
      this.transition(payment, "failed");
      this.activePolls.delete(payment.id);
      return;
    }

    if (!payment.txHash) {
      await this._sleep(this._backoffMs(attempt, baseDelayMs));
      return this._poll(payment, publicClient, attempt + 1, maxAttempts, baseDelayMs);
    }

    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: payment.txHash,
      });

      if (receipt.status === "success") {
        payment.blockNumber = receipt.blockNumber;
        this.transition(payment, "confirmed");
      } else {
        this.transition(payment, "failed");
      }
      this.activePolls.delete(payment.id);
    } catch {
      // Not yet mined
      await this._sleep(this._backoffMs(attempt, baseDelayMs));
      return this._poll(payment, publicClient, attempt + 1, maxAttempts, baseDelayMs);
    }
  }

  private _backoffMs(attempt: number, baseMs: number, maxMs: number = 30_000): number {
    return Math.min(baseMs * 2 ** attempt, maxMs);
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

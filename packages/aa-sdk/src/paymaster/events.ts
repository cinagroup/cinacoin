/**
 * Paymaster event types
 */

import type { UserOperation } from './types.js';

export interface SponsorshipRequestedEvent {
  userOp: UserOperation;
  entryPoint: string;
  chainId: number;
}

export interface SponsorshipApprovedEvent {
  userOpHash: string;
  paymasterAndData: string;
  estimatedCost: bigint;
}

export interface SponsorshipRejectedEvent {
  reason: string;
  policyType?: string;
}

export interface SponsorshipFailedEvent {
  error: Error;
}

export interface DepositCheckedEvent {
  available: bigint;
  required: bigint;
  sufficient: boolean;
}

export interface PolicyEvaluatedEvent {
  policyType: string;
  eligible: boolean;
  sender: string;
}

export type PaymasterEventType =
  | 'sponsorship_requested'
  | 'sponsorship_approved'
  | 'sponsorship_rejected'
  | 'sponsorship_failed'
  | 'deposit_checked'
  | 'policy_evaluated';

export type PaymasterEventMap = {
  sponsorship_requested: SponsorshipRequestedEvent;
  sponsorship_approved: SponsorshipApprovedEvent;
  sponsorship_rejected: SponsorshipRejectedEvent;
  sponsorship_failed: SponsorshipFailedEvent;
  deposit_checked: DepositCheckedEvent;
  policy_evaluated: PolicyEvaluatedEvent;
};

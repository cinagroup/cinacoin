/**
 * Paymaster module - ERC-4337 paymaster client and router
 */

// Types
export type {
  UserOperation,
  PaymasterConfig,
  PaymasterRequest,
  PaymasterResponse,
  PaymasterDepositInfo,
  SponsorshipEstimate,
  PmRouterEntry,
} from './types.js';

// Errors
export {
  PaymasterError,
  PaymasterConfigError,
  PaymasterRpcError,
  PaymasterDepositError,
  PaymasterPolicyError,
  PaymasterInsufficientFundsError,
} from './errors.js';

// Policies
export type {
  SponsorshipPolicy,
  FreeTierPolicy,
  WhitelistPolicy,
  BlacklistPolicy,
  GasLimitPolicy,
  AnySponsorshipPolicy,
} from './policies.js';

// Events
export type {
  PaymasterEventType,
  PaymasterEventMap,
  SponsorshipRequestedEvent,
  SponsorshipApprovedEvent,
  SponsorshipRejectedEvent,
  SponsorshipFailedEvent,
  DepositCheckedEvent,
  PolicyEvaluatedEvent,
} from './events.js';

// Serialization
export { serializeUserOp, serializePartialUserOp } from './serialization.js';

// Client
export { PaymasterClient } from './client.js';
export type { ExtendedPaymasterConfig } from './client.js';

// Router
export { PaymasterRouter } from './router.js';
export type { RoutingStrategy, PmRoutingResult } from './router.js';

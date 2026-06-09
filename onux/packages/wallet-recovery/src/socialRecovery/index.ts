/**
 * @cinacoin/wallet-recovery/social-recovery
 *
 * Guardian-based social wallet recovery with time-delayed execution,
 * risk scoring, and event logging.
 */

// SocialRecoveryManager
export { SocialRecoveryManager } from './SocialRecoveryManager.js';
export type { NotificationCallback, SocialRecoveryManagerOptions } from './SocialRecoveryManager.js';

// Types
export type {
  GuardianType,
  Guardian,
  RecoveryStatus,
  RecoveryRequest,
  RecoveryEventType,
  RecoveryEvent,
  GuardianSetConfig,
  RecoveryStatusResult,
  InitiateRecoveryParams,
  SetGuardiansResult,
} from './types.js';

// React Hooks
export {
  useRecovery,
  useGuardians,
  useRecoveryStatus,
} from './hooks.js';
export type {
  UseRecoveryReturn,
  UseGuardiansReturn,
  UseRecoveryStatusReturn,
} from './hooks.js';

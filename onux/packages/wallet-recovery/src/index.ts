/**
 * @cinacoin/wallet-recovery — Shamir's Secret Sharing Wallet Recovery
 *
 * Threshold-based wallet recovery across multiple providers
 * (email, phone, social OAuth) with password-based fallback,
 * plus Guardian-based social recovery with time-delayed execution.
 *
 * @packageDocumentation
 */

// Core recovery manager
export {
  WalletRecovery,
  hexToBytes,
  bytesToHex,
  gfMul,
  gfInv,
  gfDiv,
  evalPolynomial,
  lagrangeInterpolate,
  splitSecret,
  combineShares,
  encryptShare,
  decryptShare,
  deriveKeyFromPassword,
} from './WalletRecovery.js';

// React hook (SSS-based)
export { useWalletRecovery } from './useWalletRecovery.js';

// Social Recovery (Guardian-based)
export { SocialRecoveryManager } from './socialRecovery/index.js';
export type {
  NotificationCallback,
  SocialRecoveryManagerOptions,
} from './socialRecovery/index.js';

// Social Recovery React Hooks
export {
  useRecovery,
  useGuardians,
  useRecoveryStatus,
} from './socialRecovery/index.js';
export type {
  UseRecoveryReturn,
  UseGuardiansReturn,
  UseRecoveryStatusReturn,
} from './socialRecovery/index.js';

// Types (SSS-based)
export type {
  RecoveryProviderType,
  RecoveryShare,
  RecoverySetupConfig,
  RecoverySetupResult,
  AddRecoveryProviderParams,
  RecoverWithProvidersParams,
  RecoveryResult,
  RecoverWithPasswordParams,
  WalletRecoveryConfig,
  PasswordStrength,
  PasswordStrengthResult,
  SetPasswordParams,
  ChangePasswordParams,
  EncryptedShareBundle,
} from './types.js';

// Types (Social Recovery)
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
} from './socialRecovery/index.js';

/**
 * @cinaconnect/wallet-recovery — Shamir's Secret Sharing Wallet Recovery
 *
 * Threshold-based wallet recovery across multiple providers
 * (email, phone, social OAuth) with password-based fallback.
 *
 * @packageDocumentation
 */

// Core recovery manager
export { WalletRecovery, hexToBytes, bytesToHex } from './WalletRecovery.js';

// Types
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
} from './types.js';

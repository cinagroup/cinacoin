export { getPool, closePool, query, getClient, transaction } from './pool.js';
export {
  createUser,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  updateLastLogin,
  updatePassword,
  updateProfile,
  updateUserStatus,
  verifyEmail,
  emailExists,
  usernameExists,
  listUsers,
  deleteUser,
} from './users.js';
export {
  findOAuthAccount,
  findOAuthAccountsByUserId,
  findOAuthAccountById,
  createOAuthAccount,
  updateOAuthAccount,
  deleteOAuthAccount,
  updateUserOAuthProviders,
  userHasPassword,
  countOAuthAccounts,
  writeAuditLog,
} from './oauth-accounts.js';
export {
  createWeb3Nonce,
  consumeWeb3Nonce,
  findWeb3Wallet,
  upsertWeb3Wallet,
  getUserWeb3Wallets,
  updateWeb3WalletLastUsed,
  removeWeb3Wallet,
} from './web3.js';
export type { Web3WalletRecord, Web3NonceRecord } from './web3.js';
export {
  createWebAuthnChallenge,
  consumeWebAuthnChallenge,
  createPasskey,
  findPasskeyByCredentialId,
  getUserPasskeys,
  updatePasskeyCounter,
  deletePasskey,
  userHasPasskeys,
} from './passkeys.js';
export type { PasskeyRecord, WebAuthnChallengeRecord } from './passkeys.js';
export {
  createTotpMethod,
  enableTotpMethod,
  getUserTotpMethod,
  disableMfa,
  storeRecoveryCodes,
  verifyRecoveryCode,
  createMfaChallenge,
  consumeMfaChallenge,
  getRecoveryCodesCount,
} from './mfa.js';
export type { MfaMethodRecord, MfaChallengeRecord } from './mfa.js';
export {
  createMfaSession,
  consumeMfaSession,
  validateMfaSession,
  invalidateUserMfaSessions,
} from './mfa-sessions.js';
export type { MfaSessionRecord } from './mfa-sessions.js';

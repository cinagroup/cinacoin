/**
 * Cinacoin Farcaster Mini App SDK.
 *
 * Wallet connectivity and identity for Farcaster Mini Apps,
 * including Sign-In with Farcaster (SIWF).
 *
 * @packageDocumentation
 */

// Provider
export { FarcasterProvider } from './FarcasterProvider.js';
export type { FarcasterProviderConfig, FarcasterWalletState } from './types.js';

// Auth
export {
  createSiweMessage,
  verifySignature,
  FarcasterAuth,
} from './FarcasterAuth.js';

// Types
export type {
  FarcasterUser,
  FarcasterContext,
  SignInWithFarcasterParams,
  SignInWithFarcasterResult,
} from './types.js';

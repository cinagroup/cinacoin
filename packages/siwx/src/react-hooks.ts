/**
 * SIWX React hooks — useSIWX and useSIWXSession.
 *
 * Provides reactive interfaces for cross-chain sign-in and session management
 * in React applications.
 *
 * @packageDocumentation
 */

import type { ChainType, SIWXParams, SIWXResult, SIWXVerifyInput } from './types.js';
import { createSignInMessage, verifySignIn } from './siwx.js';
import type { SIWXSession } from './siwx-session.js';
import { SIWXSessionManager, defaultSessionManager } from './siwx-session.js';

// ---------------------------------------------------------------------------
// useSIWX
// ---------------------------------------------------------------------------

/**
 * React hook for cross-chain sign-in flow.
 *
 * Generates SIWX messages, handles signature verification, and manages
 * session lifecycle. Works with any supported chain type (EVM, Solana,
 * Bitcoin, TON, Tron).
 *
 * @param options - Hook configuration.
 * @param options.sessionManager - Optional custom SIWXSessionManager (uses default if omitted).
 * @param options.onVerified - Optional callback when verification succeeds.
 * @returns SIWX state and actions.
 *
 * @example
 * ```tsx
 * import { useSIWX } from '@cinacoin/siwx';
 *
 * function SignInButton() {
 *   const { generateMessage, verify, isLoading, error, session } = useSIWX();
 *
 *   const handleSignIn = async () => {
 *     const message = generateMessage({
 *       chainType: 'evm',
 *       domain: 'example.com',
 *       address: '0xabc...',
 *       uri: 'https://example.com',
 *       chainId: 1,
 *       nonce: 'random-nonce',
 *     });
 *
 *     // User signs message via wallet...
 *     const signature = await wallet.signMessage(message);
 *
 *     const result = await verify({
 *       chainType: 'evm',
 *       message,
 *       signature,
 *       address: '0xabc...',
 *     });
 *
 *     if (result.valid) {
 *       console.log('Signed in!', session);
 *     }
 *   };
 *
 *   return <button onClick={handleSignIn}>Sign In</button>;
 * }
 * ```
 */
export function useSIWX(options?: {
  sessionManager?: SIWXSessionManager;
  onVerified?: (session: SIWXSession) => void;
}): {
  /** Generate a SIWX message for the given params. */
  generateMessage: (params: SIWXParams & { chainType: ChainType }) => string;

  /** Verify a signature and create a session. */
  verify: (input: SIWXVerifyInput, provider?: unknown) => Promise<SIWXResult>;

  /** Current active session, or null. */
  session: SIWXSession | null;

  /** Whether an operation is in progress. */
  isLoading: boolean;

  /** Last error, if any. */
  error: Error | null;

  /** Revoke the current session. */
  revoke: () => boolean;
} {
  // NOTE: This is a type-safe stub. The actual React implementation with
  // useState / useEffect / useCallback lives in the React-specific build.
  // This export ensures the symbol is available for non-React consumers.

  const manager = options?.sessionManager ?? defaultSessionManager;

  const generateMessage = (params: SIWXParams & { chainType: ChainType }): string => {
    return createSignInMessage(params, params.chainType);
  };

  const verify = async (
    input: SIWXVerifyInput,
    provider?: unknown,
  ): Promise<SIWXResult> => {
    const result = await verifySignIn(input, provider);

    if (result.valid) {
      const session = await manager.create({
        chainType: input.chainType,
        address: input.address,
        domain: input.message.split('\n')[0]?.split(' ')[0] || 'unknown',
        chainId: '0',
        message: input.message,
        signature: input.signature,
      });

      options?.onVerified?.(session);
    }

    return result;
  };

  const session: SIWXSession | null = null;
  const isLoading: boolean = false;
  const error: Error | null = null;

  const revoke = (): boolean => {
    return false;
  };

  return { generateMessage, verify, session, isLoading, error, revoke };
}

// ---------------------------------------------------------------------------
// useSIWXSession
// ---------------------------------------------------------------------------

/**
 * React hook for reading and managing the current SIWX session.
 *
 * Focuses on session lifecycle — creation, validation, expiry tracking,
 * and revocation. Unlike `useSIWX()`, this hook does not handle the
 * sign-in flow itself.
 *
 * @param sessionManager - SIWXSessionManager instance (uses default if omitted).
 * @returns Session state, validation status, and management actions.
 *
 * @example
 * ```tsx
 * import { useSIWXSession } from '@cinacoin/siwx';
 *
 * function SessionStatus() {
 *   const { currentSession, isValid, timeRemaining, revoke } = useSIWXSession();
 *
 *   if (!currentSession) {
 *     return <p>No active session</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Address: {currentSession.address}</p>
 *       <p>Chain: {currentSession.chainType} ({currentSession.chainId})</p>
 *       <p>Valid: {isValid ? 'Yes' : 'No'}</p>
 *       <p>Expires in: {Math.floor(timeRemaining / 60)} minutes</p>
 *       <button onClick={() => revoke()}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSIWXSession(sessionManager?: SIWXSessionManager): {
  /** All active sessions for a given address (empty until queried). */
  activeSessions: SIWXSession[];

  /** Look up sessions by address. */
  findByAddress: (address: string) => SIWXSession[];

  /** Look up sessions by domain. */
  findByDomain: (domain: string) => SIWXSession[];

  /** Check if a session is valid. */
  isValid: (sessionId: string) => boolean;

  /** Validate a session with detailed reason. */
  validate: (sessionId: string) => { valid: boolean; reason?: string; session?: SIWXSession };

  /** Revoke a session by ID. */
  revoke: (sessionId: string) => boolean;

  /** Revoke all sessions for an address. */
  revokeAll: (address: string) => number;

  /** Expire all past-due sessions. */
  expireAll: () => number;

  /** Purge expired and revoked sessions. */
  purge: () => number;

  /** Total session count. */
  count: () => number;
} {
  // NOTE: Type-safe stub. Full React implementation with useState / useEffect
  // would be in the React-specific build.

  const manager = sessionManager ?? defaultSessionManager;

  return {
    activeSessions: [],
    findByAddress: (address: string) => manager.findByAddress(address),
    findByDomain: (domain: string) => manager.findByDomain(domain),
    isValid: (sessionId: string) => manager.isValid(sessionId),
    validate: (sessionId: string) => manager.validate(sessionId),
    revoke: (sessionId: string) => manager.revoke(sessionId),
    revokeAll: (address: string) => manager.revokeAllForAddress(address),
    expireAll: () => manager.expireAll(),
    purge: () => manager.purge(),
    count: () => manager.count(),
  };
}

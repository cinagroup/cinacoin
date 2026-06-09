/**
 * Utility functions for working with Cinacoin SDK errors.
 *
 * Provides formatting, serialization, type guards, retry detection,
 * and documentation lookup helpers.
 */

import type { ErrorSeverity, ErrorCodeDefinition } from './codes.js';
import { getErrorCode } from './codes.js';
import { CinacoinError, ConnectionError, AuthenticationError, ChainError, TransactionError, WalletConnectError, SigningError, NetworkError, SdkError, SecurityError } from './classes.js';
import { getMessage } from './i18n.js';

// ============================================================================
// Type guards
// ============================================================================

/**
 * Check whether a value is a {@link CinacoinError} (or subclass).
 */
export function isError(value: unknown): value is CinacoinError {
  return value instanceof CinacoinError;
}

/**
 * Check whether an error is a {@link ConnectionError}.
 */
export function isConnectionError(value: unknown): value is ConnectionError {
  return value instanceof ConnectionError;
}

/**
 * Check whether an error is an {@link AuthenticationError}.
 */
export function isAuthenticationError(value: unknown): value is AuthenticationError {
  return value instanceof AuthenticationError;
}

/**
 * Check whether an error is a {@link ChainError}.
 */
export function isChainError(value: unknown): value is ChainError {
  return value instanceof ChainError;
}

/**
 * Check whether an error is a {@link TransactionError}.
 */
export function isTransactionError(value: unknown): value is TransactionError {
  return value instanceof TransactionError;
}

/**
 * Check whether an error is a {@link WalletConnectError}.
 */
export function isWalletConnectError(value: unknown): value is WalletConnectError {
  return value instanceof WalletConnectError;
}

/**
 * Check whether an error is a {@link SigningError}.
 */
export function isSigningError(value: unknown): value is SigningError {
  return value instanceof SigningError;
}

/**
 * Check whether an error is a {@link NetworkError}.
 */
export function isNetworkError(value: unknown): value is NetworkError {
  return value instanceof NetworkError;
}

/**
 * Check whether an error is an {@link SdkError}.
 */
export function isSdkError(value: unknown): value is SdkError {
  return value instanceof SdkError;
}

/**
 * Check whether an error is a {@link SecurityError}.
 */
export function isSecurityError(value: unknown): value is SecurityError {
  return value instanceof SecurityError;
}

// ============================================================================
// Severity
// ============================================================================

/**
 * Return the severity level for a given error code.
 * Falls back to 'error' for unknown codes.
 */
export function getErrorSeverity(code: number): ErrorSeverity {
  return getErrorCode(code)?.severity ?? 'error';
}

// ============================================================================
// Retry detection
// ============================================================================

/**
 * Determine whether an error is likely safe to retry.
 *
 * Errors that are NOT retryable:
 * - Critical severity (security breaches, MITM, etc.)
 * - Invalid configuration (won't change on retry)
 * - User rejected (user intent is clear)
 */
export function isRetryable(error: unknown): boolean {
  if (isError(error)) {
    return error.isRetryable;
  }
  if (error instanceof Error) {
    // Standard Error — assume retryable unless it looks permanent
    return true;
  }
  return false;
}

// ============================================================================
// Documentation URL
// ============================================================================

/**
 * Build the documentation URL for a given error code.
 * Points to the official Cinacoin SDK error reference.
 */
export function getErrorDocumentation(code: number): string {
  const def = getErrorCode(code);
  if (!def) {
    return 'https://docs.cinacoin.com/errors#unknown';
  }
  return `https://docs.cinacoin.com/errors#${def.identifier.toLowerCase()}`;
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format any error into a human-readable multi-line string.
 *
 * For {@link CinacoinError} instances this includes code, identifier,
 * severity, and documentation URL. For plain Error objects it returns
 * the standard name + message.
 */
export function formatError(error: unknown): string {
  if (isError(error)) {
    const lines: string[] = [];
    lines.push(`[${error.severity.toUpperCase()}] ${error.identifier} (${error.code})`);
    lines.push(`  ${error.message}`);
    if (error.cause) {
      lines.push(`  Cause: ${error.cause.message}`);
    }
    lines.push(`  Docs: ${error.documentationUrl}`);
    return lines.join('\n');
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

/**
 * Compact single-line format for logging.
 */
export function formatErrorCompact(error: unknown): string {
  if (isError(error)) {
    return `[${error.identifier}:${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serialize an error to a JSON-safe object.
 */
export function errorToJSON(error: unknown): Record<string, unknown> {
  if (isError(error)) {
    return error.toJSON();
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: (error as Error & { cause?: Error })?.cause?.message,
    };
  }
  return { message: String(error) };
}

/**
 * Deserialize a JSON object back into the appropriate error class.
 */
export function errorFromJSON(json: Record<string, unknown>): CinacoinError {
  const code = typeof json.code === 'number' ? json.code : 0;
  const message = typeof json.message === 'string' ? json.message : 'Unknown error';
  const cause = typeof json.cause === 'string' ? new Error(json.cause) : undefined;

  const ErrorClass =
    code >= 9000 ? SecurityError :
    code >= 8000 ? SdkError :
    code >= 7000 ? NetworkError :
    code >= 6000 ? SigningError :
    code >= 5000 ? WalletConnectError :
    code >= 4000 ? TransactionError :
    code >= 3000 ? ChainError :
    code >= 2000 ? AuthenticationError :
    code >= 1000 ? ConnectionError :
    CinacoinError;

  return new ErrorClass(code, message, cause ? { cause } : undefined);
}

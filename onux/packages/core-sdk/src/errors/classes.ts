/**
 * Custom error classes for the Cinacoin SDK.
 *
 * Every error thrown by the SDK is an instance of one of these classes,
 * each extending the base {@link CinacoinError}. Classes carry a numeric
 * error code, severity, optional cause, and a {@link toJSON} serializer
 * for structured logging.
 */

import type { ErrorSeverity, ErrorCodeDefinition } from './codes.js';
import { getErrorCode, getErrorByIdentifier } from './codes.js';
import { getErrorDocumentation } from './utils.js';
import { getMessage } from './i18n.js';

// ============================================================================
// Base error
// ============================================================================

/**
 * Base error class for all Cinacoin SDK errors.
 *
 * Every SDK error includes:
 * - `code` — the numeric error code
 * - `identifier` — the string identifier (e.g., 'CONNECTION_REFUSED')
 * - `severity` — info | warning | error | critical
 * - `cause` — optional underlying Error
 * - `documentationUrl` — link to the error documentation
 */
export class CinacoinError extends Error {
  /** Numeric error code. */
  public readonly code: number;

  /** String identifier. */
  public readonly identifier: string;

  /** Severity level. */
  public readonly severity: ErrorSeverity;

  /** Optional underlying cause. */
  public readonly cause: Error | undefined;

  /** Documentation URL for this error. */
  public readonly documentationUrl: string;

  /** Locale used for the message (defaults to 'en'). */
  public locale: string;

  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    const def: ErrorCodeDefinition | undefined =
      typeof codeOrDef === 'number'
        ? getErrorCode(codeOrDef)
        : codeOrDef;

    if (!def) {
      super(message ?? 'Unknown error');
      this.code = typeof codeOrDef === 'number' ? codeOrDef : 0;
      this.identifier = typeof codeOrDef === 'number' ? `UNKNOWN_${codeOrDef}` : 'UNKNOWN';
      this.severity = 'error';
      this.cause = options?.cause;
      this.locale = options?.locale ?? 'en';
      this.documentationUrl = getErrorDocumentation(this.code);
      this.name = 'CinacoinError';
      return;
    }

    const msg = message ?? getMessage(def.code, options?.locale ?? 'en');
    super(msg, options?.cause ? { cause: options.cause } : undefined);

    this.code = def.code;
    this.identifier = def.identifier;
    this.severity = def.severity;
    this.cause = options?.cause;
    this.locale = options?.locale ?? 'en';
    this.documentationUrl = getErrorDocumentation(def.code);
    this.name = 'CinacoinError';
  }

  /** Structured JSON representation for logging / transport. */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      identifier: this.identifier,
      severity: this.severity,
      message: this.message,
      cause: this.cause?.message,
      documentationUrl: this.documentationUrl,
      stack: this.stack,
    };
  }

  /** Whether this error is likely safe to retry. */
  get isRetryable(): boolean {
    return this.severity !== 'critical' && this.code !== 8002 /* INVALID_CONFIG */;
  }

  [Symbol.toStringTag] = 'CinacoinError';
}

// ============================================================================
// Category-specific error classes
// ============================================================================

/** Connection-related errors (1000-1099). */
export class ConnectionError extends CinacoinError {
  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    super(codeOrDef, message, options);
    this.name = 'ConnectionError';
  }

  [Symbol.toStringTag] = 'ConnectionError';
}

/** Authentication-related errors (2000-2099). */
export class AuthenticationError extends CinacoinError {
  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    super(codeOrDef, message, options);
    this.name = 'AuthenticationError';
  }

  [Symbol.toStringTag] = 'AuthenticationError';
}

/** Chain-related errors (3000-3099). */
export class ChainError extends CinacoinError {
  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    super(codeOrDef, message, options);
    this.name = 'ChainError';
  }

  [Symbol.toStringTag] = 'ChainError';
}

/** Transaction-related errors (4000-4099). */
export class TransactionError extends CinacoinError {
  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    super(codeOrDef, message, options);
    this.name = 'TransactionError';
  }

  [Symbol.toStringTag] = 'TransactionError';
}

/** Wallet Connect protocol errors (5000-5099). */
export class WalletConnectError extends CinacoinError {
  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    super(codeOrDef, message, options);
    this.name = 'WalletConnectError';
  }

  [Symbol.toStringTag] = 'WalletConnectError';
}

/** Signing-related errors (6000-6099). */
export class SigningError extends CinacoinError {
  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    super(codeOrDef, message, options);
    this.name = 'SigningError';
  }

  [Symbol.toStringTag] = 'SigningError';
}

/** Network-related errors (7000-7099). */
export class NetworkError extends CinacoinError {
  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    super(codeOrDef, message, options);
    this.name = 'NetworkError';
  }

  [Symbol.toStringTag] = 'NetworkError';
}

/** SDK internal errors (8000-8099). */
export class SdkError extends CinacoinError {
  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    super(codeOrDef, message, options);
    this.name = 'SdkError';
  }

  [Symbol.toStringTag] = 'SdkError';
}

/** Security-critical errors (9000-9099). */
export class SecurityError extends CinacoinError {
  constructor(
    codeOrDef: number | ErrorCodeDefinition,
    message?: string,
    options?: { cause?: Error; locale?: string },
  ) {
    super(codeOrDef, message, options);
    this.name = 'SecurityError';
  }

  [Symbol.toStringTag] = 'SecurityError';
}

// ============================================================================
// Convenience factory
// ============================================================================

/**
 * Create the appropriate error class instance based on the error code range.
 *
 * Codes in the 1000s → ConnectionError, 2000s → AuthenticationError, etc.
 * Falls back to {@link CinacoinError} for unknown codes.
 */
export function createError(
  codeOrDef: number | ErrorCodeDefinition,
  message?: string,
  options?: { cause?: Error; locale?: string },
): CinacoinError {
  const code = typeof codeOrDef === 'number' ? codeOrDef : codeOrDef.code;

  if (code >= 1000 && code < 2000) return new ConnectionError(codeOrDef, message, options);
  if (code >= 2000 && code < 3000) return new AuthenticationError(codeOrDef, message, options);
  if (code >= 3000 && code < 4000) return new ChainError(codeOrDef, message, options);
  if (code >= 4000 && code < 5000) return new TransactionError(codeOrDef, message, options);
  if (code >= 5000 && code < 6000) return new WalletConnectError(codeOrDef, message, options);
  if (code >= 6000 && code < 7000) return new SigningError(codeOrDef, message, options);
  if (code >= 7000 && code < 8000) return new NetworkError(codeOrDef, message, options);
  if (code >= 8000 && code < 9000) return new SdkError(codeOrDef, message, options);
  if (code >= 9000 && code < 10000) return new SecurityError(codeOrDef, message, options);
  return new CinacoinError(codeOrDef, message, options);
}

/**
 * Resolve an {@link ErrorCodeDefinition} from a numeric code or string identifier.
 */
export function resolveCodeDef(codeOrId: number | string): ErrorCodeDefinition | undefined {
  if (typeof codeOrId === 'number') return getErrorCode(codeOrId);
  return getErrorByIdentifier(codeOrId);
}

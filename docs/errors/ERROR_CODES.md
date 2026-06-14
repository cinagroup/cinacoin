# Cinacoin SDK — Error Code Reference

> **Version:** 1.0.0
> **Total codes:** 63 across 9 categories
> **Format:** `code.ts`, `classes.ts`, `utils.ts`, `i18n.ts`
> **Docs URL pattern:** `https://docs.cinacoin.com/errors#<identifier>`

## Categories

| Category          | Range     | Codes | Severity Focus |
|-------------------|-----------|-------|----------------|
| CONNECTION        | 1000-1099 | 9     | error          |
| AUTHENTICATION    | 2000-2099 | 8     | error/critical |
| CHAIN             | 3000-3099 | 8     | error          |
| TRANSACTION       | 4000-4099 | 10    | error/warning  |
| WALLET_CONNECT    | 5000-5099 | 9     | error/warning  |
| SIGNING           | 6000-6099 | 7     | error/info     |
| NETWORK           | 7000-7099 | 7     | error/warning  |
| SDK               | 8000-8099 | 9     | error          |
| SECURITY          | 9000-9099 | 7     | critical       |

---

## CONNECTION Errors (1000–1099)

| Code | Identifier              | Severity  | Description                                        |
|------|-------------------------|-----------|----------------------------------------------------|
| 1000 | CONNECTION_REFUSED      | error     | Connection was refused by the remote endpoint      |
| 1001 | CONNECTION_TIMEOUT      | error     | Connection attempt timed out                       |
| 1002 | CONNECTION_LOST         | warning   | Established connection was unexpectedly lost       |
| 1003 | CONNECTION_REJECTED     | error     | Connection rejected (CORS, firewall, auth)         |
| 1004 | MAX_RETRIES_EXCEEDED    | error     | Maximum retry attempts exceeded                    |
| 1005 | DNS_RESOLUTION_FAILED   | error     | Failed to resolve hostname                         |
| 1006 | SOCKET_ERROR            | error     | Low-level socket error occurred                    |
| 1007 | SSL_HANDSHAKE_FAILED    | critical  | TLS/SSL handshake failed                           |
| 1008 | CONNECTION_RESET        | warning   | Connection was reset by the peer                   |

---

## AUTHENTICATION Errors (2000–2099)

| Code | Identifier              | Severity  | Description                                        |
|------|-------------------------|-----------|----------------------------------------------------|
| 2000 | SIWE_VERIFICATION_FAILED| error     | Sign-In With Ethereum signature verification failed|
| 2001 | INVALID_SIGNATURE       | error     | Provided cryptographic signature is invalid        |
| 2002 | SESSION_EXPIRED         | warning   | Authentication session has expired                 |
| 2003 | TOKEN_REVOKED           | error     | Access token has been revoked                      |
| 2004 | UNAUTHORIZED            | error     | Request lacks valid auth credentials               |
| 2005 | INSUFFICIENT_PERMISSIONS| error     | Authenticated user lacks required permissions      |
| 2006 | CHALLENGE_EXPIRED       | warning   | Auth challenge nonce has expired                   |
| 2007 | MESSAGE_TAMPERED        | critical  | Signed message doesn't match challenge             |

---

## CHAIN Errors (3000–3099)

| Code | Identifier              | Severity  | Description                                        |
|------|-------------------------|-----------|----------------------------------------------------|
| 3000 | UNSUPPORTED_CHAIN       | error     | Requested chain not supported by SDK               |
| 3001 | RPC_ERROR               | error     | JSON-RPC call to chain returned an error           |
| 3002 | CHAIN_SWITCH_FAILED     | error     | Failed to switch wallet to target chain            |
| 3003 | CHAIN_NOT_CONFIGURED    | error     | Chain not configured in SDK                        |
| 3004 | INVALID_CHAIN_ID        | error     | Chain ID is malformed or unknown                   |
| 3005 | RPC_RATE_LIMITED        | warning   | RPC provider rate limit exceeded                   |
| 3006 | CHAIN_NOT_FOUND         | error     | No chain config found for given ID                 |
| 3007 | BLOCK_NOT_FOUND         | error     | Requested block doesn't exist on this chain        |

---

## TRANSACTION Errors (4000–4099)

| Code | Identifier              | Severity  | Description                                        |
|------|-------------------------|-----------|----------------------------------------------------|
| 4000 | GAS_ESTIMATION_FAILED   | error     | Failed to estimate gas for transaction             |
| 4001 | INSUFFICIENT_FUNDS      | error     | Account has insufficient balance                   |
| 4002 | TRANSACTION_REVERTED    | error     | Transaction was reverted on-chain                  |
| 4003 | NONCE_TOO_LOW           | error     | Transaction nonce below current account nonce      |
| 4004 | NONCE_TOO_HIGH          | error     | Transaction nonce exceeds expected next nonce      |
| 4005 | GAS_PRICE_TOO_LOW       | warning   | Gas price below network minimum                    |
| 4006 | TRANSACTION_TIMEOUT     | warning   | Transaction confirmation timed out                 |
| 4007 | REPLACED_BY_HIGHER_FEE  | info      | Replaced by a higher-fee transaction               |
| 4008 | DROPPED_FROM_MEMPOOL    | warning   | Dropped from the mempool                           |
| 4009 | SIMULATION_FAILED       | error     | Transaction simulation failed before broadcast     |

---

## WALLET_CONNECT Errors (5000–5099)

| Code | Identifier              | Severity  | Description                                        |
|------|-------------------------|-----------|----------------------------------------------------|
| 5000 | PAIRING_FAILED          | error     | Cinacoin pairing could not be established     |
| 5001 | SESSION_PROPOSAL_REJECTED| error    | Wallet rejected the session proposal               |
| 5002 | SESSION_EXPIRED         | warning   | Cinacoin session has expired                  |
| 5003 | INVALID_PAIRING_URI     | error     | Pairing URI is malformed                           |
| 5004 | SESSION_NOT_FOUND       | error     | No active session for the given topic              |
| 5005 | UNSUPPORTED_METHODS     | error     | Requested methods not supported by peer            |
| 5006 | PROTOCOL_ERROR          | error     | Cinacoin protocol-level error                 |
| 5007 | RELAY_DISCONNECTED      | warning   | Cinacoin relay connection lost                |
| 5008 | REQUEST_TIMEOUT         | warning   | Cinacoin request timed out                    |

---

## SIGNING Errors (6000–6099)

| Code | Identifier              | Severity  | Description                                        |
|------|-------------------------|-----------|----------------------------------------------------|
| 6000 | USER_REJECTED           | info      | User rejected signing request in wallet            |
| 6001 | SIGNING_FAILED          | error     | Signing operation failed (unknown reason)          |
| 6002 | INVALID_MESSAGE         | error     | Message to sign is malformed or empty              |
| 6003 | UNSUPPORTED_SIGNING_METHOD| error   | Signing method not supported                       |
| 6004 | MESSAGE_TOO_LARGE       | error     | Message exceeds max size for signing               |
| 6005 | INVALID_TYPED_DATA      | error     | EIP-712 typed data structure is invalid            |
| 6006 | SIGNING_TIMEOUT         | warning   | Signing request timed out waiting for user         |

---

## NETWORK Errors (7000–7099)

| Code | Identifier              | Severity  | Description                                        |
|------|-------------------------|-----------|----------------------------------------------------|
| 7000 | OFFLINE                 | error     | No network connectivity detected                   |
| 7001 | RPC_UNREACHABLE         | error     | RPC endpoint is unreachable                        |
| 7002 | RATE_LIMITED            | warning   | Network provider rate limit exceeded               |
| 7003 | HTTP_ERROR              | error     | Unexpected HTTP error status                       |
| 7004 | INVALID_RESPONSE        | error     | Network response could not be parsed               |
| 7005 | NETWORK_TIMEOUT         | warning   | Network request exceeded configured timeout        |
| 7006 | NETWORK_UNSTABLE        | warning   | Network connectivity is intermittent               |

---

## SDK Errors (8000–8099)

| Code | Identifier              | Severity  | Description                                        |
|------|-------------------------|-----------|----------------------------------------------------|
| 8000 | NOT_INITIALIZED         | error     | SDK not initialized — call initialize() first      |
| 8001 | ALREADY_INITIALIZED     | warning   | SDK already initialized — call reset() first       |
| 8002 | INVALID_CONFIG          | error     | SDK configuration is invalid or incomplete         |
| 8003 | VERSION_MISMATCH        | error     | SDK version incompatible with expected version     |
| 8004 | MISSING_DEPENDENCY      | error     | Required dependency missing from environment       |
| 8005 | METHOD_NOT_IMPLEMENTED  | error     | Called method not implemented                      |
| 8006 | INVALID_ARGUMENT        | error     | Argument passed to SDK method is invalid           |
| 8007 | STORAGE_ERROR           | error     | Failed to read/write SDK persistent storage        |
| 8008 | DEPRECATED              | info      | Called API is deprecated                           |

---

## SECURITY Errors (9000–9099)

| Code | Identifier              | Severity  | Description                                        |
|------|-------------------------|-----------|----------------------------------------------------|
| 9000 | SESSION_HIJACK_DETECTED | critical  | Session hijacking indicators detected              |
| 9001 | MITM_DETECTED           | critical  | Potential man-in-the-middle attack detected        |
| 9002 | TAMPERED_DATA           | critical  | Data integrity check failed                        |
| 9003 | ORIGIN_MISMATCH         | critical  | Request origin doesn't match registered origin     |
| 9004 | SUSPICIOUS_ACTIVITY     | critical  | Unusual activity pattern detected                  |
| 9005 | CERTIFICATE_PINNING_FAILED| critical| Server cert doesn't match pinned cert              |
| 9006 | REPLAY_ATTACK_DETECTED  | critical  | Replayed message or transaction detected           |

---

## Error Classes

Each error code maps to a category-specific error class:

| Code Range | Error Class           |
|------------|-----------------------|
| 1000-1099  | `ConnectionError`     |
| 2000-2099  | `AuthenticationError` |
| 3000-3099  | `ChainError`          |
| 4000-4099  | `TransactionError`    |
| 5000-5099  | `CinacoinError`  |
| 6000-6099  | `SigningError`        |
| 7000-7099  | `NetworkError`        |
| 8000-8099  | `SdkError`            |
| 9000-9099  | `SecurityError`       |

All classes extend the base `CinacoinError`.

## Error Class Properties

```ts
interface CinacoinError {
  code: number;               // Numeric error code
  identifier: string;         // String identifier (e.g., 'CONNECTION_REFUSED')
  severity: 'info' | 'warning' | 'error' | 'critical';
  cause?: Error;              // Optional underlying cause
  locale: string;             // Locale used for message
  documentationUrl: string;   // Link to docs
  isRetryable: boolean;       // Whether error is safe to retry
  toJSON(): Record<string, unknown>;  // Structured JSON
}
```

## Factory Functions

```ts
// Create error by code or definition (auto-selects correct class)
createError(code: number | ErrorCodeDefinition, message?: string, options?: { cause?: Error; locale?: string }): CinacoinError

// Format errors
formatError(error: unknown): string;         // Human-readable multi-line
formatErrorCompact(error: unknown): string;  // Single-line for logs

// Type guards
isError(value: unknown): value is CinacoinError;
isConnectionError(value: unknown): value is ConnectionError;
// ... (one per error class)

// Utilities
isRetryable(error: unknown): boolean;
getErrorSeverity(code: number): ErrorSeverity;
getErrorDocumentation(code: number): string;
errorToJSON(error: unknown): Record<string, unknown>;
errorFromJSON(json: Record<string, unknown>): CinacoinError;
```

## Internationalization (i18n)

**Supported locales:** `en`, `zh`, `ja`, `ko`, `es`, `fr`, `de`

```ts
// Get localized message
getMessage(code: number, locale?: string): string;

// Get all translations for a code
getAllTranslations(code: number): Partial<Record<SupportedLocale, string>>;

// Locale utilities
isLocaleSupported(locale: string): boolean;
resolveLocale(requested: string): SupportedLocale;  // Falls back to 'en'
```

## Usage Examples

```ts
import { createError, SDK, AUTHENTICATION, isError, formatError, getMessage } from '@cinacoin/core-sdk';

// Throwing a structured error
function connect() {
  if (!initialized) {
    throw createError(SDK.NOT_INITIALIZED.code);
    // → SdkError with code 8000, severity 'error'
  }
}

// Throwing with custom message and cause
function verifySignature(sig: string) {
  if (!isValid(sig)) {
    throw createError(AUTHENTICATION.INVALID_SIGNATURE.code, 'Signature did not match', {
      cause: new Error('ECDSA verification returned false'),
    });
  }
}

// Catching and inspecting
try {
  await sdk.connect();
} catch (err) {
  if (isError(err)) {
    console.log(`[${err.severity}] ${err.identifier}: ${err.message}`);
    console.log(`Docs: ${err.documentationUrl}`);
    console.log(`Retryable: ${err.isRetryable}`);
    // Structured logging
    logger.error(err.toJSON());
    // User-facing message (auto-locale)
    alert(getMessage(err.code));
  }
}
```

---

*This document is auto-generated from `packages/core-sdk/src/errors/codes.ts`.*

/**
 * Error code definitions for the Cinacoin SDK.
 *
 * All error codes are organized into nine categories, each with a dedicated
 * numeric range. Every code carries a string identifier, a severity level,
 * and a human-readable description.
 */

// ============================================================================
// Severity levels
// ============================================================================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

// ============================================================================
// Error code definition type
// ============================================================================

export interface ErrorCodeDefinition {
  /** Numeric error code (unique across all categories). */
  code: number;
  /** Human-readable identifier (e.g., 'CONNECTION_REFUSED'). */
  identifier: string;
  /** Severity level for alerting / UI treatment. */
  severity: ErrorSeverity;
  /** Short description of the error. */
  description: string;
}

// ============================================================================
// CONNECTION errors — 1000-1099
// ============================================================================

export const CONNECTION = {
  CONNECTION_REFUSED: {
    code: 1000,
    identifier: 'CONNECTION_REFUSED',
    severity: 'error' as ErrorSeverity,
    description: 'Connection was refused by the remote endpoint.',
  },
  CONNECTION_TIMEOUT: {
    code: 1001,
    identifier: 'CONNECTION_TIMEOUT',
    severity: 'error' as ErrorSeverity,
    description: 'Connection attempt timed out.',
  },
  CONNECTION_LOST: {
    code: 1002,
    identifier: 'CONNECTION_LOST',
    severity: 'warning' as ErrorSeverity,
    description: 'An established connection was unexpectedly lost.',
  },
  CONNECTION_REJECTED: {
    code: 1003,
    identifier: 'CONNECTION_REJECTED',
    severity: 'error' as ErrorSeverity,
    description: 'Connection was rejected (e.g., CORS, firewall, auth).',
  },
  MAX_RETRIES_EXCEEDED: {
    code: 1004,
    identifier: 'MAX_RETRIES_EXCEEDED',
    severity: 'error' as ErrorSeverity,
    description: 'Maximum retry attempts exceeded.',
  },
  DNS_RESOLUTION_FAILED: {
    code: 1005,
    identifier: 'DNS_RESOLUTION_FAILED',
    severity: 'error' as ErrorSeverity,
    description: 'Failed to resolve the hostname.',
  },
  SOCKET_ERROR: {
    code: 1006,
    identifier: 'SOCKET_ERROR',
    severity: 'error' as ErrorSeverity,
    description: 'Low-level socket error occurred.',
  },
  SSL_HANDSHAKE_FAILED: {
    code: 1007,
    identifier: 'SSL_HANDSHAKE_FAILED',
    severity: 'critical' as ErrorSeverity,
    description: 'TLS/SSL handshake failed.',
  },
  CONNECTION_RESET: {
    code: 1008,
    identifier: 'CONNECTION_RESET',
    severity: 'warning' as ErrorSeverity,
    description: 'Connection was reset by the peer.',
  },
} as const;

// ============================================================================
// AUTHENTICATION errors — 2000-2099
// ============================================================================

export const AUTHENTICATION = {
  SIWE_VERIFICATION_FAILED: {
    code: 2000,
    identifier: 'SIWE_VERIFICATION_FAILED',
    severity: 'error' as ErrorSeverity,
    description: 'Sign-In With Ethereum signature verification failed.',
  },
  INVALID_SIGNATURE: {
    code: 2001,
    identifier: 'INVALID_SIGNATURE',
    severity: 'error' as ErrorSeverity,
    description: 'The provided cryptographic signature is invalid.',
  },
  SESSION_EXPIRED: {
    code: 2002,
    identifier: 'SESSION_EXPIRED',
    severity: 'warning' as ErrorSeverity,
    description: 'The authentication session has expired.',
  },
  TOKEN_REVOKED: {
    code: 2003,
    identifier: 'TOKEN_REVOKED',
    severity: 'error' as ErrorSeverity,
    description: 'The access token has been revoked.',
  },
  UNAUTHORIZED: {
    code: 2004,
    identifier: 'UNAUTHORIZED',
    severity: 'error' as ErrorSeverity,
    description: 'Request lacks valid authentication credentials.',
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 2005,
    identifier: 'INSUFFICIENT_PERMISSIONS',
    severity: 'error' as ErrorSeverity,
    description: 'Authenticated user lacks required permissions.',
  },
  CHALLENGE_EXPIRED: {
    code: 2006,
    identifier: 'CHALLENGE_EXPIRED',
    severity: 'warning' as ErrorSeverity,
    description: 'The authentication challenge nonce has expired.',
  },
  MESSAGE_TAMPERED: {
    code: 2007,
    identifier: 'MESSAGE_TAMPERED',
    severity: 'critical' as ErrorSeverity,
    description: 'The signed message does not match the challenge.',
  },
} as const;

// ============================================================================
// CHAIN errors — 3000-3099
// ============================================================================

export const CHAIN = {
  UNSUPPORTED_CHAIN: {
    code: 3000,
    identifier: 'UNSUPPORTED_CHAIN',
    severity: 'error' as ErrorSeverity,
    description: 'The requested chain is not supported by this SDK.',
  },
  RPC_ERROR: {
    code: 3001,
    identifier: 'RPC_ERROR',
    severity: 'error' as ErrorSeverity,
    description: 'A JSON-RPC call to the chain returned an error.',
  },
  CHAIN_SWITCH_FAILED: {
    code: 3002,
    identifier: 'CHAIN_SWITCH_FAILED',
    severity: 'error' as ErrorSeverity,
    description: 'Failed to switch the wallet to the target chain.',
  },
  CHAIN_NOT_CONFIGURED: {
    code: 3003,
    identifier: 'CHAIN_NOT_CONFIGURED',
    severity: 'error' as ErrorSeverity,
    description: 'The chain has not been configured in the SDK.',
  },
  INVALID_CHAIN_ID: {
    code: 3004,
    identifier: 'INVALID_CHAIN_ID',
    severity: 'error' as ErrorSeverity,
    description: 'The provided chain ID is malformed or unknown.',
  },
  RPC_RATE_LIMITED: {
    code: 3005,
    identifier: 'RPC_RATE_LIMITED',
    severity: 'warning' as ErrorSeverity,
    description: 'RPC provider rate limit exceeded.',
  },
  CHAIN_NOT_FOUND: {
    code: 3006,
    identifier: 'CHAIN_NOT_FOUND',
    severity: 'error' as ErrorSeverity,
    description: 'No chain configuration found for the given ID.',
  },
  BLOCK_NOT_FOUND: {
    code: 3007,
    identifier: 'BLOCK_NOT_FOUND',
    severity: 'error' as ErrorSeverity,
    description: 'The requested block does not exist on this chain.',
  },
} as const;

// ============================================================================
// TRANSACTION errors — 4000-4099
// ============================================================================

export const TRANSACTION = {
  GAS_ESTIMATION_FAILED: {
    code: 4000,
    identifier: 'GAS_ESTIMATION_FAILED',
    severity: 'error' as ErrorSeverity,
    description: 'Failed to estimate gas for the transaction.',
  },
  INSUFFICIENT_FUNDS: {
    code: 4001,
    identifier: 'INSUFFICIENT_FUNDS',
    severity: 'error' as ErrorSeverity,
    description: 'Account has insufficient balance for the transaction.',
  },
  TRANSACTION_REVERTED: {
    code: 4002,
    identifier: 'TRANSACTION_REVERTED',
    severity: 'error' as ErrorSeverity,
    description: 'Transaction was reverted on-chain.',
  },
  NONCE_TOO_LOW: {
    code: 4003,
    identifier: 'NONCE_TOO_LOW',
    severity: 'error' as ErrorSeverity,
    description: 'Transaction nonce is below the current account nonce.',
  },
  NONCE_TOO_HIGH: {
    code: 4004,
    identifier: 'NONCE_TOO_HIGH',
    severity: 'error' as ErrorSeverity,
    description: 'Transaction nonce exceeds the expected next nonce.',
  },
  GAS_PRICE_TOO_LOW: {
    code: 4005,
    identifier: 'GAS_PRICE_TOO_LOW',
    severity: 'warning' as ErrorSeverity,
    description: 'Gas price is below the current network minimum.',
  },
  TRANSACTION_TIMEOUT: {
    code: 4006,
    identifier: 'TRANSACTION_TIMEOUT',
    severity: 'warning' as ErrorSeverity,
    description: 'Transaction confirmation timed out.',
  },
  REPLACED_BY_HIGHER_FEE: {
    code: 4007,
    identifier: 'REPLACED_BY_HIGHER_FEE',
    severity: 'info' as ErrorSeverity,
    description: 'Transaction was replaced by one with a higher fee.',
  },
  DROPPED_FROM_MEMPOOL: {
    code: 4008,
    identifier: 'DROPPED_FROM_MEMPOOL',
    severity: 'warning' as ErrorSeverity,
    description: 'Transaction was dropped from the mempool.',
  },
  SIMULATION_FAILED: {
    code: 4009,
    identifier: 'SIMULATION_FAILED',
    severity: 'error' as ErrorSeverity,
    description: 'Transaction simulation failed before broadcast.',
  },
} as const;

// ============================================================================
// WALLET_CONNECT errors — 5000-5099
// ============================================================================

export const WALLET_CONNECT = {
  PAIRING_FAILED: {
    code: 5000,
    identifier: 'PAIRING_FAILED',
    severity: 'error' as ErrorSeverity,
    description: 'Cinacoin pairing could not be established.',
  },
  SESSION_PROPOSAL_REJECTED: {
    code: 5001,
    identifier: 'SESSION_PROPOSAL_REJECTED',
    severity: 'error' as ErrorSeverity,
    description: 'The wallet rejected the session proposal.',
  },
  SESSION_EXPIRED: {
    code: 5002,
    identifier: 'SESSION_EXPIRED',
    severity: 'warning' as ErrorSeverity,
    description: 'The Cinacoin session has expired.',
  },
  INVALID_PAIRING_URI: {
    code: 5003,
    identifier: 'INVALID_PAIRING_URI',
    severity: 'error' as ErrorSeverity,
    description: 'The provided pairing URI is malformed.',
  },
  SESSION_NOT_FOUND: {
    code: 5004,
    identifier: 'SESSION_NOT_FOUND',
    severity: 'error' as ErrorSeverity,
    description: 'No active session found for the given topic.',
  },
  UNSUPPORTED_METHODS: {
    code: 5005,
    identifier: 'UNSUPPORTED_METHODS',
    severity: 'error' as ErrorSeverity,
    description: 'Requested methods are not supported by the peer.',
  },
  PROTOCOL_ERROR: {
    code: 5006,
    identifier: 'PROTOCOL_ERROR',
    severity: 'error' as ErrorSeverity,
    description: 'A Cinacoin protocol-level error occurred.',
  },
  RELAY_DISCONNECTED: {
    code: 5007,
    identifier: 'RELAY_DISCONNECTED',
    severity: 'warning' as ErrorSeverity,
    description: 'The Cinacoin relay connection was lost.',
  },
  REQUEST_TIMEOUT: {
    code: 5008,
    identifier: 'REQUEST_TIMEOUT',
    severity: 'warning' as ErrorSeverity,
    description: 'Cinacoin request timed out.',
  },
} as const;

// ============================================================================
// SIGNING errors — 6000-6099
// ============================================================================

export const SIGNING = {
  USER_REJECTED: {
    code: 6000,
    identifier: 'USER_REJECTED',
    severity: 'info' as ErrorSeverity,
    description: 'The user rejected the signing request in their wallet.',
  },
  SIGNING_FAILED: {
    code: 6001,
    identifier: 'SIGNING_FAILED',
    severity: 'error' as ErrorSeverity,
    description: 'The signing operation failed for an unknown reason.',
  },
  INVALID_MESSAGE: {
    code: 6002,
    identifier: 'INVALID_MESSAGE',
    severity: 'error' as ErrorSeverity,
    description: 'The message to be signed is malformed or empty.',
  },
  UNSUPPORTED_SIGNING_METHOD: {
    code: 6003,
    identifier: 'UNSUPPORTED_SIGNING_METHOD',
    severity: 'error' as ErrorSeverity,
    description: 'The requested signing method is not supported.',
  },
  MESSAGE_TOO_LARGE: {
    code: 6004,
    identifier: 'MESSAGE_TOO_LARGE',
    severity: 'error' as ErrorSeverity,
    description: 'The message exceeds the maximum size allowed for signing.',
  },
  INVALID_TYPED_DATA: {
    code: 6005,
    identifier: 'INVALID_TYPED_DATA',
    severity: 'error' as ErrorSeverity,
    description: 'EIP-712 typed data structure is invalid.',
  },
  SIGNING_TIMEOUT: {
    code: 6006,
    identifier: 'SIGNING_TIMEOUT',
    severity: 'warning' as ErrorSeverity,
    description: 'Signing request timed out waiting for user action.',
  },
} as const;

// ============================================================================
// NETWORK errors — 7000-7099
// ============================================================================

export const NETWORK = {
  OFFLINE: {
    code: 7000,
    identifier: 'OFFLINE',
    severity: 'error' as ErrorSeverity,
    description: 'No network connectivity detected.',
  },
  RPC_UNREACHABLE: {
    code: 7001,
    identifier: 'RPC_UNREACHABLE',
    severity: 'error' as ErrorSeverity,
    description: 'The RPC endpoint is unreachable.',
  },
  RATE_LIMITED: {
    code: 7002,
    identifier: 'RATE_LIMITED',
    severity: 'warning' as ErrorSeverity,
    description: 'Request rate limit exceeded by the network provider.',
  },
  HTTP_ERROR: {
    code: 7003,
    identifier: 'HTTP_ERROR',
    severity: 'error' as ErrorSeverity,
    description: 'An unexpected HTTP error status was returned.',
  },
  INVALID_RESPONSE: {
    code: 7004,
    identifier: 'INVALID_RESPONSE',
    severity: 'error' as ErrorSeverity,
    description: 'The network response could not be parsed.',
  },
  NETWORK_TIMEOUT: {
    code: 7005,
    identifier: 'NETWORK_TIMEOUT',
    severity: 'warning' as ErrorSeverity,
    description: 'Network request exceeded the configured timeout.',
  },
  NETWORK_UNSTABLE: {
    code: 7006,
    identifier: 'NETWORK_UNSTABLE',
    severity: 'warning' as ErrorSeverity,
    description: 'Network connectivity is intermittent.',
  },
} as const;

// ============================================================================
// SDK errors — 8000-8099
// ============================================================================

export const SDK = {
  NOT_INITIALIZED: {
    code: 8000,
    identifier: 'NOT_INITIALIZED',
    severity: 'error' as ErrorSeverity,
    description: 'The SDK has not been initialized. Call initialize() first.',
  },
  ALREADY_INITIALIZED: {
    code: 8001,
    identifier: 'ALREADY_INITIALIZED',
    severity: 'warning' as ErrorSeverity,
    description: 'The SDK is already initialized. Call reset() first.',
  },
  INVALID_CONFIG: {
    code: 8002,
    identifier: 'INVALID_CONFIG',
    severity: 'error' as ErrorSeverity,
    description: 'The SDK configuration is invalid or incomplete.',
  },
  VERSION_MISMATCH: {
    code: 8003,
    identifier: 'VERSION_MISMATCH',
    severity: 'error' as ErrorSeverity,
    description: 'SDK version is incompatible with the expected version.',
  },
  MISSING_DEPENDENCY: {
    code: 8004,
    identifier: 'MISSING_DEPENDENCY',
    severity: 'error' as ErrorSeverity,
    description: 'A required dependency is missing from the environment.',
  },
  METHOD_NOT_IMPLEMENTED: {
    code: 8005,
    identifier: 'METHOD_NOT_IMPLEMENTED',
    severity: 'error' as ErrorSeverity,
    description: 'The called method has not been implemented.',
  },
  INVALID_ARGUMENT: {
    code: 8006,
    identifier: 'INVALID_ARGUMENT',
    severity: 'error' as ErrorSeverity,
    description: 'An argument passed to the SDK method is invalid.',
  },
  STORAGE_ERROR: {
    code: 8007,
    identifier: 'STORAGE_ERROR',
    severity: 'error' as ErrorSeverity,
    description: 'Failed to read or write SDK persistent storage.',
  },
  DEPRECATED: {
    code: 8008,
    identifier: 'DEPRECATED',
    severity: 'info' as ErrorSeverity,
    description: 'The called API is deprecated and will be removed.',
  },
} as const;

// ============================================================================
// SECURITY errors — 9000-9099
// ============================================================================

export const SECURITY = {
  SESSION_HIJACK_DETECTED: {
    code: 9000,
    identifier: 'SESSION_HIJACK_DETECTED',
    severity: 'critical' as ErrorSeverity,
    description: 'Session hijacking indicators detected. Session terminated.',
  },
  MITM_DETECTED: {
    code: 9001,
    identifier: 'MITM_DETECTED',
    severity: 'critical' as ErrorSeverity,
    description: 'Potential man-in-the-middle attack detected.',
  },
  TAMPERED_DATA: {
    code: 9002,
    identifier: 'TAMPERED_DATA',
    severity: 'critical' as ErrorSeverity,
    description: 'Data integrity check failed — data may have been tampered with.',
  },
  ORIGIN_MISMATCH: {
    code: 9003,
    identifier: 'ORIGIN_MISMATCH',
    severity: 'critical' as ErrorSeverity,
    description: 'Request origin does not match the registered origin.',
  },
  SUSPICIOUS_ACTIVITY: {
    code: 9004,
    identifier: 'SUSPICIOUS_ACTIVITY',
    severity: 'critical' as ErrorSeverity,
    description: 'Unusual activity pattern detected on this session.',
  },
  CERTIFICATE_PINNING_FAILED: {
    code: 9005,
    identifier: 'CERTIFICATE_PINNING_FAILED',
    severity: 'critical' as ErrorSeverity,
    description: 'Server certificate does not match pinned certificate.',
  },
  REPLAY_ATTACK_DETECTED: {
    code: 9006,
    identifier: 'REPLAY_ATTACK_DETECTED',
    severity: 'critical' as ErrorSeverity,
    description: 'A replayed message or transaction was detected.',
  },
} as const;

// ============================================================================
// All error codes lookup map
// ============================================================================

const ALL_CATEGORIES = [
  CONNECTION,
  AUTHENTICATION,
  CHAIN,
  TRANSACTION,
  WALLET_CONNECT,
  SIGNING,
  NETWORK,
  SDK,
  SECURITY,
] as const;

/** Flat map of all error codes keyed by numeric code. */
export const ERROR_CODES: Map<number, ErrorCodeDefinition> = (() => {
  const map = new Map<number, ErrorCodeDefinition>();
  for (const category of ALL_CATEGORIES) {
    for (const def of Object.values(category)) {
      map.set(def.code, def);
    }
  }
  return map;
})();

/** Total number of defined error codes. */
export const ERROR_CODE_COUNT = ERROR_CODES.size;

/**
 * Look up an error code definition by its numeric code.
 * Returns undefined if not found.
 */
export function getErrorCode(code: number): ErrorCodeDefinition | undefined {
  return ERROR_CODES.get(code);
}

/**
 * Look up an error code definition by its string identifier.
 * Returns undefined if not found.
 */
export function getErrorByIdentifier(identifier: string): ErrorCodeDefinition | undefined {
  for (const def of ERROR_CODES.values()) {
    if (def.identifier === identifier) return def;
  }
  return undefined;
}

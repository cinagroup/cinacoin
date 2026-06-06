/**
 * WalletConnect v2 type definitions.
 *
 * Covers pairing, session, proposal, JSON-RPC, relay, notifications,
 * error codes, and envelope types — fully compatible with the WC v2
 * protocol specification.
 */
// ============================================================
// WC v2 Error Codes (per WC v2 spec)
// ============================================================
/** Standard WC v2 pairing error codes. */
export const WC_PAIRING_ERRORS = {
    /** Invalid pairing proposal. */
    INVALID_PAIRING: 1000,
    /** Pairing proposal expiry is too short. */
    USER_REJECTED: 1001,
    /** Pairing request expired. */
    USER_REJECTED_CHAINS: 1002,
    /** Pairing proposal has invalid parameters. */
    USER_REJECTED_EVM_CHAINS: 1003,
    /** Pairing proposal expiry is too short. */
    USER_REJECTED_STATUS: 1004,
};
/** Standard WC v2 session error codes. */
export const WC_SESSION_ERRORS = {
    /** User rejected the session. */
    USER_REJECTED: 5000,
    /** User rejected chains. */
    USER_REJECTED_CHAINS: 5001,
    /** User rejected EVM chains. */
    USER_REJECTED_EVM_CHAINS: 5002,
    /** User rejected status. */
    USER_REJECTED_STATUS: 5003,
    /** Unsupported chains requested. */
    UNSUPPORTED_CHAINS: 5004,
    /** Unsupported namespace key. */
    UNSUPPORTED_NAMESPACE_KEY: 5005,
    /** User rejected methods. */
    USER_REJECTED_METHODS: 5006,
    /** User rejected events. */
    USER_REJECTED_EVENTS: 5007,
};
/** JSON-RPC error codes (per JSON-RPC 2.0 spec). */
export const WC_JSON_RPC_ERRORS = {
    /** Invalid JSON received. */
    INVALID_REQUEST: -32600,
    /** Method not found. */
    METHOD_NOT_FOUND: -32601,
    /** Invalid method parameters. */
    INVALID_PARAMS: -32602,
    /** Internal error. */
    INTERNAL_ERROR: -32603,
    /** Parse error. */
    PARSE_ERROR: -32700,
    /** Request timed out. */
    REQUEST_TIMEOUT: -32003,
    /** Session expired. */
    SESSION_EXPIRED: -32004,
    /** Session not found. */
    SESSION_NOT_FOUND: -32005,
    /** Method not supported. */
    UNSUPPORTED_METHOD: -32006,
};
//# sourceMappingURL=types.js.map
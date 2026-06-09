/**
 * WalletConnectClient integration tests.
 *
 * Tests:
 * - Client creation
 * - init() connects to relay
 * - connect() returns URI (pairing mode)
 * - connect({ uri }) returns session (connection mode)
 * - getPairings() returns active pairings
 * - getSession() returns null before connection
 * - isConnected() before/after
 * - request() throws without session
 * - disconnect() cleans up
 * - Event listeners (on/once/off)
 * - Static helpers (isValidUri, parseUri, getDefaultNamespaces)
 */
export {};
//# sourceMappingURL=client.test.d.ts.map
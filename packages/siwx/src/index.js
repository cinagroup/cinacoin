/**
 * @cinaconnect/siwx — Sign-In with Cross-chain (SIWX)
 *
 * Unified authentication across EVM (EIP-4361), Solana (ed25519),
 * Bitcoin (BIP-322), TON, Tron, and custom chains.
 *
 * @packageDocumentation
 */
// Core SIWX functions
export { createSignInMessage, verifySignIn, SIWXRegistry, defaultRegistry } from './siwx.js';
// Chain adapters
export { createEvmSignInMessage, verifyEvmSignature, parseEvmMessage, } from './chains/evm.js';
export { createSolanaSignInMessage, verifySolanaSignature, parseSolanaMessage, } from './chains/solana.js';
export { createBitcoinSignInMessage, verifyBitcoinSignature, parseBitcoinMessage, } from './chains/bitcoin.js';
// Verifier Registry
export { VerifierRegistry, defaultVerifierRegistry, } from './verifier-registry.js';
// Cloud Authentication (Reown Dashboard compatible)
export { CloudAuth, useCloudAuth } from './cloud-auth.js';
// React Hooks for Cloud Auth
export { useCloudSession, useCloudAuthEvents } from './cloud-hooks.js';
//# sourceMappingURL=index.js.map
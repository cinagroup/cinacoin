/**
 * @cinaconnect/siwx — Sign-In with Cross-chain (SIWX)
 *
 * Unified authentication across EVM (EIP-4361), Solana (ed25519),
 * Bitcoin (BIP-322), TON, Tron, and custom chains.
 *
 * @packageDocumentation
 */
export { createSignInMessage, verifySignIn, SIWXAdapter, SIWXRegistry, defaultRegistry } from './siwx.js';
export { createEvmSignInMessage, verifyEvmSignature, parseEvmMessage, } from './chains/evm.js';
export { createSolanaSignInMessage, verifySolanaSignature, parseSolanaMessage, } from './chains/solana.js';
export { createBitcoinSignInMessage, verifyBitcoinSignature, parseBitcoinMessage, } from './chains/bitcoin.js';
export { VerifierRegistry, defaultVerifierRegistry, } from './verifier-registry.js';
export type { VerifierFn, VerifierDescriptor, RegisterVerifierOptions, } from './verifier-registry.js';
export { CloudAuth, useCloudAuth } from './cloud-auth.js';
export type { CloudSession, VerifyResult, CloudAuthConfig, CloudAuthEvent, CloudAuthEventHandler, } from './cloud-auth.js';
export { useCloudSession, useCloudAuthEvents } from './cloud-hooks.js';
export type { ChainType, SIWXParams, SIWXResult, SIWXFormatOptions, SIWXVerifyInput, } from './types.js';
//# sourceMappingURL=index.d.ts.map
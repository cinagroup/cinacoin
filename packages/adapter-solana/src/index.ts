import { logger } from '@cinacoin/logger';
/**
 * Cinacoin Solana Adapter — Solana chain adapter package.
 *
 * Provides a {@link SolanaChainAdapter} that implements the
 * {@link ChainAdapter} interface from @cinacoin/core-sdk,
 * plus wallet connectors for Phantom, Solflare, and Wallet Standard.
 *
 * @packageDocumentation
 * @example
 * ```ts
 * import { SolanaChainAdapter, SOLANA_CHAINS, SOLANA_WALLETS } from '@cinacoin/adapter-solana';
 *
 * const adapter = new SolanaChainAdapter();
 * adapter.registerChains(SOLANA_CHAINS);
 *
 * // Connect to the first available wallet
 * const address = await adapter.connect('phantom');
 * logger.info('Connected:', address);
 *
 * // Query balance
 * const balance = await adapter.getBalance(address);
 * logger.info(`${balance} SOL`);
 *
 * // Transfer SOL
 * const sig = await adapter.transferSOL('recipient...', 0.01);
 * ```
 */

/* ------------------------------------------------------------------ */
/*  Adapter                                                            */
/* ------------------------------------------------------------------ */

export {
  SolanaChainAdapter,
  SOLANA_CHAINS,
  SOLANA_WALLETS,
  SOLANA_PROGRAMS,
} from './SolanaAdapter.js';

export type { SolanaWalletInfo } from './SolanaAdapter.js';

/* ------------------------------------------------------------------ */
/*  Connectors                                                         */
/* ------------------------------------------------------------------ */

export { PhantomWalletConnector } from './connectors/phantom.js';
export { SolflareWalletConnector } from './connectors/solflare.js';
export { WalletStandardConnector } from './connectors/wallet-standard.js';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export { isValidSolanaAddress, isValidBase58 } from './utils.js';

export type {
  SolanaNetwork,
  SolanaChainPreset,
  SolanaAccount,
  SolanaInstruction,
  SolanaAccountMeta,
  SolanaTransaction,
  SolanaSignedTransaction,
  SolanaTokenAccount,
  SolanaTokenBalance,
  SolanaTransactionRecord,
  SolanaTransactionDetail,
  SolanaFeeEstimate,
  SolanaWalletProvider,
  SolanaTransactionLike,
  SolanaConnector,
  SolanaPlatform,
  SolanaFeature,
} from './types.js';

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

export {
  lamportsToSol,
  solToLamports,
  base58Encode,
  base58Decode,
  deriveAssociatedTokenAddress,
  serializeTransaction,
  deserializeTransaction,
} from './utils.js';

/**
 * Package version.
 */
export const VERSION = '0.1.0';

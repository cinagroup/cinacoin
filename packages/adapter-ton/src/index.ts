import { logger } from '@cinacoin/logger';
/**
 * Cinacoin TON Adapter — TON chain adapter package.
 *
 * Provides a {@link TonChainAdapter} that implements the
 * {@link ChainAdapter} interface from @cinacoin/core-sdk,
 * backed by the `@ton/ton` RPC client.
 *
 * @example
 * ```ts
 * import { TonChainAdapter, TON_CHAINS } from '@cinacoin/adapter-ton';
 *
 * const adapter = new TonChainAdapter();
 * adapter.registerChains(TON_CHAINS);
 *
 * const balance = await adapter.getBalance('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N');
 * logger.info(`${balance} nanotons`);
 *
 * const jettonBal = await adapter.getJettonBalance(walletAddr, jettonMaster);
 * logger.info(`${jettonBal} jetton units`);
 * ```
 *
 * @packageDocumentation
 */

/* ------------------------------------------------------------------ */
/*  Adapter                                                            */
/* ------------------------------------------------------------------ */

export { TonChainAdapter, TON_CHAINS } from './TonChainAdapter.js';

export {
  isValidTONAddress,
  normalizeTONAddress,
  isBounceable,
  isNonBounceable,
  CinacoinError,
} from './TonChainAdapter.js';

/**
 * Package version.
 */
export { VERSION } from './TonChainAdapter.js';

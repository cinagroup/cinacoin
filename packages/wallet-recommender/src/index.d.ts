/**
 * @cinaconnect/wallet-recommender
 *
 * CinaConnect Wallet Recommender Engine — intelligent wallet suggestions.
 *
 * @example
 * ```ts
 * import { WalletRecommender } from '@cinaconnect/wallet-recommender';
 *
 * const recommender = new WalletRecommender({
 *   targetChain: 'evm',
 *   platform: 'browser',
 * });
 *
 * recommender.registerWallets(wallets);
 * const top = recommender.recommend(3);
 * ```
 */
export { WalletRecommender } from "./recommender.js.js";
export type { WalletEntry, UserBehavior } from "./recommender.js.js";
export { scoreWallet, getChainCompatibleWallets, DEFAULT_WEIGHTS, } from "./scoring.js.js";
export type { RecommendationContext, ScoringWeights, WalletRecommendation, } from "./scoring.js.js";
//# sourceMappingURL=index.d.ts.map
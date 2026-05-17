/**
 * Wallet Recommender Engine
 *
 * Intelligent wallet recommendations based on chain, platform, user behavior, and EIP-6963 detection.
 */
import { scoreWallet, getChainCompatibleWallets, DEFAULT_WEIGHTS } from "./scoring.js.js";
/**
 * WalletRecommender — the main recommendation engine.
 */
export class WalletRecommender {
    constructor(context, behavior, weights) {
        this.wallets = [];
        this.context = {
            targetChain: context?.targetChain ?? "evm",
            targetChainId: context?.targetChainId,
            platform: context?.platform ?? "browser",
            isMobile: context?.isMobile ?? false,
            ...context,
        };
        this.behavior = {
            history: behavior?.history ?? [],
            preferredChain: behavior?.preferredChain,
            preferredPlatform: behavior?.preferredPlatform,
            successRates: behavior?.successRates ?? {},
            ...behavior,
        };
        this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    }
    /**
     * Register available wallets.
     */
    registerWallets(wallets) {
        this.wallets = wallets;
    }
    /**
     * Update the recommendation context.
     */
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
    /**
     * Update user behavior profile.
     */
    setBehavior(behavior) {
        this.behavior = { ...this.behavior, ...behavior };
    }
    /**
     * Update scoring weights.
     */
    setWeights(weights) {
        this.weights = { ...this.weights, ...weights };
    }
    /**
     * Get ranked wallet recommendations.
     */
    recommend(limit = 10) {
        // Filter to chain-compatible wallets
        const compatible = getChainCompatibleWallets(this.wallets, this.context.targetChain, this.context.targetChainId);
        // Score and rank
        const scored = compatible.map((wallet) => scoreWallet(wallet, this.context, this.behavior, this.weights));
        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit);
    }
    /**
     * Get the single best wallet.
     */
    getBestWallet() {
        const recommendations = this.recommend(1);
        return recommendations[0] ?? null;
    }
    /**
     * Record a wallet usage event for behavior learning.
     */
    recordUsage(walletId, success) {
        // Add to history (most recent first)
        this.behavior.history = this.behavior.history.filter((id) => id !== walletId);
        this.behavior.history.unshift(walletId);
        // Update success rate
        const prev = this.behavior.successRates[walletId] ?? 0;
        const count = Object.keys(this.behavior.successRates).filter((k) => this.behavior.history.includes(k)).length;
        this.behavior.successRates[walletId] = success
            ? Math.min(1, prev + 1 / (count + 1))
            : Math.max(0, prev - 1 / (count + 1));
    }
    /**
     * Get installed EIP-6963 wallets (boosted in recommendations).
     */
    getInstalledWallets() {
        return this.wallets.filter((w) => w.isEIP6963Installed);
    }
}
//# sourceMappingURL=recommender.js.map
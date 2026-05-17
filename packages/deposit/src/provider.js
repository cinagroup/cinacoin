import { DepositStatus, } from "./types";
import { EXCHANGES } from "./exchanges";
/**
 * Core deposit service. Handles exchange lookups, URL generation,
 * deposit initiation, and status tracking.
 */
export class DepositService {
    constructor(customExchanges) {
        const sources = customExchanges ?? EXCHANGES;
        this.exchanges = new Map(sources.map((ex) => [ex.id, ex]));
    }
    /** Returns the list of supported exchange identifiers. */
    getSupportedExchanges() {
        return Array.from(this.exchanges.keys());
    }
    /**
     * Returns assets available on the specified exchange.
     * @throws If the exchange is not found.
     */
    getSupportedAssets(exchangeId) {
        const exchange = this.exchanges.get(exchangeId);
        if (!exchange) {
            throw new Error(`Exchange "${exchangeId}" is not supported.`);
        }
        return exchange.supportedAssets;
    }
    /**
     * Returns full exchange info by identifier.
     */
    getExchangeInfo(exchangeId) {
        return this.exchanges.get(exchangeId);
    }
    /**
     * Returns all configured exchanges.
     */
    getAllExchanges() {
        return Array.from(this.exchanges.values());
    }
    /**
     * Generates a deposit redirect URL for the given parameters.
     * Each exchange uses its own URL scheme / deep-link format.
     */
    getDepositUrl(params) {
        const exchange = this.exchanges.get(params.exchangeId);
        if (!exchange) {
            throw new Error(`Exchange "${params.exchangeId}" not found.`);
        }
        const { asset, network, receivingAddress } = params;
        switch (exchange.id) {
            case "binance":
                return this._buildBinanceUrl(asset, network, receivingAddress, exchange.baseUrl);
            case "okx":
                return this._buildOKXUrl(asset, network, receivingAddress, exchange.baseUrl);
            case "bybit":
                return this._buildBybitUrl(asset, network, receivingAddress, exchange.baseUrl);
            case "kucoin":
                return this._buildKuCoinUrl(asset, network, receivingAddress, exchange.baseUrl);
            case "coinbase":
                return this._buildCoinbaseUrl(asset, network, receivingAddress, exchange.baseUrl);
            default:
                return `${exchange.baseUrl}?asset=${asset}&network=${network}`;
        }
    }
    /**
     * Initiates a full deposit flow. Returns a DepositResult with
     * a tracking ID and redirect URL.
     */
    initiateDeposit(request) {
        const exchange = this.exchanges.get(request.exchangeId);
        if (!exchange) {
            throw new Error(`Exchange "${request.exchangeId}" not found.`);
        }
        // Validate minimum amount
        if (request.amount < exchange.minAmount) {
            throw new Error(`Minimum deposit on ${exchange.name} is ${exchange.minAmount}.`);
        }
        const depositUrl = this.getDepositUrl({
            exchangeId: request.exchangeId,
            asset: request.asset,
            network: request.network,
            receivingAddress: request.receivingAddress,
        });
        const depositId = this._generateDepositId(request);
        const now = new Date().toISOString();
        return {
            depositId,
            status: DepositStatus.PENDING,
            exchangeId: request.exchangeId,
            asset: request.asset,
            network: request.network,
            amount: request.amount,
            depositUrl,
            createdAt: now,
            updatedAt: now,
        };
    }
    /**
     * Tracks the status of an existing deposit by its ID.
     * In production this would call a backend API or exchange webhook.
     */
    trackDeposit(params) {
        // In production, this would call a backend API that polls exchange
        // APIs or listens to webhooks for the actual on-chain / exchange status.
        // For now we return a placeholder. The hook layer handles polling.
        const now = new Date().toISOString();
        return {
            depositId: params.depositId,
            status: DepositStatus.PROCESSING,
            exchangeId: params.exchangeId ?? "unknown",
            asset: "unknown",
            network: "unknown",
            amount: 0,
            createdAt: now,
            updatedAt: now,
        };
    }
    // ── URL builders per exchange ──────────────────────────────────────
    _buildBinanceUrl(asset, network, address, baseUrl) {
        const url = new URL(baseUrl || "https://www.binance.com/en/my/wallet/account/deposit");
        url.searchParams.set("coin", asset.toUpperCase());
        url.searchParams.set("network", network.toUpperCase());
        if (address)
            url.searchParams.set("address", address);
        return url.toString();
    }
    _buildOKXUrl(asset, network, address, baseUrl) {
        const url = new URL(baseUrl || "https://www.okx.com/deposit");
        url.searchParams.set("currency", asset.toLowerCase());
        url.searchParams.set("chain", network);
        if (address)
            url.searchParams.set("address", address);
        return url.toString();
    }
    _buildBybitUrl(asset, network, address, baseUrl) {
        const url = new URL(baseUrl || "https://www.bybit.com/en/my-account/assets/deposit");
        url.searchParams.set("coin", asset.toUpperCase());
        url.searchParams.set("chain", network);
        if (address)
            url.searchParams.set("address", address);
        return url.toString();
    }
    _buildKuCoinUrl(asset, network, address, baseUrl) {
        const url = new URL(baseUrl || "https://www.kucoin.com/account/deposit");
        url.searchParams.set("coin", asset.toUpperCase());
        url.searchParams.set("chain", network);
        if (address)
            url.searchParams.set("address", address);
        return url.toString();
    }
    _buildCoinbaseUrl(asset, network, address, baseUrl) {
        const url = new URL(baseUrl || "https://www.coinbase.com/assets/send");
        url.searchParams.set("asset", asset.toLowerCase());
        url.searchParams.set("network", network);
        if (address)
            url.searchParams.set("address", address);
        return url.toString();
    }
    _generateDepositId(request) {
        const ts = Date.now().toString(36);
        const hash = btoa(`${request.exchangeId}:${request.asset}:${request.network}:${ts}`).replace(/[^a-zA-Z0-9]/g, "");
        return `dep_${hash.slice(0, 16)}`;
    }
}
/** Singleton instance — use this for the default service. */
export const depositService = new DepositService();
//# sourceMappingURL=provider.js.map
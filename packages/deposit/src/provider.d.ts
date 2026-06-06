import { ExchangeInfo, DepositRequest, DepositResult, DepositUrlParams, TrackDepositParams } from "./types";
/**
 * Core deposit service. Handles exchange lookups, URL generation,
 * deposit initiation, and status tracking.
 */
export declare class DepositService {
    private exchanges;
    constructor(customExchanges?: ExchangeInfo[]);
    /** Returns the list of supported exchange identifiers. */
    getSupportedExchanges(): string[];
    /**
     * Returns assets available on the specified exchange.
     * @throws If the exchange is not found.
     */
    getSupportedAssets(exchangeId: string): import("./types").AssetInfo[];
    /**
     * Returns full exchange info by identifier.
     */
    getExchangeInfo(exchangeId: string): ExchangeInfo | undefined;
    /**
     * Returns all configured exchanges.
     */
    getAllExchanges(): ExchangeInfo[];
    /**
     * Generates a deposit redirect URL for the given parameters.
     * Each exchange uses its own URL scheme / deep-link format.
     */
    getDepositUrl(params: DepositUrlParams): string;
    /**
     * Initiates a full deposit flow. Returns a DepositResult with
     * a tracking ID and redirect URL.
     */
    initiateDeposit(request: DepositRequest): DepositResult;
    /**
     * Tracks the status of an existing deposit by its ID.
     * In production this would call a backend API or exchange webhook.
     */
    trackDeposit(params: TrackDepositParams): DepositResult;
    private _buildBinanceUrl;
    private _buildOKXUrl;
    private _buildBybitUrl;
    private _buildKuCoinUrl;
    private _buildCoinbaseUrl;
    private _generateDepositId;
}
/** Singleton instance — use this for the default service. */
export declare const depositService: DepositService;
//# sourceMappingURL=provider.d.ts.map
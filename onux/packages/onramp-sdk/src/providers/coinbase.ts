/**
 * Coinbase Provider
 *
 * Integration with Coinbase Pay/Onramp widget and API.
 * Documentation: https://docs.cloud.coinbase.com/pay-sdk/docs
 */

import type { OnRampProviderAdapter } from "../aggregator.js";
import type { OnRampProvider, OnRampQuote, OnRampQuoteParams, OnRampWidgetParams } from "../types.js";

const COINBASE_WIDGET_BASE = "https://pay.coinbase.com/buy";
const COINBASE_API_BASE = "https://api.coinbase.com/v2";

export interface CoinbaseConfig {
  /** Coinbase Pay API key / App ID */
  appId: string;
  /** Environment */
  environment: "sandbox" | "production";
}

export class CoinbaseProvider implements OnRampProviderAdapter {
  public readonly id = "coinbase";

  private config: CoinbaseConfig;

  constructor(config: CoinbaseConfig) {
    this.config = config;
  }

  getProviderInfo(): OnRampProvider {
    return {
      id: "coinbase",
      name: "Coinbase",
      icon: "https://dynamic-assets.coinbase.com/image/upload/coinbase-logo.svg",
      supportedCurrencies: ["USD", "EUR", "GBP", "CAD", "SGD", "AUD"],
      supportedPaymentMethods: ["credit_card", "debit_card", "bank_transfer", "apple_pay", "coinbase_account"],
      fees: {
        networkFeeBps: 100,
        providerFeeBps: 349,
        fixedFee: 3.99,
        totalFeePercent: 4.49,
      },
      regions: ["US", "CA", "GB", "DE", "FR", "AU", "SG", "NL", "IE", "ES", "IT"],
      minPurchaseAmount: 2,
      maxPurchaseAmount: 25000,
      estimatedTimeMinutes: 3,
      requiresKyc: false,
    };
  }

  async getQuote(params: OnRampQuoteParams): Promise<OnRampQuote> {
    const info = this.getProviderInfo();

    try {
      const url = new URL(`${COINBASE_API_BASE}/prices/${params.cryptoToken.toUpperCase()}-${params.fiatCurrency.toUpperCase()}/spot`);
      const res = await fetch(url.toString());

      if (res.ok) {
        const data = await res.json();
        const exchangeRate = parseFloat(data.data?.amount || "0");
        const cryptoAmount = exchangeRate > 0 ? params.fiatAmount / exchangeRate : 0;
        const totalCost = params.fiatAmount * (info.fees.totalFeePercent / 100) + info.fees.fixedFee;

        return {
          provider: "coinbase",
          providerName: info.name,
          fiatAmount: params.fiatAmount,
          fiatCurrency: params.fiatCurrency,
          cryptoAmount,
          cryptoToken: params.cryptoToken,
          exchangeRate,
          totalCost,
          fees: info.fees,
          estimatedTime: info.estimatedTimeMinutes,
          requiresKyc: info.requiresKyc,
          paymentMethods: info.supportedPaymentMethods,
          regions: info.regions,
          expiresAt: Date.now() + 60_000,
        };
      }
    } catch {
      // Fallback
    }

    return this.estimateQuote(params, info);
  }

  getWidgetUrl(params: OnRampWidgetParams): string {
    const baseUrl = this.config.environment === "sandbox"
      ? "https://pay.coinbase.com/test/buy"
      : COINBASE_WIDGET_BASE;

    const url = new URL(baseUrl);
    url.searchParams.set("appId", this.config.appId);
    url.searchParams.set("destinationWallets", JSON.stringify([{
      address: params.destinationAddress,
      blockchains: ["ethereum", "base", "arbitrum", "polygon", "solana"],
    }]));

    if (params.defaultCryptoToken) {
      url.searchParams.set("defaultAsset", params.defaultCryptoToken.toUpperCase());
    }
    if (params.defaultFiatAmount) {
      url.searchParams.set("presetFiatAmount", params.defaultFiatAmount.toString());
    }
    if (params.defaultFiatCurrency) {
      url.searchParams.set("defaultFiatCurrency", params.defaultFiatCurrency);
    }
    if (params.redirectUrl) {
      url.searchParams.set("redirectUrl", params.redirectUrl);
    }

    return url.toString();
  }

  private estimateQuote(
    params: OnRampQuoteParams,
    info: OnRampProvider,
  ): OnRampQuote {
    const estimatedRate = 1 / 3000;
    const cryptoAmount = params.fiatAmount * estimatedRate;
    const totalCost = params.fiatAmount * (info.fees.totalFeePercent / 100) + info.fees.fixedFee;

    return {
      provider: "coinbase",
      providerName: info.name,
      fiatAmount: params.fiatAmount,
      fiatCurrency: params.fiatCurrency,
      cryptoAmount,
      cryptoToken: params.cryptoToken,
      exchangeRate: estimatedRate,
      totalCost,
      fees: info.fees,
      estimatedTime: info.estimatedTimeMinutes,
      requiresKyc: info.requiresKyc,
      paymentMethods: info.supportedPaymentMethods,
      regions: info.regions,
      expiresAt: Date.now() + 60_000,
    };
  }
}

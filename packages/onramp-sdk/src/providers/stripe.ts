/**
 * Stripe Provider
 *
 * Integration with Stripe Crypto Onramp API and widget.
 * Documentation: https://docs.stripe.com/crypto-onramp
 */

import type { OnRampProviderAdapter } from "../aggregator.js";
import type { OnRampProvider, OnRampQuote, OnRampQuoteParams, OnRampWidgetParams } from "../types.js";

const STRIPE_ONRAMP_BASE = "https://link.stripe.com/v1/onramp";
const STRIPE_API_BASE = "https://api.stripe.com/v1";

export interface StripeConfig {
  /** Stripe publishable key */
  publishableKey: string;
  /** Stripe account ID (Connect) */
  stripeAccount?: string;
  /** Environment */
  environment: "sandbox" | "production";
}

export class StripeProvider implements OnRampProviderAdapter {
  public readonly id = "stripe";

  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.config = config;
  }

  getProviderInfo(): OnRampProvider {
    return {
      id: "stripe",
      name: "Stripe",
      icon: "https://js.stripe.com/v3/fingerprinted/img/logo-795c53631779b5a85e7e5b6210241a69.svg",
      supportedCurrencies: ["USD", "EUR", "GBP", "CAD", "AUD", "SGD", "JPY", "HKD"],
      supportedPaymentMethods: ["credit_card", "debit_card", "bank_transfer", "apple_pay", "google_pay", "link"],
      fees: {
        networkFeeBps: 90,
        providerFeeBps: 290,
        fixedFee: 2.50,
        totalFeePercent: 3.8,
      },
      regions: ["US", "CA", "GB", "AU", "DE", "FR", "JP", "SG", "HK", "NL", "BE", "IE", "ES", "IT"],
      minPurchaseAmount: 5,
      maxPurchaseAmount: 20000,
      estimatedTimeMinutes: 5,
      requiresKyc: false,
    };
  }

  async getQuote(params: OnRampQuoteParams): Promise<OnRampQuote> {
    const info = this.getProviderInfo();

    try {
      // Stripe onramp API
      const url = new URL(`${STRIPE_API_BASE}/onramp/quote`);
      url.searchParams.set("currency", params.cryptoToken.toUpperCase());
      url.searchParams.set("amount", params.fiatAmount.toString());
      url.searchParams.set("fiat_currency", params.fiatCurrency.toLowerCase());

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.config.publishableKey}`,
          "Stripe-Version": "2023-10-16",
          ...(this.config.stripeAccount ? { "Stripe-Account": this.config.stripeAccount } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        const exchangeRate = data.unit_price || 0;
        const cryptoAmount = params.fiatAmount / exchangeRate;
        const totalCost = params.fiatAmount * (info.fees.totalFeePercent / 100) + info.fees.fixedFee;

        return {
          provider: "stripe",
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
      // Fallback to estimate
    }

    return this.estimateQuote(params, info);
  }

  getWidgetUrl(params: OnRampWidgetParams): string {
    const baseUrl = this.config.environment === "sandbox"
      ? "https://link.stripe.com/test/v1/onramp"
      : STRIPE_ONRAMP_BASE;

    const url = new URL(baseUrl);
    url.searchParams.set("client_reference_id", params.destinationAddress);

    if (params.defaultCryptoToken) {
      url.searchParams.set("default_asset", params.defaultCryptoToken.toUpperCase());
    }
    if (params.defaultFiatAmount) {
      url.searchParams.set("default_amount", params.defaultFiatAmount.toString());
    }
    if (params.defaultFiatCurrency) {
      url.searchParams.set("default_currency", params.defaultFiatCurrency.toLowerCase());
    }
    if (params.redirectUrl) {
      url.searchParams.set("redirect_url", params.redirectUrl);
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
      provider: "stripe",
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

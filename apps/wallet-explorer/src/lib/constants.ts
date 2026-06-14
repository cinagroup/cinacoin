/** Application-wide constants */

export const APP_NAME = 'Cinacoin Wallet Explorer';
export const APP_DESCRIPTION = 'Explore wallets, transactions, and balances on the Cinacoin blockchain';

/** Network fee estimate (CINA) */
export const NETWORK_FEE_ESTIMATE = '0.0021';
export const NETWORK_FEE_NUMBER = 0.0021;

/** Swap network fee estimate (CINA) */
export const SWAP_FEE_ESTIMATE = '0.005';

/** Clipboard copy feedback duration (ms) */
export const COPY_FEEDBACK_DURATION = 2000;

/** Success toast auto-dismiss duration (ms) */
export const TOAST_DURATION = 3000;

/** Mock wallet address used for demo */
export const MOCK_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

/** Ethereum address validation regex */
export const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

/** Transaction hash validation regex */
export const TX_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;

/** Supported swap tokens */
export const SWAP_TOKENS = ['CINA', 'USDT', 'ETH', 'BTC'] as const;
export type SwapToken = (typeof SWAP_TOKENS)[number];

/** Mock exchange rates for swap */
export const SWAP_RATES: Record<string, number> = {
  'CINA-USDT': 0.85,
  'CINA-ETH': 0.00035,
  'CINA-BTC': 0.000015,
  'USDT-CINA': 1.18,
  'ETH-CINA': 2857,
  'BTC-CINA': 66667,
};

/**
 * Payment flow type definitions.
 */

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

export interface Token {
  /** Symbol shown to user, e.g. "ETH", "USDC" */
  symbol: string;
  /** Human-readable name */
  name: string;
  /** Chain identifier this token lives on */
  chain: ChainId;
  /** Contract address (native tokens use zero address or empty string) */
  contractAddress: string;
  /** Number of decimals */
  decimals: number;
  /** Optional logo URL */
  iconUrl?: string;
}

// ---------------------------------------------------------------------------
// Chain
// ---------------------------------------------------------------------------

export type ChainId =
  | "ethereum"
  | "polygon"
  | "arbitrum"
  | "optimism"
  | "base"
  | "solana"
  | (string & {});

// ---------------------------------------------------------------------------
// Payment provider
// ---------------------------------------------------------------------------

export type ProviderId = "moonpay" | "coinbase" | "ramp" | "transak" | (string & {});

export interface PaymentProvider {
  id: ProviderId;
  name: string;
  logoUrl?: string;
  supportedChains: ChainId[];
  supportedTokens: string[];
}

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------

export type TransactionStatus = "pending" | "confirmed" | "failed";
export type TransactionType = "buy" | "send" | "receive";

export interface Transaction {
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  token: Token;
  amount: string;
  fiatValue?: string;
  from: string;
  to: string;
  timestamp: number;
  providerId?: ProviderId;
}

// ---------------------------------------------------------------------------
// Asset balance
// ---------------------------------------------------------------------------

export interface AssetBalance {
  token: Token;
  balance: string;
  fiatValue: string;
}

// ---------------------------------------------------------------------------
// Payment config (runtime options for the flow)
// ---------------------------------------------------------------------------

export interface PaymentConfig {
  /** Default fiat currency for onramp */
  defaultCurrency: string;
  /** Default chain */
  defaultChain: ChainId;
  /** Wallet address of the connected user */
  walletAddress: string;
  /** Available tokens */
  tokens: Token[];
  /** Available providers for buy */
  providers?: PaymentProvider[];
  /** API endpoint for transaction lookup */
  apiBaseUrl?: string;
}

// ---------------------------------------------------------------------------
// Hook return shape
// ---------------------------------------------------------------------------

export interface UsePaymentReturn {
  buy: (params: BuyParams) => Promise<Transaction>;
  send: (params: SendParams) => Promise<Transaction>;
  receive: (params: ReceiveParams) => Promise<ReceiveResult>;
  balances: AssetBalance[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export interface BuyParams {
  fiatAmount: string;
  currency: string;
  token: Token;
  providerId: ProviderId;
}

export interface SendParams {
  recipientAddress: string;
  token: Token;
  amount: string;
  chain: ChainId;
}

export interface ReceiveParams {
  token?: Token;
}

export interface ReceiveResult {
  address: string;
  qrData: string;
}

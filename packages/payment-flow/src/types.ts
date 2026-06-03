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

// ---------------------------------------------------------------------------
// Payment execution types (real on-chain flow)
// ---------------------------------------------------------------------------

/** On-chain payment lifecycle state. */
export type PaymentState =
  | "pending"
  | "processing"
  | "confirmed"
  | "failed"
  | "cancelled";

/** A payment request ready for execution. */
export interface PaymentRequest {
  /** Unique payment identifier (client-side, before tx submission). */
  id: string;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  /** Amount in smallest unit (wei / token base). */
  amount: bigint;
  /** Token contract address; empty string for native token. */
  tokenAddress: string;
  chainId: number;
  state: PaymentState;
  /** Optional data payload for contract calls. */
  data?: `0x${string}`;
  /** On-chain transaction hash (set after submission). */
  txHash?: `0x${string}`;
  /** Block number when confirmed. */
  blockNumber?: bigint;
  createdAt: number;
  updatedAt: number;
}

/** Parameters to create a payment request. */
export interface CreatePaymentParams {
  from: `0x${string}`;
  to: `0x${string}`;
  /** Human-readable amount (will be converted to base unit). */
  amount: string;
  tokenAddress?: string;
  chainId: number;
  /** Token decimals; defaults to 18 (native). */
  decimals?: number;
  data?: `0x${string}`;
}

/** Result of a successful payment execution. */
export interface PaymentResult {
  paymentId: string;
  txHash: `0x${string}`;
  blockNumber?: bigint;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  status: "confirmed" | "failed";
}

/** Gas estimate for a payment. */
export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCostWei: bigint;
}

/** Multisig approval step (optional). */
export interface MultisigApproval {
  signer: `0x${string}`;
  approved: boolean;
  timestamp: number;
  signature?: `0x${string}`;
}

/** Configuration for the payment executor. */
export interface ExecutorConfig {
  /** viem public client for reads. */
  publicClient: unknown; // viem PublicClient
  /** viem wallet client for writes (optional — can be injected). */
  walletClient?: unknown; // viem WalletClient
  /** Default confirmations to wait for. */
  confirmations?: number;
  /** Max polling attempts for tx receipt. */
  maxPollAttempts?: number;
  /** Base delay in ms for exponential backoff. */
  pollDelayMs?: number;
  /** Minimum required approvals for multisig. */
  multisigMinApprovals?: number;
  /** Known multisig signers. */
  multisigSigners?: `0x${string}`[];
}

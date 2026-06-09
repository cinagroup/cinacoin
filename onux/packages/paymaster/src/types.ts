import type { Address, Hex } from 'viem';

// ─── Core Types ──────────────────────────────────────────────────────────

/** Paymaster data returned for inclusion in a UserOperation */
export interface PaymasterData {
  paymaster: Address;
  paymasterData: Hex;
  paymasterVerificationGasLimit: bigint;
  paymasterPostOpGasLimit: bigint;
}

/** Paymaster verification result */
export interface PaymasterVerification {
  isValid: boolean;
  sponsor: Address;
  gasLimit: bigint;
}

/** Sponsorship request for a transaction */
export interface SponsorRequest {
  sender: Address;
  target: Address;
  callData: Hex;
  chainId: number;
  gasEstimate?: bigint;
}

/** Sponsorship result */
export interface SponsorResult {
  paymaster: Address;
  paymasterData: Hex;
  sponsorshipId: string;
}

/** Paymaster client configuration */
export interface PaymasterConfig {
  paymasterUrl: string;
  apiKey?: string;
}

// ─── VerifyingPaymaster Types ───────────────────────────────────────────

/** Decoded paymaster signature components. */
export interface PaymasterSignature {
  paymaster: Address;
  validUntil: bigint;
  validAfter: bigint;
  signature: Hex;
}

/** EIP-712 typed data signing function. */
export type SignTypedDataFn = (payload: {
  domain: { name: string; version: string; chainId: number; verifyingContract: Address };
  types: Record<string, { name: string; type: string }[]>;
  value: Record<string, unknown>;
}) => Promise<Hex>;

/** Gas budget strategy for sponsorship limits. */
export interface GasBudgetStrategy {
  /** Check whether a given gas cost should be sponsored. */
  check: (cost: bigint) => boolean;
  /** Maximum cost per single UserOp (wei, 0 = uncapped). */
  maxCostPerOp: bigint;
  /** Maximum number of UserOps per period (0 = uncapped). */
  maxOpsPerPeriod: number;
}

/** Built-in strategy names. */
export type GasBudgetStrategyName = 'uncapped' | 'conservative' | 'moderate' | 'generous';

/** Configuration for VerifyingPaymaster SDK. */
export interface VerifyingPaymasterConfig {
  /** The deployed VerifyingPaymaster contract address. */
  paymasterAddress: Address;

  /** The trusted signer's address (off-chain approval authority). */
  signerAddress: Address;

  /** Chain ID for EIP-712 domain. */
  chainId: number;

  /** Validity window for signatures in seconds (default: 300). */
  validityWindowSeconds?: number;

  /** EIP-712 typed data signing function. */
  signTypedData?: SignTypedDataFn;

  /** Gas budget strategy name or custom strategy object. */
  gasBudgetStrategy?: GasBudgetStrategyName | GasBudgetStrategy;

  /** Custom budget check callback. */
  budgetCheck?: (estimatedCost: bigint, opsInPeriod: number) => boolean;
}

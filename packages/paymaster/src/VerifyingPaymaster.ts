import type { Address, Hex } from 'viem';
import { encodeAbiParameters, parseAbiParameters, toHex, concat, pad, recoverTypedDataAddress, keccak256 } from 'viem';
import type {
  PaymasterData,
  PaymasterVerification,
  SponsorRequest,
  SponsorResult,
  PaymasterConfig,
  VerifyingPaymasterConfig,
  PaymasterSignature,
  GasBudgetStrategy,
  GasBudgetStrategyName,
  SignTypedDataFn,
} from './types.js';

/**
 * EIP-712 domain for the VerifyingPaymaster.
 */
const EIP712_DOMAIN = {
  name: 'CinaConnect VerifyingPaymaster',
  version: '1',
} as const;

/**
 * EIP-712 type definition for UserOpPaymasterData.
 */
const PAYMASTER_DATA_TYPES: Record<string, { name: string; type: string }[]> = {
  UserOpPaymasterData: [
    { name: 'userOpHash', type: 'bytes32' },
    { name: 'validUntil', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'maxGasCost', type: 'uint256' },
  ],
};

/**
 * Default validity window (in seconds) for paymaster signatures.
 */
const DEFAULT_VALIDITY_WINDOW = 300; // 5 minutes

/**
 * Gas budget strategy implementations.
 */
const GAS_BUDGET_STRATEGIES: Record<string, GasBudgetStrategy> = {
  /** Uncapped — sponsor all UserOps regardless of cost. */
  uncapped: {
    check: () => true,
    maxCostPerOp: 0n,
    maxOpsPerPeriod: 0,
  },
  /** Conservative — cap at ~$1 worth of gas at typical prices. */
  conservative: {
    check: (cost) => cost <= 5_000_000_000_000_000n, // 0.005 ETH
    maxCostPerOp: 5_000_000_000_000_000n,
    maxOpsPerPeriod: 100,
  },
  /** Moderate — cap at ~$5 worth of gas. */
  moderate: {
    check: (cost) => cost <= 25_000_000_000_000_000n, // 0.025 ETH
    maxCostPerOp: 25_000_000_000_000_000n,
    maxOpsPerPeriod: 500,
  },
  /** Generous — cap at ~$20 worth of gas. */
  generous: {
    check: (cost) => cost <= 100_000_000_000_000_000n, // 0.1 ETH
    maxCostPerOp: 100_000_000_000_000_000n,
    maxOpsPerPeriod: 1000,
  },
};

/**
 * VerifyingPaymaster SDK — generates paymasterAndData and verifies signatures
 * for the VerifyingPaymaster Solidity contract.
 *
 * This is the client-side SDK used by the dapp backend or signer service
 * to produce off-chain approvals for UserOps.
 *
 * ```ts
 * const pm = new VerifyingPaymaster({
 *   paymasterAddress: '0x...',
 *   signerAddress: '0x...',
 *   chainId: 1,
 * });
 *
 * const paymasterAndData = await pm.generatePaymasterAndData({
 *   userOpHash: '0x...',
 *   maxGasCost: 5000000000000000n,
 * });
 * ```
 */
export class VerifyingPaymaster {
  private readonly config: {
    paymasterAddress: Address;
    signerAddress: Address;
    chainId: number;
    validityWindowSeconds: number;
    signTypedData?: SignTypedDataFn;
    gasBudgetStrategy: GasBudgetStrategyName | GasBudgetStrategy;
    budgetCheck?: (estimatedCost: bigint, opsInPeriod: number) => boolean;
  };

  /** In-memory counter for ops sponsored in the current period. */
  private opsInPeriod = 0;
  /** Period start timestamp. */
  private periodStart = Date.now();
  /** Period length in ms (default: 1 hour). */
  private periodLengthMs = 3_600_000;

  constructor(config: VerifyingPaymasterConfig) {
    this.config = {
      validityWindowSeconds: DEFAULT_VALIDITY_WINDOW,
      gasBudgetStrategy: 'conservative',
      ...config,
    };
  }

  // ─── paymasterAndData generation ────────────────────────────────────────

  /**
   * Generate `paymasterAndData` for inclusion in a UserOperation.
   *
   * This encodes: paymaster address | validUntil | validAfter | signature
   *
   * @param params.userOpHash  The hash of the UserOp to sponsor.
   * @param params.maxGasCost  Maximum gas cost the signer authorizes (wei).
   * @param params.sign        Optional signing function. Defaults to requiring
   *                           `signTypedData` to be provided.
   * @returns Encoded `paymasterAndData` as Hex.
   */
  async generatePaymasterAndData(params: {
    userOpHash: Hex;
    maxGasCost?: bigint;
    sign?: (payload: { domain: typeof EIP712_DOMAIN; types: typeof PAYMASTER_DATA_TYPES; value: Record<string, unknown> }) => Promise<Hex>;
  }): Promise<Hex> {
    const validAfter = BigInt(Math.floor(Date.now() / 1000));
    const validUntil = validAfter + BigInt(this.config.validityWindowSeconds);
    const maxGasCost = params.maxGasCost ?? this.resolveMaxGasCost();

    // Check gas budget strategy
    const strategy = this.resolveStrategy();
    if (!strategy.check(maxGasCost)) {
      throw new Error(`Gas cost ${maxGasCost} exceeds strategy limit`);
    }

    // Build EIP-712 typed data
    const domain = {
      ...EIP712_DOMAIN,
      chainId: this.config.chainId,
      verifyingContract: this.config.paymasterAddress,
    };

    const value = {
      userOpHash: params.userOpHash,
      validUntil,
      validAfter,
      maxGasCost,
    };

    // Sign the typed data
    let signature: Hex;
    if (params.sign) {
      signature = await params.sign({ domain, types: PAYMASTER_DATA_TYPES, value });
    } else if (this.config.signTypedData) {
      signature = await this.config.signTypedData({ domain, types: PAYMASTER_DATA_TYPES, value });
    } else {
      throw new Error('No signing function provided — pass `sign` or configure `signTypedData`');
    }

    // Encode: validUntil (32) | validAfter (32) | signature (65)
    const encoded = concat([
      pad(toHex(validUntil), { size: 32 }),
      pad(toHex(validAfter), { size: 32 }),
      signature,
    ]);

    // Final paymasterAndData = paymaster address + encoded data
    return concat([this.config.paymasterAddress, encoded]);
  }

  // ─── Signature verification ─────────────────────────────────────────────

  /**
   * Verify a paymaster signature off-chain.
   *
   * Useful for the signer service to validate before signing,
   * or for auditing.
   *
   * @param params.userOpHash  The UserOp hash.
   * @param params.signature   The ECDSA signature (65 bytes).
   * @param params.validUntil  Valid-until timestamp.
   * @param params.validAfter  Valid-after timestamp.
   * @param params.maxGasCost  Maximum gas cost authorized.
   * @returns The recovered signer address.
   */
  async verifySignature(params: {
    userOpHash: Hex;
    signature: Hex;
    validUntil: bigint;
    validAfter: bigint;
    maxGasCost: bigint;
  }): Promise<Address> {
    const domain = {
      ...EIP712_DOMAIN,
      chainId: this.config.chainId,
      verifyingContract: this.config.paymasterAddress,
    };

    const signer = await recoverTypedDataAddress({
      domain,
      types: PAYMASTER_DATA_TYPES,
      primaryType: 'UserOpPaymasterData',
      message: {
        userOpHash: params.userOpHash,
        validUntil: params.validUntil,
        validAfter: params.validAfter,
        maxGasCost: params.maxGasCost,
      },
      signature: params.signature,
    });

    if (signer.toLowerCase() !== this.config.signerAddress.toLowerCase()) {
      throw new Error(`Signature verification failed: expected ${this.config.signerAddress}, got ${signer}`);
    }

    return signer;
  }

  /**
   * Decode `paymasterAndData` back into its components.
   *
   * @param paymasterAndData Encoded paymaster data.
   * @returns Decoded components.
   */
  static decodePaymasterAndData(paymasterAndData: Hex): PaymasterSignature {
    const bytes = paymasterAndData.startsWith('0x') ? paymasterAndData.slice(2) : paymasterAndData;

    if (bytes.length < (20 + 32 + 32 + 65) * 2) {
      throw new Error('paymasterAndData too short');
    }

    const paymaster = ('0x' + bytes.slice(0, 40)) as Address;
    const validUntil = BigInt('0x' + bytes.slice(40, 104));
    const validAfter = BigInt('0x' + bytes.slice(104, 168));
    const signature = ('0x' + bytes.slice(168)) as Hex;

    return { paymaster, validUntil, validAfter, signature };
  }

  // ─── Gas budget management ──────────────────────────────────────────────

  /**
   * Check if a UserOp should be sponsored based on the current strategy.
   *
   * @param estimatedGasCost Estimated gas cost in wei.
   * @returns Whether the UserOp should be sponsored.
   */
  shouldSponsor(estimatedGasCost: bigint): boolean {
    // Reset period counter if expired
    if (Date.now() - this.periodStart > this.periodLengthMs) {
      this.opsInPeriod = 0;
      this.periodStart = Date.now();
    }

    const strategy = this.resolveStrategy();

    // Check cost per op
    if (strategy.maxCostPerOp > 0n && estimatedGasCost > strategy.maxCostPerOp) {
      return false;
    }

    // Check ops per period
    if (strategy.maxOpsPerPeriod > 0 && this.opsInPeriod >= strategy.maxOpsPerPeriod) {
      return false;
    }

    // Check custom budget callback
    if (this.config.budgetCheck) {
      return this.config.budgetCheck(estimatedGasCost, this.opsInPeriod);
    }

    return true;
  }

  /**
   * Record a sponsored UserOp (increment counter).
   */
  recordSponsorship(): void {
    this.opsInPeriod++;
  }

  /**
   * Set the gas budget strategy by name.
   *
   * @param strategy Strategy name or custom strategy object.
   */
  setStrategy(strategy: keyof typeof GAS_BUDGET_STRATEGIES | GasBudgetStrategy): void {
    if (typeof strategy === 'string') {
      this.config.gasBudgetStrategy = strategy as GasBudgetStrategyName;
    } else {
      (this.config as unknown as Record<string, GasBudgetStrategyName | GasBudgetStrategy>).gasBudgetStrategy = strategy;
    }
  }

  /**
   * Get the current strategy.
   */
  getStrategy(): GasBudgetStrategy {
    return this.resolveStrategy();
  }

  /**
   * Set the period length for rate limiting (in milliseconds).
   *
   * @param ms Period length.
   */
  setPeriodLength(ms: number): void {
    this.periodLengthMs = ms;
  }

  // ─── PaymasterClient compatibility ──────────────────────────────────────

  /**
   * Get paymaster data for inclusion in a UserOperation.
   * Compatible with the PaymasterClient interface.
   *
   * @param params.sender     Sender address.
   * @param params.callData   Call data.
   * @param params.chainId    Chain ID.
   * @param params.userOpHash Optional UserOp hash. If not provided, a hash will be computed.
   * @returns Paymaster data.
   */
  async getPaymasterData(params: {
    sender: Address;
    callData: Hex;
    chainId: number;
    userOpHash?: Hex;
  }): Promise<PaymasterData> {
    // Use provided userOpHash or compute a deterministic hash from the parameters
    // This ensures we never sign a zero hash, which would be a critical security issue
    const userOpHash = params.userOpHash ?? this.computeUserOpHash(params);

    const paymasterAndData = await this.generatePaymasterAndData({ userOpHash });

    return {
      paymaster: this.config.paymasterAddress,
      paymasterData: paymasterAndData,
      paymasterVerificationGasLimit: 100_000n,
      paymasterPostOpGasLimit: 50_000n,
    };
  }

  /**
   * Verify that this paymaster address is valid and funded.
   *
   * @param paymaster Paymaster address to verify.
   * @param chainId   Chain ID.
   * @returns Verification result.
   */
  async verifyPaymaster(paymaster: Address, chainId: number): Promise<PaymasterVerification> {
    const isValid = paymaster.toLowerCase() === this.config.paymasterAddress.toLowerCase();

    return {
      isValid,
      sponsor: this.config.signerAddress,
      gasLimit: this.resolveMaxGasCost() > 0n
        ? this.resolveMaxGasCost() / BigInt(10_000_000_000n) // rough gas units at 10 gwei
        : 1_000_000n,
    };
  }

  /**
   * Sponsor a transaction.
   *
   * @param request Sponsorship request.
   * @param request.userOpHash Optional UserOp hash. If not provided, a hash will be computed.
   * @returns Sponsorship result.
   */
  async sponsorTransaction(request: SponsorRequest & { userOpHash?: Hex }): Promise<SponsorResult> {
    const shouldSponsor = this.shouldSponsor(request.gasEstimate ?? 500_000n);
    if (!shouldSponsor) {
      throw new Error('UserOp exceeds gas budget limits');
    }

    // Use provided userOpHash or compute a deterministic hash from the parameters
    // This ensures we never sign a zero hash, which would be a critical security issue
    const userOpHash = request.userOpHash ?? this.computeUserOpHash(request);
    const paymasterAndData = await this.generatePaymasterAndData({ userOpHash });

    this.recordSponsorship();

    return {
      paymaster: this.config.paymasterAddress,
      paymasterData: paymasterAndData,
      sponsorshipId: `sponsor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  // ─── Internal helpers ───────────────────────────────────────────────────

  /**
   * Compute a deterministic UserOp hash from the given parameters.
   * This is used when the actual userOpHash is not yet available (e.g., during estimation).
   * The hash is computed from sender, callData, and chainId to ensure uniqueness.
   */
  private computeUserOpHash(params: { sender: Address; callData: Hex; chainId: number }): Hex {
    // Encode the parameters in a deterministic way
    const encoded = encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'bytes' },
        { type: 'uint256' },
        { type: 'uint256' }, // timestamp to ensure uniqueness
      ],
      [
        params.sender,
        params.callData,
        BigInt(params.chainId),
        BigInt(Date.now()),
      ]
    );
    
    return keccak256(encoded);
  }

  private resolveStrategy(): GasBudgetStrategy {
    const name = this.config.gasBudgetStrategy;
    if (typeof name === 'string') {
      return GAS_BUDGET_STRATEGIES[name] ?? GAS_BUDGET_STRATEGIES.conservative;
    }
    return name;
  }

  private resolveMaxGasCost(): bigint {
    const strategy = this.resolveStrategy();
    return strategy.maxCostPerOp;
  }
}

export default VerifyingPaymaster;

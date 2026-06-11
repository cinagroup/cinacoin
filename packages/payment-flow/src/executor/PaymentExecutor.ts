/**
 * PaymentExecutor — real on-chain payment execution via viem.
 *
 * Handles:
 * - Payment request creation (with amount → base-unit conversion)
 * - Transaction submission (native + ERC-20 transfers)
 * - Gas estimation (real RPC calls)
 * - On-chain status lookup
 * - Payment cancellation (via nonce bump)
 *
 * Requires viem as a peer dependency.
 */

import { parseUnits, type PublicClient, type WalletClient, type Address } from "viem";
import type {
  PaymentRequest,
  CreatePaymentParams,
  PaymentResult,
  GasEstimate,
  ExecutorConfig,
  MultisigApproval,
  PaymentState,
} from "../types";

// ---------------------------------------------------------------------------
// ERC-20 ABI (minimal — transfer only)
// ---------------------------------------------------------------------------

const ERC20_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a unique client-side payment ID. */
function generatePaymentId(): string {
  return `pmt_${Date.now()}_${crypto.randomUUID().slice(0, 10)}`;
}

/**
 * Exponential backoff delay.
 * Returns min(delay * 2^attempt, maxDelay).
 */
function backoffMs(attempt: number, baseMs: number, maxMs: number): number {
  return Math.min(baseMs * 2 ** attempt, maxMs);
}

// ---------------------------------------------------------------------------
// PaymentExecutor
// ---------------------------------------------------------------------------

export class PaymentExecutor {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null;
  private confirmations: number;
  private maxPollAttempts: number;
  private pollDelayMs: number;
  private multisigMinApprovals: number;
  private multisigSigners: `0x${string}`[];

  /** In-memory store of payment requests (replace with DB in production). */
  private payments: Map<string, PaymentRequest> = new Map();

  /** Multisig approvals keyed by payment id. */
  private approvals: Map<string, MultisigApproval[]> = new Map();

  constructor(config: ExecutorConfig) {
    this.publicClient = config.publicClient as unknown as PublicClient;
    this.walletClient = (config.walletClient ?? null) as WalletClient | null;
    this.confirmations = config.confirmations ?? 1;
    this.maxPollAttempts = config.maxPollAttempts ?? 30;
    this.pollDelayMs = config.pollDelayMs ?? 1000;
    this.multisigMinApprovals = config.multisigMinApprovals ?? 1;
    this.multisigSigners = config.multisigSigners ?? [];
  }

  /** Inject a wallet client at runtime (e.g. after wallet connection). */
  setWalletClient(client: WalletClient): void {
    this.walletClient = client;
  }

  // -----------------------------------------------------------------------
  // 1. Create payment request
  // -----------------------------------------------------------------------

  /**
   * Build a PaymentRequest from human-readable parameters.
   * Converts the amount to base units using the token's decimals.
   */
  async createPaymentRequest(params: CreatePaymentParams): Promise<PaymentRequest> {
    const decimals = params.decimals ?? 18;
    const amountBase = parseUnits(params.amount, decimals);

    const request: PaymentRequest = {
      id: generatePaymentId(),
      sender: params.from,
      recipient: params.to,
      amount: amountBase,
      tokenAddress: params.tokenAddress ?? "",
      chainId: params.chainId,
      state: "pending",
      data: params.data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.payments.set(request.id, request);
    return request;
  }

  // -----------------------------------------------------------------------
  // 2. Execute payment (actual on-chain tx)
  // -----------------------------------------------------------------------

  /**
   * Execute a payment by sending the transaction on-chain.
   *
   * Flow:
   *   pending → processing → poll for receipt → confirmed | failed
   *
   * If multisig is configured, requires min approvals before submission.
   */
  async executePayment(paymentId: string): Promise<PaymentResult> {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);
    if (payment.state !== "pending") {
      throw new Error(`Payment ${paymentId} is in state "${payment.state}", cannot execute`);
    }

    // -- Multisig check (optional) --
    if (this.multisigMinApprovals > 1) {
      const approvals = this.approvals.get(paymentId) ?? [];
      const approved = approvals.filter((a) => a.approved).length;
      if (approved < this.multisigMinApprovals) {
        throw new Error(
          `Multisig: ${approved}/${this.multisigMinApprovals} approvals received`,
        );
      }
    }

    // -- Transition to processing --
    payment.state = "processing";
    payment.updatedAt = Date.now();

    const walletClient = this.walletClient;
    if (!walletClient) {
      throw new Error("Wallet client not set — cannot execute payment");
    }

    try {
      let txHash: `0x${string}`;

      if (payment.tokenAddress === "") {
        // Native token transfer
        txHash = await walletClient.sendTransaction({
          account: payment.sender,
          to: payment.recipient,
          value: payment.amount,
          data: payment.data,
          chain: null,
        });
      } else {
        // ERC-20 transfer
        txHash = await walletClient.writeContract({
          account: payment.sender,
          address: payment.tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [payment.recipient, payment.amount],
          chain: null,
        });
      }

      payment.txHash = txHash;
      payment.updatedAt = Date.now();

      // -- Poll for receipt --
      const receipt = await this.pollForReceipt(txHash);

      if (receipt.status === "success") {
        payment.state = "confirmed";
        payment.blockNumber = receipt.blockNumber;
        payment.updatedAt = Date.now();

        return {
          paymentId: payment.id,
          txHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          effectiveGasPrice: receipt.effectiveGasPrice ?? 0n,
          status: "confirmed",
        };
      } else {
        payment.state = "failed";
        payment.updatedAt = Date.now();

        return {
          paymentId: payment.id,
          txHash,
          gasUsed: receipt.gasUsed,
          effectiveGasPrice: receipt.effectiveGasPrice ?? 0n,
          status: "failed",
        };
      }
    } catch (error) {
      payment.state = "failed";
      payment.updatedAt = Date.now();
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // 3. Gas estimation
  // -----------------------------------------------------------------------

  /**
   * Estimate gas for a payment using real RPC calls.
   * Returns gas limit, gas price, and estimated total cost.
   */
  async estimateGas(payment: PaymentRequest): Promise<GasEstimate> {
    let gasLimit: bigint;

    if (payment.tokenAddress === "") {
      // Native transfer — typically 21000 gas
      gasLimit = await this.publicClient.estimateGas({
        account: payment.sender,
        to: payment.recipient,
        value: payment.amount,
        data: payment.data,
      });
    } else {
      gasLimit = await this.publicClient.estimateContractGas({
        address: payment.tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [payment.recipient, payment.amount],
        account: payment.sender,
      });
    }

    // Get current gas price (EIP-1559 or legacy)
    const block = await this.publicClient.getBlock();
    const baseFee = block.baseFeePerGas ?? 0n;
    const gasPrice = await this.publicClient.getGasPrice();

    const maxFeePerGas = baseFee > 0n ? baseFee * 2n : gasPrice;
    const maxPriorityFeePerGas = baseFee > 0n ? 1_500_000_000n : undefined;

    const effectiveGasPrice = maxPriorityFeePerGas
      ? baseFee + maxPriorityFeePerGas
      : gasPrice;

    return {
      gasLimit,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimatedCostWei: gasLimit * effectiveGasPrice,
    };
  }

  // -----------------------------------------------------------------------
  // 4. Payment status lookup
  // -----------------------------------------------------------------------

  /**
   * Get the current state of a payment.
   * If the payment has a txHash, also checks the on-chain status.
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentRequest> {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    if (payment.txHash && payment.state === "processing") {
      // Try to get receipt without throwing
      try {
        const receipt = await this.publicClient.getTransactionReceipt({
          hash: payment.txHash,
        });

        if (receipt.status === "success") {
          payment.state = "confirmed";
          payment.blockNumber = receipt.blockNumber;
        } else {
          payment.state = "failed";
        }
        payment.updatedAt = Date.now();
      } catch {
        // Receipt not yet available — state remains "processing"
      }
    }

    return payment;
  }

  /** Get all tracked payments. */
  getAllPayments(): PaymentRequest[] {
    return Array.from(this.payments.values());
  }

  /** Get a single payment by ID (sync, no RPC call). */
  getPayment(paymentId: string): PaymentRequest | undefined {
    return this.payments.get(paymentId);
  }

  // -----------------------------------------------------------------------
  // 5. Cancel payment
  // -----------------------------------------------------------------------

  /**
   * Cancel a pending payment.
   * If already submitted, sends a 0-value self-transfer to bump the nonce.
   */
  async cancelPayment(paymentId: string): Promise<void> {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    if (payment.state === "pending") {
      payment.state = "cancelled";
      payment.updatedAt = Date.now();
      return;
    }

    if (payment.state === "processing" && payment.txHash) {
      // Already on-chain — send nonce-bump tx
      const walletClient = this.walletClient;
      if (!walletClient) {
        throw new Error("Wallet client not set — cannot cancel");
      }

      await walletClient.sendTransaction({
        account: payment.sender,
        to: payment.sender,
        value: 0n,
        chain: null,
      });

      payment.state = "cancelled";
      payment.updatedAt = Date.now();
      return;
    }

    throw new Error(`Cannot cancel payment in state "${payment.state}"`);
  }

  // -----------------------------------------------------------------------
  // 6. Multisig approval (optional)
  // -----------------------------------------------------------------------

  /** Record a multisig approval for a payment. */
  approvePayment(paymentId: string, signer: `0x${string}`, signature?: `0x${string}`): void {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    if (!this.multisigSigners.includes(signer)) {
      throw new Error(`Signer ${signer} is not a known multisig signer`);
    }

    const existing = this.approvals.get(paymentId) ?? [];
    // Check duplicate
    if (existing.some((a) => a.signer === signer)) {
      throw new Error(`Signer ${signer} already approved`);
    }

    existing.push({
      signer,
      approved: true,
      timestamp: Date.now(),
      signature,
    });
    this.approvals.set(paymentId, existing);
  }

  /** Get approvals for a payment. */
  getApprovals(paymentId: string): MultisigApproval[] {
    return this.approvals.get(paymentId) ?? [];
  }

  // -----------------------------------------------------------------------
  // Internal: poll for transaction receipt with exponential backoff
  // -----------------------------------------------------------------------

  private async pollForReceipt(
    txHash: `0x${string}`,
  ): Promise<{ status: "success" | "reverted"; gasUsed: bigint; blockNumber: bigint; effectiveGasPrice?: bigint }> {
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      try {
        const receipt = await this.publicClient.getTransactionReceipt({ hash: txHash });
        return {
          status: receipt.status === "success" ? "success" : "reverted",
          gasUsed: receipt.gasUsed,
          blockNumber: receipt.blockNumber,
          effectiveGasPrice: receipt.effectiveGasPrice,
        };
      } catch {
        // Not yet mined — wait and retry
        await this.sleep(backoffMs(attempt, this.pollDelayMs, 30_000));
      }
    }
    throw new Error(
      `Transaction receipt not received after ${this.maxPollAttempts} attempts for ${txHash}`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

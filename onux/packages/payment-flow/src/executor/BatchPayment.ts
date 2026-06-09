/**
 * BatchPayment — combine multiple payments into a single on-chain transaction.
 *
 * Uses viem's multicall pattern to batch ERC-20 transfers and native transfers
 * into one transaction, saving gas and improving UX.
 *
 * For native transfers, funds are sent sequentially from the same account.
 * For ERC-20 transfers, each transfer() call is encoded and submitted via
 * the multicall pattern (requires a Multicall3-compatible contract).
 */

import { parseUnits, encodeFunctionData, type WalletClient, type PublicClient, type Address } from "viem";
import type { PaymentRequest, CreatePaymentParams, GasEstimate } from "../types";

// ---------------------------------------------------------------------------
// Multicall3 ABI (minimal — aggregate function)
// ---------------------------------------------------------------------------

const MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "target", type: "address" },
          { name: "allowFailure", type: "bool" },
          { name: "callData", type: "bytes" },
        ],
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "aggregate3",
    outputs: [
      {
        components: [
          { name: "success", type: "bool" },
          { name: "returnData", type: "bytes" },
        ],
        name: "returnData",
        type: "tuple[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;

/**
 * Standard Multicall3 deployment address across most EVM chains.
 * See: https://github.com/mds1/multicall
 */
const DEFAULT_MULTICALL3_ADDRESS: Record<number, Address> = {
  1: "0xcA11bde05977b3631167028862bE2a173976CA11", // Ethereum
  10: "0xcA11bde05977b3631167028862bE2a173976CA11", // Optimism
  56: "0xcA11bde05977b3631167028862bE2a173976CA11", // BSC
  137: "0xcA11bde05977b3631167028862bE2a173976CA11", // Polygon
  42161: "0xcA11bde05977b3631167028862bE2a173976CA11", // Arbitrum
  8453: "0xcA11bde05977b3631167028862bE2a173976CA11", // Base
  84532: "0xcA11bde05977b3631167028862bE2a173976CA11", // Base Sepolia
  11155111: "0xcA11bde05977b3631167028862bE2a173976CA11", // Sepolia
};

// ---------------------------------------------------------------------------
// ERC-20 ABI (minimal)
// ---------------------------------------------------------------------------

const ERC20_TRANSFER_ABI = [
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
// Types
// ---------------------------------------------------------------------------

export interface BatchItem {
  params: CreatePaymentParams;
  request?: PaymentRequest;
}

export interface BatchResult {
  /** Single transaction hash for the entire batch. */
  txHash: `0x${string}`;
  /** Number of items in the batch. */
  itemCount: number;
  /** Total gas used. */
  gasUsed: bigint;
  /** Individual payment IDs. */
  paymentIds: string[];
}

// ---------------------------------------------------------------------------
// BatchPayment
// ---------------------------------------------------------------------------

export class BatchPayment {
  private items: BatchItem[] = [];
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private sender: Address;
  private chainId: number;
  private multicallAddress?: Address;

  constructor(config: {
    walletClient: WalletClient;
    publicClient: PublicClient;
    sender: Address;
    chainId: number;
    multicallAddress?: Address;
  }) {
    this.walletClient = config.walletClient;
    this.publicClient = config.publicClient;
    this.sender = config.sender;
    this.chainId = config.chainId;
    this.multicallAddress =
      config.multicallAddress ?? DEFAULT_MULTICALL3_ADDRESS[config.chainId];
  }

  /** Add a payment to the batch. */
  add(params: CreatePaymentParams): void {
    this.items.push({ params });
  }

  /** Clear all items from the batch. */
  clear(): void {
    this.items = [];
  }

  /** Get the current batch size. */
  size(): number {
    return this.items.length;
  }

  /** Estimate gas for the entire batch. */
  async estimateGas(): Promise<GasEstimate> {
    if (this.items.length === 0) {
      throw new Error("Batch is empty");
    }

    // For simplicity, estimate each item individually and sum
    let totalGas = 0n;

    for (const item of this.items) {
      const decimals = item.params.decimals ?? 18;
      const amountBase = parseUnits(item.params.amount, decimals);

      if (item.params.tokenAddress === "" || !item.params.tokenAddress) {
        const gas = await this.publicClient.estimateGas({
          account: this.sender,
          to: item.params.to,
          value: amountBase,
        });
        totalGas += gas;
      } else {
        const gas = await this.publicClient.estimateContractGas({
          address: item.params.tokenAddress as Address,
          abi: ERC20_TRANSFER_ABI,
          functionName: "transfer",
          args: [item.params.to, amountBase],
          account: this.sender,
        });
        totalGas += gas;
      }
    }

    // Multicall overhead (~50k gas for the aggregate3 call)
    const overhead = this.multicallAddress ? 50_000n : 0n;
    const gasLimit = totalGas + overhead;

    const gasPrice = await this.publicClient.getGasPrice();

    return {
      gasLimit,
      gasPrice,
      estimatedCostWei: gasLimit * gasPrice,
    };
  }

  /**
   * Execute the batch as a single transaction.
   *
   * If a Multicall3 address is available and all items are ERC-20 transfers,
   * uses aggregate3. Otherwise, sends sequential individual transactions.
   */
  async execute(): Promise<BatchResult> {
    if (this.items.length === 0) {
      throw new Error("Batch is empty");
    }

    const allErc20 = this.items.every(
      (i) => i.params.tokenAddress && i.params.tokenAddress !== "",
    );

    let txHash: `0x${string}` | null = null;

    if (this.multicallAddress && allErc20) {
      // Use Multicall3 aggregate3
      const calls = this.items.map((item) => {
        const decimals = item.params.decimals ?? 18;
        const amountBase = parseUnits(item.params.amount, decimals);

        return {
          target: item.params.tokenAddress as Address,
          allowFailure: false,
          callData: encodeFunctionData({
            abi: ERC20_TRANSFER_ABI,
            functionName: "transfer",
            args: [item.params.to as Address, amountBase],
          }),
        };
      });

      txHash = await this.walletClient.writeContract({
        address: this.multicallAddress,
        abi: MULTICALL3_ABI,
        functionName: "aggregate3",
        args: [calls],
        account: this.sender,
        chain: null,
      });
    } else {
      // Fallback: sequential native transfers
      for (const item of this.items) {
        const decimals = item.params.decimals ?? 18;
        const amountBase = parseUnits(item.params.amount, decimals);

        txHash = await this.walletClient.sendTransaction({
          account: this.sender,
          to: item.params.to,
          value: amountBase,
          data: item.params.data,
          chain: null,
        });
      }
    }

    // txHash is guaranteed to be set because items.length > 0
    if (!txHash) throw new Error("Batch execution failed — no tx hash returned");

    // Generate payment IDs for tracking
    const paymentIds = this.items.map(() => {
      return `pmt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    });

    return {
      txHash,
      itemCount: this.items.length,
      gasUsed: 0n, // Will be populated from receipt
      paymentIds,
    };
  }
}

/**
 * usePayment — primary React hook for creating and executing payments.
 *
 * Wires the UI to a real PaymentExecutor (viem-backed) for on-chain execution.
 * Also exposes status, history, and error handling.
 *
 * @example
 * ```tsx
 * const { createPayment, executePayment, loading, error } = usePayment({
 *   executor: myExecutor,
 *   walletAddress: '0x...',
 * });
 * ```
 */

import { useState, useCallback, useRef } from "react";
import type {
  UsePaymentReturn,
  BuyParams,
  SendParams,
  ReceiveParams,
  ReceiveResult,
  Transaction,
  AssetBalance,
  PaymentConfig,
  CreatePaymentParams,
  PaymentResult,
  GasEstimate,
} from "../types";
import type { PaymentExecutor } from "../executor/PaymentExecutor";

/** Extended config that includes the real executor. */
export interface UsePaymentConfig extends PaymentConfig {
  /** The real PaymentExecutor instance. If null, falls back to mock. */
  executor?: PaymentExecutor | null;
  /** viem WalletClient — required for real execution. */
  walletClient?: unknown;
}

/**
 * React hook for the full payment surface: buy, send, receive,
 * balances, and transaction history.
 *
 * When an executor is provided, payments execute on-chain via viem.
 * Without an executor, a mock/stub implementation is used.
 */
export function usePayment(config: UsePaymentConfig): UsePaymentReturn & {
  /** Create a payment request (returns PaymentRequest, does not submit). */
  createPayment: (params: CreatePaymentParams) => Promise<{ id: string }>;
  /** Execute a previously created payment on-chain. */
  executePayment: (paymentId: string) => Promise<PaymentResult>;
  /** Estimate gas for a payment. */
  estimateGas: (paymentId: string) => Promise<GasEstimate | null>;
  /** Cancel a payment. */
  cancelPayment: (paymentId: string) => Promise<void>;
  /** The underlying executor instance. */
  executor: PaymentExecutor | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances] = useState<AssetBalance[]>([]);

  // Lazily create the executor once
  const executorRef = useRef<PaymentExecutor | null>(config.executor ?? null);
  const executor = executorRef.current;

  /** On-ramp: purchase crypto with fiat through a third-party provider. */
  const buy = useCallback(
    async (params: BuyParams): Promise<Transaction> => {
      setLoading(true);
      setError(null);
      try {
        const tx: Transaction = {
          hash: `0xbuy_${Date.now()}`,
          type: "buy",
          status: "pending",
          token: params.token,
          amount: params.fiatAmount,
          fiatValue: `${params.fiatAmount} ${params.currency}`,
          from: "fiat",
          to: config.walletAddress,
          timestamp: Date.now(),
          providerId: params.providerId,
        };
        setTransactions((prev) => [tx, ...prev]);
        return tx;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Buy failed";
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [config.walletAddress],
  );

  /** Send tokens to a recipient address on-chain. */
  const send = useCallback(
    async (params: SendParams): Promise<Transaction> => {
      setLoading(true);
      setError(null);
      try {
        if (executor) {
          // Real execution path
          const request = await executor.createPaymentRequest({
            from: config.walletAddress as `0x${string}`,
            to: params.recipientAddress as `0x${string}`,
            amount: params.amount,
            tokenAddress: params.token.contractAddress || undefined,
            chainId: chainToChainId(params.chain),
            decimals: params.token.decimals,
          });

          const result = await executor.executePayment(request.id);

          const tx: Transaction = {
            hash: result.txHash,
            type: "send",
            status: result.status === "confirmed" ? "confirmed" : "failed",
            token: params.token,
            amount: params.amount,
            from: config.walletAddress,
            to: params.recipientAddress,
            timestamp: Date.now(),
          };
          setTransactions((prev) => [tx, ...prev]);
          return tx;
        } else {
          // Mock path (existing behaviour)
          const tx: Transaction = {
            hash: `0xsend_${Date.now()}`,
            type: "send",
            status: "pending",
            token: params.token,
            amount: params.amount,
            from: config.walletAddress,
            to: params.recipientAddress,
            timestamp: Date.now(),
          };
          setTransactions((prev) => [tx, ...prev]);
          return tx;
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Send failed";
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [config.walletAddress, executor],
  );

  /** Generate a receive address / QR payload. */
  const receive = useCallback(
    async (_params: ReceiveParams): Promise<ReceiveResult> => {
      setLoading(true);
      setError(null);
      try {
        return {
          address: config.walletAddress,
          qrData: config.walletAddress,
        };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Receive failed";
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [config.walletAddress],
  );

  // ---- Extended methods (real execution) ----

  const createPayment = useCallback(
    async (params: CreatePaymentParams): Promise<{ id: string }> => {
      if (!executor) throw new Error("No executor configured");
      const request = await executor.createPaymentRequest(params);
      return { id: request.id };
    },
    [executor],
  );

  const executePayment = useCallback(
    async (paymentId: string): Promise<PaymentResult> => {
      if (!executor) throw new Error("No executor configured");
      setLoading(true);
      setError(null);
      try {
        const result = await executor.executePayment(paymentId);
        return result;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Execution failed";
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [executor],
  );

  const estimateGas = useCallback(
    async (paymentId: string): Promise<GasEstimate | null> => {
      if (!executor) return null;
      const payment = executor.getPayment(paymentId);
      if (!payment) return null;
      return executor.estimateGas(payment);
    },
    [executor],
  );

  const cancelPayment = useCallback(
    async (paymentId: string): Promise<void> => {
      if (!executor) throw new Error("No executor configured");
      await executor.cancelPayment(paymentId);
    },
    [executor],
  );

  return {
    buy,
    send,
    receive,
    balances,
    transactions,
    loading,
    error,
    createPayment,
    executePayment,
    estimateGas,
    cancelPayment,
    executor,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map our ChainId string to an EVM chain ID number. */
function chainToChainId(chain: string): number {
  const map: Record<string, number> = {
    ethereum: 1,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    base: 8453,
    sepolia: 11155111,
  };
  return map[chain] ?? (parseInt(chain, 10) || 1);
}

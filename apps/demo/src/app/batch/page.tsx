"use client";

import { useState } from "react";
import { Plus, Trash2, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet, shortenAddress } from "@/lib/useWallet";
import { useToast } from "@/lib/toast";
import { executeBatch, type BatchTransaction } from "@/lib/batch";

export default function BatchPage() {
  const { account, status } = useWallet();
  const { success, error: showError } = useToast();

  const isConnected = status === "connected";

  const [transactions, setTransactions] = useState<BatchTransaction[]>([
    {
      id: "1",
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      value: "0.1",
      data: "0x",
      description: "Payment to Alice",
    },
    {
      id: "2",
      to: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
      value: "0.05",
      data: "0x",
      description: "Payment to Bob",
    },
  ]);

  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<Array<{ hash: string; status: "success" | "failed" }>>([]);

  const addTransaction = () => {
    const newTx: BatchTransaction = {
      id: Date.now().toString(),
      to: "",
      value: "0.0",
      data: "0x",
      description: "",
    };
    setTransactions([...transactions, newTx]);
  };

  const updateTransaction = (id: string, updates: Partial<BatchTransaction>) => {
    setTransactions(transactions.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)));
  };

  const removeTransaction = (id: string) => {
    if (transactions.length === 1) {
      showError("Cannot remove", "At least one transaction is required");
      return;
    }
    setTransactions(transactions.filter((tx) => tx.id !== id));
  };

  const handleExecuteBatch = async () => {
    // Validate all transactions
    const invalid = transactions.find((tx) => !tx.to || !tx.to.startsWith("0x"));
    if (invalid) {
      showError("Invalid address", "All transactions must have valid recipient addresses");
      return;
    }

    setExecuting(true);
    setResults([]);

    try {
      const batchResults = await executeBatch(transactions);
      setResults(batchResults);
      success("Batch executed", `${batchResults.length} transactions processed`);
    } catch (err) {
      showError("Batch failed", err instanceof Error ? err.message : "Could not execute batch");
    } finally {
      setExecuting(false);
    }
  };

  const totalValue = transactions.reduce((sum, tx) => sum + parseFloat(tx.value || "0"), 0);

  if (!isConnected) {
    return (
      <DemoLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center cc-page-enter">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">BATCH</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
            Batch transactions.
          </h1>
          <p className="text-[var(--cc-body)]">Connect your wallet to execute multiple transactions at once.</p>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">BATCH</p>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-2">
                Batch transactions.
              </h1>
              <p className="text-[var(--cc-body)] text-body-sm">
                Execute multiple transactions in a single bundle · {totalValue.toFixed(4)} ETH total
              </p>
            </div>
            <button
              onClick={addTransaction}
              className="px-4 py-2 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] rounded-[var(--cc-radius-sm)] font-semibold text-body-sm transition-all shadow-[var(--cc-level2)] hover:shadow-[var(--cc-level3)] active:scale-[0.98] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-4 cc-stagger">
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              className="p-5 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] cc-animate-slide-up"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] flex items-center justify-center text-caption font-semibold text-[var(--cc-muted)]">
                    {index + 1}
                  </span>
                  <p className="font-semibold text-[var(--cc-ink)]">Transaction {index + 1}</p>
                </div>
                <button
                  onClick={() => removeTransaction(tx.id)}
                  className="p-1.5 hover:bg-[var(--cc-error)]/15 rounded transition-colors group"
                  title="Remove transaction"
                >
                  <Trash2 className="w-4 h-4 text-[var(--cc-muted)] group-hover:text-[var(--cc-error)]" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Recipient */}
                <div>
                  <label className="text-caption text-[var(--cc-muted)] block mb-1.5">Recipient</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={tx.to}
                    onChange={(e) => updateTransaction(tx.id, { to: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)]/50 focus:outline-none focus:border-[var(--cc-hairline-strong)] transition-all font-mono text-caption"
                  />
                </div>

                {/* Value & Description */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-caption text-[var(--cc-muted)] block mb-1.5">Value (ETH)</label>
                    <input
                      type="text"
                      placeholder="0.0"
                      value={tx.value}
                      onChange={(e) => updateTransaction(tx.id, { value: e.target.value.replace(/[^0-9.]/g, '') })}
                      className="w-full px-3 py-2 bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)]/50 focus:outline-none focus:border-[var(--cc-hairline-strong)] transition-all cc-tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-caption text-[var(--cc-muted)] block mb-1.5">Description</label>
                    <input
                      type="text"
                      placeholder="Optional note..."
                      value={tx.description}
                      onChange={(e) => updateTransaction(tx.id, { description: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)]/50 focus:outline-none focus:border-[var(--cc-hairline-strong)] transition-all"
                    />
                  </div>
                </div>

                {/* Result */}
                {results[index] && (
                  <div className={`p-3 rounded-[var(--cc-radius-sm)] flex items-center gap-2 cc-animate-slide-up ${
                    results[index].status === "success"
                      ? 'bg-[var(--cc-success)]/15 border border-[var(--cc-success)]/25'
                      : 'bg-[var(--cc-error)]/15 border border-[var(--cc-error)]/25'
                  }`}>
                    {results[index].status === "success" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[var(--cc-success)]" />
                        <span className="text-caption text-[var(--cc-success)] font-medium">Success</span>
                        <span className="text-caption text-[var(--cc-muted)] ml-auto font-mono">
                          {shortenAddress(results[index].hash)}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-[var(--cc-error)]" />
                        <span className="text-caption text-[var(--cc-error)] font-medium">Failed</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecuteBatch}
          disabled={executing}
          className="w-full mt-6 px-6 py-3.5 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-50 rounded-[var(--cc-radius-sm)] font-semibold transition-all shadow-[var(--cc-level3)] hover:shadow-[var(--cc-level4)] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {executing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Executing batch...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Execute {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </>
          )}
        </button>

        {/* Info note */}
        <div className="mt-4 flex items-start gap-2 p-3 bg-[var(--cc-canvas-soft-2)]/30 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)]">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--cc-muted)] mt-0.5 shrink-0" />
          <p className="text-caption text-[var(--cc-muted)]">
            Batch transactions are simulated in this demo. Real batch execution requires account abstraction or multi-call contracts.
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}

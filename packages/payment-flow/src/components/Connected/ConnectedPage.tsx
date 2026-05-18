import type { Transaction } from "../../types";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ConnectedPageProps {
  walletAddress?: string;
  totalBalance?: string;
  /** Quick action buttons to show */
  actions?: { label: string; icon: string; onClick: () => void }[];
  /** Recent transactions to display */
  recentTransactions?: Transaction[];
  onBuy?: () => void;
  onSend?: () => void;
  onReceive?: () => void;
}

const DEFAULT_TRANSACTIONS: Transaction[] = [];

/**
 * Connected page — account overview with quick actions and recent transactions.
 *
 * Features:
 * - Account overview (balance, address)
 * - Quick actions (Send, Receive, Buy)
 * - Recent transactions
 */
export function ConnectedPage({
  walletAddress = "0x0000000000000000000000000000000000000000",
  totalBalance = "$0.00",
  actions,
  recentTransactions = DEFAULT_TRANSACTIONS,
  onBuy,
  onSend,
  onReceive,
}: ConnectedPageProps) {
  const shortAddress = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  const defaultActions = [
    { label: "Send", icon: "↗", onClick: onSend ?? (() => {}) },
    { label: "Receive", icon: "↙", onClick: onReceive ?? (() => {}) },
    { label: "Buy", icon: "+", onClick: onBuy ?? (() => {}) },
  ];

  const displayActions = actions ?? defaultActions;

  return (
    <div className="max-w-md mx-auto rounded-2xl bg-white/5 p-6 backdrop-blur">
      {/* Account overview */}
      <div className="text-center mb-8">
        <p className="text-gray-400 text-sm mb-1">Total Balance</p>
        <h1 className="text-4xl font-bold text-white mb-3">{totalBalance}</h1>
        <code className="bg-black/20 text-gray-300 text-xs px-3 py-1 rounded-lg">
          {shortAddress}
        </code>
      </div>

      {/* Quick actions */}
      <div className="flex justify-center gap-6 mb-8">
        {displayActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 group-hover:bg-blue-600/30 flex items-center justify-center text-2xl text-blue-400 transition-colors">
              {action.icon}
            </div>
            <span className="text-gray-400 text-xs">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Recent transactions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Transactions</h3>
        {recentTransactions.length === 0 ? (
          <div className="bg-black/20 rounded-xl p-6 text-center">
            <p className="text-gray-500 text-sm">No transactions yet</p>
            <p className="text-gray-600 text-xs mt-1">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx.hash}
                className="flex items-center justify-between bg-black/20 rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      tx.type === "buy"
                        ? "bg-green-500/20 text-green-400"
                        : tx.type === "send"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {tx.type === "buy" ? "↓" : tx.type === "send" ? "↑" : "↙"}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium capitalize">{tx.type}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">
                    {tx.type === "send" ? "-" : "+"}{tx.amount} {tx.token.symbol}
                  </p>
                  <p
                    className={`text-xs ${
                      tx.status === "confirmed"
                        ? "text-green-400"
                        : tx.status === "failed"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

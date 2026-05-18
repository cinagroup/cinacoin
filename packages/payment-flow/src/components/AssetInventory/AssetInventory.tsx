import type { AssetBalance } from "../../types";

// Default tokens are embedded in the type definitions.

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AssetInventoryProps {
  balances?: AssetBalance[];
}

/**
 * Asset inventory — displays token balances across chains.
 *
 * Features:
 * - Token balances per chain
 * - Fiat value conversion
 * - Empty state ("No assets available")
 */
export function AssetInventory({ balances = [] }: AssetInventoryProps) {
  // If no balances passed, show empty state
  if (balances.length === 0) {
    return (
      <div className="max-w-lg mx-auto rounded-2xl bg-white/5 p-8 backdrop-blur text-center">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-xl font-bold text-white mb-2">No assets available</h3>
        <p className="text-gray-400 text-sm">
          Connect a wallet or make your first purchase to see your assets here.
        </p>
      </div>
    );
  }

  const totalFiatValue = balances.reduce(
    (sum, b) => sum + parseFloat(b.fiatValue.replace(/[^0-9.-]/g, "") || "0"),
    0,
  );

  return (
    <div className="max-w-lg mx-auto rounded-2xl bg-white/5 p-6 backdrop-blur">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Assets</h2>
        <span className="text-lg font-semibold text-blue-400">
          ${totalFiatValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className="space-y-3">
        {balances.map((asset, idx) => (
          <div
            key={`${asset.token.symbol}-${asset.token.chain}-${idx}`}
            className="flex items-center justify-between bg-black/20 rounded-xl p-4 hover:bg-black/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Token icon placeholder */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {asset.token.symbol.slice(0, 2)}
              </div>
              <div>
                <p className="text-white font-medium">{asset.token.name}</p>
                <p className="text-gray-400 text-xs capitalize">{asset.token.chain}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">
                {parseFloat(asset.balance).toFixed(asset.token.decimals > 6 ? 4 : 2)}{" "}
                {asset.token.symbol}
              </p>
              <p className="text-gray-400 text-sm">${parseFloat(asset.fiatValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

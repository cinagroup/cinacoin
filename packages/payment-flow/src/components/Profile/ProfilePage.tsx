import { useState, useCallback } from "react";
import type { ProviderId } from "../../types";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface LinkedProvider {
  id: ProviderId;
  name: string;
  connected: boolean;
}

export interface ProfilePageProps {
  walletAddress?: string;
  /** Currently linked payment providers */
  linkedProviders?: LinkedProvider[];
  /** Called when user requests to remove a linked provider */
  onRemoveProvider?: (providerId: ProviderId) => void;
  /** Called when user requests to export their key */
  onExportKey?: () => void;
}

const DEFAULT_LINKED_PROVIDERS: LinkedProvider[] = [
  { id: "moonpay", name: "MoonPay", connected: true },
  { id: "coinbase", name: "Coinbase Pay", connected: true },
  { id: "ramp", name: "Ramp Network", connected: false },
];

/**
 * Profile page — account and provider management.
 *
 * Features:
 * - Connected address display
 * - Linked providers list
 * - Remove linked provider
 * - Export key
 */
export function ProfilePage({
  walletAddress = "0x0000000000000000000000000000000000000000",
  linkedProviders = DEFAULT_LINKED_PROVIDERS,
  onRemoveProvider,
  onExportKey,
}: ProfilePageProps) {
  const [copied, setCopied] = useState(false);
  const [showConfirmExport, setShowConfirmExport] = useState(false);

  const shortAddress = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  const handleCopyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  }, [walletAddress]);

  const handleRemoveProvider = useCallback(
    (providerId: ProviderId) => {
      onRemoveProvider?.(providerId);
    },
    [onRemoveProvider],
  );

  const handleExportKey = useCallback(() => {
    if (showConfirmExport) {
      onExportKey?.();
      setShowConfirmExport(false);
    } else {
      setShowConfirmExport(true);
      // Auto-dismiss after 10s if user doesn't confirm
      setTimeout(() => setShowConfirmExport(false), 10000);
    }
  }, [showConfirmExport, onExportKey]);

  return (
    <div className="max-w-md mx-auto rounded-2xl bg-white/5 p-6 backdrop-blur">
      <h2 className="text-xl font-bold text-white mb-6">Profile</h2>

      {/* Connected address */}
      <div className="mb-6 bg-black/20 rounded-xl p-4">
        <p className="text-gray-400 text-xs mb-1">Connected Address</p>
        <div className="flex items-center justify-between">
          <code className="text-white text-sm">{shortAddress}</code>
          <button
            onClick={handleCopyAddress}
            className={`text-xs px-3 py-1 rounded-lg transition-colors ${
              copied ? "bg-green-600 text-white" : "bg-black/30 text-gray-300 hover:bg-black/40"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Linked providers */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Linked Providers</h3>
        <div className="space-y-2">
          {linkedProviders.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between bg-black/20 rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    provider.connected ? "bg-green-500" : "bg-gray-600"
                  }`}
                />
                <span className="text-white text-sm">{provider.name}</span>
              </div>
              {provider.connected && (
                <button
                  onClick={() => handleRemoveProvider(provider.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-400/10"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export key */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Security</h3>
        {showConfirmExport ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm mb-3">
              ⚠️ Are you sure? This will export your private key. Never share it with anyone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExportKey}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                Yes, Export Key
              </button>
              <button
                onClick={() => setShowConfirmExport(false)}
                className="px-4 py-2 rounded-lg bg-black/20 text-gray-300 text-sm hover:bg-black/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleExportKey}
            className="w-full py-3 rounded-xl font-medium bg-black/20 text-gray-300 hover:bg-black/30 transition-colors"
          >
            Export Key
          </button>
        )}
      </div>
    </div>
  );
}

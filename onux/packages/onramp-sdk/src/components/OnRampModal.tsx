/**
 * OnRampModal — React Component
 *
 * A modal wrapper around OnRampWidget. Opens as an overlay when triggered,
 * providing a complete fiat-to-crypto on-ramp experience.
 *
 * @example
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 *
 * <button onClick={() => setShowModal(true)}>Buy Crypto</button>
 *
 * <OnRampModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   aggregator={myAggregator}
 *   destinationAddress={walletAddress}
 *   onPurchaseComplete={(result) => {
 *     console.log('Purchase:', result);
 *   }}
 * />
 * ```
 */

import React, { useCallback } from "react";
import { OnRampWidget } from "./OnRampWidget.js";
import type { OnRampWidgetProps } from "./OnRampWidget.js";

/* ── props ──────────────────────────────────────────────────────── */

export interface OnRampModalProps extends Omit<OnRampWidgetProps, "onClose" | "className"> {
  /** Whether the modal is open */
  open: boolean;
  /** Close callback */
  onClose: () => void;
}

/* ── component ──────────────────────────────────────────────────── */

export function OnRampModal({
  open,
  onClose,
  ...widgetProps
}: OnRampModalProps): React.ReactElement | null {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buy Crypto"
        style={{
          position: "relative",
          animation: "fadeIn 0.2s ease",
        }}
      >
        <OnRampWidget
          {...widgetProps}
          onClose={onClose}
          className=""
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

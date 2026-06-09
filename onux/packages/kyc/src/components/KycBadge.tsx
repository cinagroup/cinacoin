import React, { useState, useCallback } from 'react';
import type { ScreeningResult } from '../types.js';
import { screenAddress } from '../screening.js';

/* ── colour helpers ────────────────────────────────────────────── */

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  sanctioned: '#991b1b',
};

const STATUS_COLORS: Record<string, string> = {
  verified: '#22c55e',
  pending: '#f59e0b',
  unverified: '#6b7280',
  flagged: '#ef4444',
  rejected: '#991b1b',
};

/* ── types ─────────────────────────────────────────────────────── */

export interface KycBadgeProps {
  /** Address to display and screen. */
  address: string;
  /** Override the status label if you already know it. */
  status?: ScreeningResult['riskLevel'];
  /** Whether to show the numeric risk score. */
  showScore?: boolean;
  /** Custom CSS class for the wrapper. */
  className?: string;
}

/* ── component ─────────────────────────────────────────────────── */

/**
 * Compliance status badge.
 *
 * Displays a colour-coded dot with the risk level.  Clicking opens a
 * detail popover showing the full screening result.
 */
export function KycBadge({
  address,
  status: statusOverride,
  showScore = false,
  className,
}: KycBadgeProps): React.ReactElement {
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [open, setOpen] = useState(false);

  const label = statusOverride ?? result?.riskLevel ?? '…';
  const color = STATUS_COLORS[label] ?? RISK_COLORS[label] ?? '#6b7280';

  const handleClick = useCallback(() => {
    if (!result) {
      const r = screenAddress(address);
      setResult(r);
    }
    setOpen((prev) => !prev);
  }, [address, result]);

  // Dismiss on outside click (simple version)
  const handleDismiss = useCallback(() => setOpen(false), []);

  return (
    <span className={className} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Badge button */}
      <button
        type="button"
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          border: `1px solid ${color}`,
          borderRadius: '9999px',
          background: 'transparent',
          color,
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          lineHeight: 1,
          textTransform: 'capitalize',
        }}
        title={`Click for compliance details — ${address}`}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
          }}
        />
        {label}
        {showScore && result != null && (
          <span style={{ opacity: 0.7, fontWeight: 400 }}>/ {result.riskScore}</span>
        )}
      </button>

      {/* Detail popover */}
      {open && result && (
        <div
          role="dialog"
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            zIndex: 1000,
            minWidth: '280px',
            padding: '16px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            fontSize: '13px',
            color: '#111827',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong>Compliance Details</strong>
            <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all', marginBottom: '8px' }}>
            {address}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 0', color: '#6b7280' }}>Risk Level</td>
                <td style={{ padding: '2px 0', textTransform: 'capitalize', fontWeight: 600, color }}>{label}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', color: '#6b7280' }}>Risk Score</td>
                <td style={{ padding: '2px 0' }}>{result.riskScore} / 100</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', color: '#6b7280' }}>Sanctioned</td>
                <td style={{ padding: '2px 0' }}>{result.isSanctioned ? '⚠️ Yes' : 'No'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', color: '#6b7280' }}>Matched Lists</td>
                <td style={{ padding: '2px 0' }}>{result.matchedLists.length > 0 ? result.matchedLists.join(', ') : '—'}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
            Screened at: {new Date(result.screenedAt).toLocaleString()}
          </div>
        </div>
      )}
    </span>
  );
}

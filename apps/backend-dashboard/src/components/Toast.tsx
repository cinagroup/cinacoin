"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

/**
 * Simple toast notification component.
 * Follows DESIGN.md: uses cc-card, proper role/alert for screen readers.
 */
export default function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const bgMap = {
    success: "bg-[var(--cc-success)]/10 border-[var(--cc-success)]/30",
    error: "bg-[var(--cc-error)]/10 border-[var(--cc-error)]/30",
    info: "bg-[var(--cc-link)]/10 border-[var(--cc-link)]/30",
  };

  const textMap = {
    success: "text-[var(--cc-success)]",
    error: "text-[var(--cc-error)]",
    info: "text-[var(--cc-link)]",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-[var(--cc-radius-md)] border cc-body-sm ${bgMap[type]} ${textMap[type]}`}
      style={{ boxShadow: 'var(--cc-level3)' }}
    >
      {type === "success" && (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {type === "error" && (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )}
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); onClose(); }}
        aria-label="Dismiss notification"
        className="ml-2 p-1 rounded-full hover:bg-[var(--cc-canvas-soft-2)] transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

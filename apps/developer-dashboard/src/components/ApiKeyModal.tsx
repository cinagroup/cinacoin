"use client";

import { useState, useRef, useEffect } from "react";

interface ApiKeyModalProps {
  onCreate: (name: string, permissions: "read" | "write" | "admin") => void;
  onClose: () => void;
}

export default function ApiKeyModal({ onCreate, onClose }: ApiKeyModalProps) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<"read" | "write" | "admin">("read");
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (!modalRef.current) return;
    const modal = modalRef.current;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab") return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    modal.addEventListener("keydown", handleKeyDown);
    // Focus first input on open
    const firstInput = modal.querySelector<HTMLElement>('input, button');
    firstInput?.focus();
    return () => modal.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setLoading(true);
      onCreate(name.trim(), permissions);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-body-lg font-semibold text-ink">Generate API key.</h2>
          <button
            onClick={onClose}
            className="text-ink-mute hover:text-ink text-display-sm leading-none"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-ink mb-1">Key Name</label>
            <input
              type="text"
              placeholder="e.g. Production Key"
              className="cc-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-ink mb-2">Permissions</label>
            <div className="space-y-2">
              {[
                {
                  value: "read" as const,
                  label: "Read",
                  desc: "Read-only access to project data",
                },
                {
                  value: "write" as const,
                  label: "Write",
                  desc: "Read + write access to project resources",
                },
                {
                  value: "admin" as const,
                  label: "Admin",
                  desc: "Full access including key management",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    permissions === option.value
                      ? "border-ink bg-canvas-soft"
                      : "border-hairline hover:border-hairline-dark"
                  }`}
                >
                  <input
                    type="radio"
                    name="permissions"
                    value={option.value}
                    checked={permissions === option.value}
                    onChange={() => setPermissions(option.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-body-sm font-medium text-ink">{option.label}</div>
                    <div className="text-caption text-ink-mute">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="cc-btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? "Generating..." : "Generate Key"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cc-btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

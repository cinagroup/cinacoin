"use client";

import { useState } from "react";

interface ApiKeyModalProps {
  onCreate: (name: string, permissions: "read" | "write" | "admin") => void;
  onClose: () => void;
}

export default function ApiKeyModal({ onCreate, onClose }: ApiKeyModalProps) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<"read" | "write" | "admin">("read");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), permissions);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Generate API Key</h2>
          <button
            onClick={onClose}
            className="text-ink-mute hover:text-ink text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Key Name</label>
            <input
              type="text"
              placeholder="e.g. Production Key"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Permissions</label>
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
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-ink">{option.label}</div>
                    <div className="text-xs text-ink-mute">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center">
              Generate Key
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

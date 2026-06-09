"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export default function MfaVerifyPage() {
  const { doMfaVerify, doRecoveryCode, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 5) {
        const nextInput = document.getElementById(`mfa-${index + 1}`);
        nextInput?.focus();
      }

      // Auto-submit when all digits entered
      if (newCode.every((d) => d !== "") && newCode.join("").length === 6) {
        doMfaVerify(newCode.join(""));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`mfa-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCodeInput.trim()) return;
    await doRecoveryCode(recoveryCodeInput.trim());
  };

  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--cc-radius-sm)] bg-[var(--cc-link)]/10 border border-[var(--cc-link)]/20 mb-4">
            <img src="/logo.png" alt="Cinacoin logo" className="w-10 h-10 rounded-md" />
          </div>
          <h1 className="cc-display-md text-[var(--cc-ink)]">Two-Factor Authentication</h1>
          <p className="text-[var(--cc-muted)] mt-2">Verify your identity</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] p-8 shadow-[var(--cc-level3)]">
          {error && (
            <div className="mb-4 p-3 rounded-[var(--cc-radius-sm)] bg-[var(--cc-error)]/10 border border-[var(--cc-error)]/30 text-[var(--cc-error)] text-sm">
              {error}
            </div>
          )}

          {!useRecovery ? (
            <>
              <h2 className="cc-display-sm text-[var(--cc-ink)] mb-2 text-center">Enter verification code</h2>
              <p className="text-sm text-[var(--cc-muted)] mb-6 text-center">
                Enter the 6-digit code from your authenticator app
              </p>

              <div className="flex gap-2 justify-center mb-6">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`mfa-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading}
                    className="w-12 h-14 text-center text-xl font-medium bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)] focus:border-transparent transition-all disabled:opacity-50"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <svg className="animate-spin h-4 w-4 text-[var(--cc-link)]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-[var(--cc-link)]">Verifying…</span>
                </div>
              )}

              <p className="text-xs text-[var(--cc-muted)] text-center mb-4">
                Code changes every 30 seconds. Make sure your device time is synchronized.
              </p>

              <button
                onClick={() => {
                  setUseRecovery(true);
                  clearError();
                }}
                className="w-full text-sm text-[var(--cc-link)] hover:underline text-center"
              >
                Lost your device? Use a recovery code
              </button>
            </>
          ) : (
            <>
              <h2 className="cc-display-sm text-[var(--cc-ink)] mb-2 text-center">Use recovery code</h2>
              <p className="text-sm text-[var(--cc-muted)] mb-6 text-center">
                Enter one of your recovery codes to access your account
              </p>

              <form onSubmit={handleRecoverySubmit}>
                <input
                  type="text"
                  value={recoveryCodeInput}
                  onChange={(e) => setRecoveryCodeInput(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] bg-[var(--cc-canvas)] text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)] focus:border-transparent mb-4 font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !recoveryCodeInput.trim()}
                  className="cc-btn-primary w-full disabled:opacity-70"
                >
                  {isLoading ? "Verifying…" : "Verify Recovery Code"}
                </button>
              </form>

              <button
                onClick={() => {
                  setUseRecovery(false);
                  clearError();
                }}
                className="w-full text-sm text-[var(--cc-link)] hover:underline text-center mt-4"
              >
                Back to authenticator code
              </button>
            </>
          )}
        </div>

        {/* Back to login */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.replace("/login")}
            className="text-sm text-[var(--cc-body)] hover:text-[var(--cc-ink)] transition-colors"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

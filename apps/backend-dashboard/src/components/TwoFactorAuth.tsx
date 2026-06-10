"use client";

import { useState, useEffect, useCallback } from "react";
import { setupMfa, enableMfa, disableMfa, apiRequest, AUTH_BASE_URL } from "@/lib/api";

type TwoFAStatus = "disabled" | "loading" | "setup" | "verify" | "enabled" | "showRecovery";

interface RecoveryCode {
  code: string;
  used: boolean;
}

export function TwoFactorAuth() {
  const [status, setStatus] = useState<TwoFAStatus>("loading");
  const [verificationCode, setVerificationCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [recoveryCodes, setRecoveryCodes] = useState<RecoveryCode[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check current 2FA status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await apiRequest(`${AUTH_BASE_URL}/auth/mfa/status`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.enabled ? "enabled" : "disabled");
        } else {
          setStatus("disabled");
        }
      } catch {
        setStatus("disabled");
      }
    };
    checkStatus();
  }, []);

  const handleStartSetup = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await setupMfa();
      setSecretKey(data.secret);
      setQrCodeUrl(data.qrCode);
      setStatus("setup");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start 2FA setup");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleProceedToVerify = () => {
    setVerificationCode(["", "", "", "", "", ""]);
    setError(null);
    setStatus("verify");
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`totp-${index + 1}`);
        nextInput?.focus();
      }

      // Auto-submit when all digits entered
      if (newCode.every((d) => d !== "") && newCode.join("").length === 6) {
        const code = newCode.join("");
        handleVerifyCode(code);
      }
    }
  };

  const handleVerifyCode = useCallback(async (code: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await enableMfa(code);
      // Store recovery codes from the response
      const codes: RecoveryCode[] = data.recoveryCodes.map((c: string) => ({
        code: c,
        used: false,
      }));
      setRecoveryCodes(codes);
      setStatus("showRecovery");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid verification code");
      setVerificationCode(["", "", "", "", "", ""]);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`totp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAllCodes = () => {
    const codesText = recoveryCodes.map((rc) => rc.code).join("\n");
    navigator.clipboard.writeText(codesText);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const handleDisable = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      // For disable, user needs to enter a TOTP code
      // We'll prompt for it inline
      const code = window.prompt("Enter your current 2FA code to disable:");
      if (!code) {
        setIsSubmitting(false);
        return;
      }
      await disableMfa(code);
      setStatus("disabled");
      setRecoveryCodes([]);
      setVerificationCode(["", "", "", "", "", ""]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setStatus("enabled");
  };

  const handleCancel = () => {
    setStatus("disabled");
    setError(null);
    setQrCodeUrl(null);
    setSecretKey(null);
    setVerificationCode(["", "", "", "", "", ""]);
  };

  if (status === "loading") {
    return (
      <div className="cc-card p-lg flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--cc-muted)]">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-body-sm">Loading 2FA status…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Error display */}
      {error && (
        <div className="bg-[var(--color-error-soft)] border border-[var(--color-error)]/20 rounded-md p-3 flex items-start gap-2">
          <svg className="w-4 h-4 mt-1 flex-shrink-0 text-[var(--color-error)]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-body-sm text-[var(--color-error-deep)]">{error}</p>
        </div>
      )}

      {/* Status Card */}
      <div className="cc-card p-lg">
        <div className="flex items-start justify-between mb-lg">
          <div>
            <h2 className="text-heading-3 text-ink mb-1">Two-Factor Authentication</h2>
            <p className="text-body text-body-color">
              Add an extra layer of security to your account
            </p>
          </div>
          <div className={`badge ${status === "enabled" || status === "showRecovery" ? "badge-success" : "badge-neutral"}`}>
            {status === "enabled" ? "Enabled" : "Disabled"}
          </div>
        </div>

        {status === "disabled" && (
          <div className="border border-hairline rounded-md p-lg bg-canvas-soft">
            <div className="flex items-start gap-md">
              <div className="w-10 h-10 rounded-md bg-canvas-soft-2 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-body font-medium text-ink mb-1">Protect your account</h3>
                <p className="text-body-sm text-body-color mb-md">
                  Two-factor authentication requires a verification code from your phone in addition to your password.
                  This helps prevent unauthorized access even if your password is compromised.
                </p>
                <button
                  onClick={handleStartSetup}
                  disabled={isSubmitting}
                  className="cc-btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? "Setting up…" : "Enable 2FA"}
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "setup" && (
          <div className="space-y-lg">
            {/* Step indicator */}
            <div className="flex items-center gap-sm text-caption">
              <span className="flex items-center gap-1 text-link font-medium">
                <span className="w-5 h-5 rounded-full bg-link text-[var(--color-on-primary)] flex items-center justify-center text-[10px]">1</span>
                Scan QR Code
              </span>
              <span className="w-8 h-px bg-hairline"></span>
              <span className="flex items-center gap-1 text-mute">
                <span className="w-5 h-5 rounded-full bg-canvas-soft-2 text-mute flex items-center justify-center text-[10px]">2</span>
                Enter Code
              </span>
              <span className="w-8 h-px bg-hairline"></span>
              <span className="flex items-center gap-1 text-mute">
                <span className="w-5 h-5 rounded-full bg-canvas-soft-2 text-mute flex items-center justify-center text-[10px]">3</span>
                Save Recovery Codes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {/* QR Code */}
              <div className="border border-hairline rounded-md p-lg flex flex-col items-center">
                <p className="text-body-sm text-body-color mb-md text-center">
                  Scan this QR code with your authenticator app
                </p>
                <div className="w-48 h-48 bg-canvas border border-hairline rounded-md p-3 mb-md">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-mute text-caption">
                      Loading QR…
                    </div>
                  )}
                </div>
                <p className="text-caption text-mute text-center">
                  Works with Google Authenticator, Authy, 1Password, etc.
                </p>
              </div>

              {/* Manual entry */}
              <div className="border border-hairline rounded-md p-lg">
                <h3 className="text-body font-medium text-ink mb-md">Can&apos;t scan the code?</h3>
                <p className="text-body-sm text-body-color mb-md">
                  Enter this secret key manually in your authenticator app:
                </p>
                <div className="bg-canvas-soft rounded-md p-3 mb-lg">
                  <code className="text-code text-body text-ink tracking-wider">
                    {secretKey || "Loading…"}
                  </code>
                </div>
                <div className="border-t border-hairline pt-md">
                  <h4 className="text-body-sm font-medium text-ink mb-2">Setup instructions:</h4>
                  <ol className="text-body-sm text-body-color space-y-1 list-decimal list-inside">
                    <li>Download an authenticator app</li>
                    <li>Scan the QR code or enter the key</li>
                    <li>Enter the 6-digit code below to verify</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-md pt-md border-t border-hairline">
              <button
                onClick={handleProceedToVerify}
                disabled={isSubmitting}
                className="cc-btn-primary"
              >
                I&apos;ve scanned the code — Next
              </button>
              <button onClick={handleCancel} className="cc-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {status === "verify" && (
          <div className="space-y-lg">
            {/* Step indicator */}
            <div className="flex items-center gap-sm text-caption">
              <span className="flex items-center gap-1 text-success font-medium">
                <span className="w-5 h-5 rounded-full bg-success text-[var(--color-on-primary)] flex items-center justify-center text-[10px]">✓</span>
                Scan QR Code
              </span>
              <span className="w-8 h-px bg-hairline"></span>
              <span className="flex items-center gap-1 text-link font-medium">
                <span className="w-5 h-5 rounded-full bg-link text-[var(--color-on-primary)] flex items-center justify-center text-[10px]">2</span>
                Enter Code
              </span>
              <span className="w-8 h-px bg-hairline"></span>
              <span className="flex items-center gap-1 text-mute">
                <span className="w-5 h-5 rounded-full bg-canvas-soft-2 text-mute flex items-center justify-center text-[10px]">3</span>
                Save Recovery Codes
              </span>
            </div>

            <div className="max-w-sm mx-auto text-center py-lg">
              <h3 className="text-heading-3 text-ink mb-2">Enter verification code</h3>
              <p className="text-body text-body-color mb-lg">
                Enter the 6-digit code from your authenticator app
              </p>

              <div className="flex gap-2 justify-center mb-lg">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`totp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isSubmitting}
                    className="w-12 h-14 text-center text-heading-3 font-medium bg-canvas border border-hairline rounded-md focus:outline-none focus:ring-2 focus:ring-link focus:border-transparent transition-all disabled:opacity-50"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {isSubmitting && (
                <p className="text-caption text-link mb-md">Verifying…</p>
              )}

              <p className="text-caption text-mute">
                Code changes every 30 seconds. Make sure your device time is synchronized.
              </p>
            </div>

            <div className="flex gap-md justify-center pt-md border-t border-hairline">
              <button onClick={() => setStatus("setup")} className="cc-btn-secondary">
                Back
              </button>
            </div>
          </div>
        )}

        {status === "showRecovery" && (
          <div className="space-y-lg">
            {/* Step indicator */}
            <div className="flex items-center gap-sm text-caption">
              <span className="flex items-center gap-1 text-success font-medium">
                <span className="w-5 h-5 rounded-full bg-success text-[var(--color-on-primary)] flex items-center justify-center text-[10px]">✓</span>
                Scan QR Code
              </span>
              <span className="w-8 h-px bg-hairline"></span>
              <span className="flex items-center gap-1 text-success font-medium">
                <span className="w-5 h-5 rounded-full bg-success text-[var(--color-on-primary)] flex items-center justify-center text-[10px]">✓</span>
                Enter Code
              </span>
              <span className="w-8 h-px bg-hairline"></span>
              <span className="flex items-center gap-1 text-link font-medium">
                <span className="w-5 h-5 rounded-full bg-link text-[var(--color-on-primary)] flex items-center justify-center text-[10px]">3</span>
                Save Recovery Codes
              </span>
            </div>

            {/* Recovery codes */}
            <div className="border border-hairline rounded-md p-lg">
              <div className="flex items-start justify-between mb-md">
                <div>
                  <h3 className="text-body font-medium text-ink mb-1">Recovery Codes</h3>
                  <p className="text-body-sm text-body-color">
                    Save these recovery codes in a secure place. You can use them to access your account if you lose your authenticator device.
                  </p>
                </div>
                <button
                  onClick={handleCopyAllCodes}
                  className="cc-btn-secondary text-caption flex-shrink-0"
                >
                  {allCopied ? "✓ Copied" : "Copy All"}
                </button>
              </div>

              <div className="bg-canvas-soft rounded-md p-md">
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((rc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-canvas border border-hairline rounded-sm px-3 py-2"
                    >
                      <code className="text-code text-body-sm text-ink">
                        {rc.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(rc.code, index)}
                        className="text-caption text-mute hover:text-ink transition-colors"
                      >
                        {copiedIndex === index ? "✓" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-md p-3 bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/20 rounded-md">
                <p className="text-body-sm text-[var(--color-warning-deep)] flex items-start gap-2">
                  <svg className="w-4 h-4 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Each recovery code can only be used once. Store them securely — anyone with these codes can access your account.</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-md border-t border-hairline">
              <button onClick={handleDone} className="cc-btn-primary">
                Done — I&apos;ve Saved My Recovery Codes
              </button>
            </div>
          </div>
        )}

        {status === "enabled" && (
          <div className="space-y-lg">
            <div className="border border-hairline rounded-md p-lg bg-canvas-soft">
              <div className="flex items-start gap-md">
                <div className="w-10 h-10 rounded-md bg-[var(--color-success)]/15 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-success)]">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-body font-medium text-ink mb-1">2FA is enabled</h3>
                  <p className="text-body-sm text-body-color mb-md">
                    Your account is protected with two-factor authentication. You&apos;ll need a verification code from your authenticator app when logging in.
                  </p>
                  <button
                    onClick={handleDisable}
                    disabled={isSubmitting}
                    className="cc-btn-danger disabled:opacity-50"
                  >
                    {isSubmitting ? "Disabling…" : "Disable 2FA"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional info card */}
      <div className="cc-card p-lg">
        <h3 className="text-body font-medium text-ink mb-md">About Two-Factor Authentication</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="p-md border border-hairline rounded-md">
            <div className="w-8 h-8 rounded-md bg-canvas-soft-2 flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h4 className="text-body-sm font-medium text-ink mb-1">Enhanced Security</h4>
            <p className="text-caption text-body-color">
              Even if someone obtains your password, they cannot access your account without the verification code.
            </p>
          </div>
          <div className="p-md border border-hairline rounded-md">
            <div className="w-8 h-8 rounded-md bg-canvas-soft-2 flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <h4 className="text-body-sm font-medium text-ink mb-1">Authenticator App</h4>
            <p className="text-caption text-body-color">
              Uses time-based one-time passwords (TOTP) compatible with Google Authenticator, Authy, and others.
            </p>
          </div>
          <div className="p-md border border-hairline rounded-md">
            <div className="w-8 h-8 rounded-md bg-canvas-soft-2 flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h4 className="text-body-sm font-medium text-ink mb-1">Recovery Options</h4>
            <p className="text-caption text-body-color">
              Backup recovery codes ensure you can always access your account, even if you lose your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

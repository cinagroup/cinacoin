"use client";

import { useState } from "react";

type TwoFAStatus = "disabled" | "setup" | "verify" | "enabled";

interface RecoveryCode {
  code: string;
  used: boolean;
}

const mockRecoveryCodes: RecoveryCode[] = [
  { code: "A1B2-C3D4-E5F6", used: false },
  { code: "G7H8-I9J0-K1L2", used: false },
  { code: "M3N4-O5P6-Q7R8", used: false },
  { code: "S9T0-U1V2-W3X4", used: false },
  { code: "Y5Z6-A7B8-C9D0", used: false },
  { code: "E1F2-G3H4-I5J6", used: false },
  { code: "K7L8-M9N0-O1P2", used: false },
  { code: "Q3R4-S5T6-U7V8", used: false },
];

export function TwoFactorAuth() {
  const [status, setStatus] = useState<TwoFAStatus>("disabled");
  const [verificationCode, setVerificationCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [recoveryCodes] = useState<RecoveryCode[]>(mockRecoveryCodes);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const handleStartSetup = () => {
    setStatus("setup");
  };

  const handleProceedToVerify = () => {
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

      // Auto-verify when all digits entered
      if (newCode.every((d) => d !== "") && newCode.join("").length === 6) {
        setTimeout(() => {
          setStatus("enabled");
        }, 500);
      }
    }
  };

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

  const handleDisable = () => {
    setStatus("disabled");
    setVerificationCode(["", "", "", "", "", ""]);
  };

  return (
    <div className="space-y-lg">
      {/* Status Card */}
      <div className="card p-lg">
        <div className="flex items-start justify-between mb-lg">
          <div>
            <h2 className="text-heading-3 text-ink mb-1">Two-Factor Authentication</h2>
            <p className="text-body text-body-color">
              Add an extra layer of security to your account
            </p>
          </div>
          <div className={`badge ${status === "enabled" ? "badge-success" : "badge-neutral"}`}>
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
                <button onClick={handleStartSetup} className="btn btn-primary">
                  Enable 2FA
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
                <span className="w-5 h-5 rounded-full bg-link text-white flex items-center justify-center text-[10px]">1</span>
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
                <div className="w-48 h-48 bg-white border border-hairline rounded-md p-3 mb-md">
                  {/* SVG QR Code placeholder - in production, use a real QR library */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* QR Code pattern */}
                    <rect fill="#171717" x="5" y="5" width="25" height="25" rx="2" />
                    <rect fill="#171717" x="70" y="5" width="25" height="25" rx="2" />
                    <rect fill="#171717" x="5" y="70" width="25" height="25" rx="2" />
                    <rect fill="white" x="10" y="10" width="15" height="15" rx="1" />
                    <rect fill="white" x="75" y="10" width="15" height="15" rx="1" />
                    <rect fill="white" x="10" y="75" width="15" height="15" rx="1" />
                    <rect fill="#171717" x="13" y="13" width="9" height="9" rx="1" />
                    <rect fill="#171717" x="78" y="13" width="9" height="9" rx="1" />
                    <rect fill="#171717" x="13" y="78" width="9" height="9" rx="1" />
                    {/* Data modules */}
                    <rect fill="#171717" x="35" y="5" width="5" height="5" />
                    <rect fill="#171717" x="45" y="5" width="5" height="5" />
                    <rect fill="#171717" x="55" y="5" width="5" height="5" />
                    <rect fill="#171717" x="35" y="15" width="5" height="5" />
                    <rect fill="#171717" x="50" y="15" width="5" height="5" />
                    <rect fill="#171717" x="60" y="15" width="5" height="5" />
                    <rect fill="#171717" x="40" y="25" width="5" height="5" />
                    <rect fill="#171717" x="55" y="25" width="5" height="5" />
                    <rect fill="#171717" x="35" y="35" width="5" height="5" />
                    <rect fill="#171717" x="45" y="35" width="5" height="5" />
                    <rect fill="#171717" x="60" y="35" width="5" height="5" />
                    <rect fill="#171717" x="75" y="35" width="5" height="5" />
                    <rect fill="#171717" x="85" y="35" width="5" height="5" />
                    <rect fill="#171717" x="5" y="35" width="5" height="5" />
                    <rect fill="#171717" x="15" y="40" width="5" height="5" />
                    <rect fill="#171717" x="25" y="40" width="5" height="5" />
                    <rect fill="#171717" x="40" y="45" width="5" height="5" />
                    <rect fill="#171717" x="55" y="45" width="5" height="5" />
                    <rect fill="#171717" x="70" y="45" width="5" height="5" />
                    <rect fill="#171717" x="85" y="45" width="5" height="5" />
                    <rect fill="#171717" x="5" y="50" width="5" height="5" />
                    <rect fill="#171717" x="20" y="50" width="5" height="5" />
                    <rect fill="#171717" x="35" y="55" width="5" height="5" />
                    <rect fill="#171717" x="50" y="55" width="5" height="5" />
                    <rect fill="#171717" x="65" y="55" width="5" height="5" />
                    <rect fill="#171717" x="80" y="55" width="5" height="5" />
                    <rect fill="#171717" x="10" y="60" width="5" height="5" />
                    <rect fill="#171717" x="25" y="60" width="5" height="5" />
                    <rect fill="#171717" x="45" y="60" width="5" height="5" />
                    <rect fill="#171717" x="60" y="60" width="5" height="5" />
                    <rect fill="#171717" x="75" y="60" width="5" height="5" />
                    <rect fill="#171717" x="90" y="60" width="5" height="5" />
                    <rect fill="#171717" x="35" y="70" width="5" height="5" />
                    <rect fill="#171717" x="50" y="70" width="5" height="5" />
                    <rect fill="#171717" x="65" y="70" width="5" height="5" />
                    <rect fill="#171717" x="80" y="70" width="5" height="5" />
                    <rect fill="#171717" x="40" y="80" width="5" height="5" />
                    <rect fill="#171717" x="55" y="80" width="5" height="5" />
                    <rect fill="#171717" x="70" y="80" width="5" height="5" />
                    <rect fill="#171717" x="85" y="80" width="5" height="5" />
                    <rect fill="#171717" x="35" y="90" width="5" height="5" />
                    <rect fill="#171717" x="45" y="90" width="5" height="5" />
                    <rect fill="#171717" x="60" y="90" width="5" height="5" />
                    <rect fill="#171717" x="75" y="90" width="5" height="5" />
                    <rect fill="#171717" x="90" y="90" width="5" height="5" />
                  </svg>
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
                  <code className="font-mono text-body text-ink tracking-wider">
                    JBSWY3DPEHPK3PXP
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
              <button onClick={handleProceedToVerify} className="btn btn-primary">
                I&apos;ve scanned the code — Next
              </button>
              <button onClick={() => setStatus("disabled")} className="btn btn-secondary">
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
                <span className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center text-[10px]">✓</span>
                Scan QR Code
              </span>
              <span className="w-8 h-px bg-hairline"></span>
              <span className="flex items-center gap-1 text-link font-medium">
                <span className="w-5 h-5 rounded-full bg-link text-white flex items-center justify-center text-[10px]">2</span>
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
                    className="w-12 h-14 text-center text-heading-3 font-medium bg-canvas border border-hairline rounded-md focus:outline-none focus:ring-2 focus:ring-link focus:border-transparent transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <p className="text-caption text-mute">
                Code changes every 30 seconds. Make sure your device time is synchronized.
              </p>
            </div>

            <div className="flex gap-md justify-center pt-md border-t border-hairline">
              <button onClick={() => setStatus("setup")} className="btn btn-secondary">
                Back
              </button>
            </div>
          </div>
        )}

        {status === "enabled" && (
          <div className="space-y-lg">
            {/* Step indicator */}
            <div className="flex items-center gap-sm text-caption">
              <span className="flex items-center gap-1 text-success font-medium">
                <span className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center text-[10px]">✓</span>
                Scan QR Code
              </span>
              <span className="w-8 h-px bg-hairline"></span>
              <span className="flex items-center gap-1 text-success font-medium">
                <span className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center text-[10px]">✓</span>
                Enter Code
              </span>
              <span className="w-8 h-px bg-hairline"></span>
              <span className="flex items-center gap-1 text-link font-medium">
                <span className="w-5 h-5 rounded-full bg-link text-white flex items-center justify-center text-[10px]">3</span>
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
                  className="btn btn-secondary text-caption flex-shrink-0"
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
                      <code className="font-mono text-body-sm text-ink">
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

              <div className="mt-md p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-body-sm text-yellow-800 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Each recovery code can only be used once. Store them securely — anyone with these codes can access your account.</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-md border-t border-hairline">
              <button onClick={handleDisable} className="btn btn-danger">
                Disable 2FA
              </button>
              <button className="btn btn-primary">
                Done — Save Recovery Codes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Additional info card */}
      <div className="card p-lg">
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

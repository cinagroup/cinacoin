'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUri, setTotpUri] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const data = await api.register(formData.email, formData.username, formData.password);

      if (data.mfaRequired || data.mfaSetupRequired) {
        // Need to setup 2FA
        setMfaToken(data.mfaToken || '');
        setMfaSetupRequired(true);

        const setupData = await api.setupTotp(data.mfaToken || '');
        if (setupData.data) {
          setTotpSecret(setupData.data.secret);
          setTotpUri(setupData.data.uri);
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.verifyTotp(mfaToken, totpCode);
      if (data.accessToken || data.data?.accessToken) {
        router.push('/dashboard');
      } else {
        throw new Error('Verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = api.getOAuthUrl(provider, window.location.origin + '/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2FA Setup View
  if (mfaSetupRequired) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-heading-2 mb-2">Set Up Two-Factor Authentication</h2>
          <p className="text-body text-body-color">
            Scan the QR code with your authenticator app to secure your account
          </p>
        </div>

        {totpUri && (
          <div className="flex justify-center">
            <Image
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
              alt="Two-factor authentication QR code"
              width={192}
              height={192}
              unoptimized
            />
          </div>
        )}

        {totpSecret && (
          <div className="p-3 bg-canvas-soft rounded-lg text-center">
            <p className="text-caption text-mute mb-1">Manual entry code:</p>
            <code className="text-code">{totpSecret}</code>
          </div>
        )}

        <form onSubmit={handleVerifyTotp} className="space-y-4">
          <div>
            <label htmlFor="register-setup-totp" className="block text-body font-medium mb-2">Verification Code</label>
            <input
              id="register-setup-totp"
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
              autoFocus
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? "register-setup-totp-error" : "register-setup-totp-help"}
              autoComplete="one-time-code"
              inputMode="numeric"
              className="cc-form-input text-center text-body-lg tracking-widest"
            />
            <p id="register-setup-totp-help" className="text-caption text-mute mt-1">Enter the 6-digit code from your authenticator app</p>
          </div>

          {error && (
            <div id="register-setup-totp-error" role="alert" className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-body-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || totpCode.length !== 6}
            className="w-full cc-btn-primary"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>
      </div>
    );
  }

  // Register View
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div id="register-error" role="alert" className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-body-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="register-email" className="block text-body font-medium mb-2">Email</label>
          <input
            id="register-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : undefined}
            autoComplete="email"
            className="cc-form-input"
          />
        </div>

        <div>
          <label htmlFor="register-username" className="block text-body font-medium mb-2">Username</label>
          <input
            id="register-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : undefined}
            autoComplete="username"
            className="cc-form-input"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="block text-body font-medium mb-2">Password</label>
          <input
            id="register-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : "register-password-help"}
            autoComplete="new-password"
            className="cc-form-input"
          />
          <p id="register-password-help" className="text-caption text-mute mt-1">Minimum 8 characters</p>
        </div>

        <div>
          <label htmlFor="register-confirm-password" className="block text-body font-medium mb-2">Confirm Password</label>
          <input
            id="register-confirm-password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? "register-error" : undefined}
            autoComplete="new-password"
            className="cc-form-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full cc-btn-primary"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-hairline"></div>
        </div>
        <div className="relative flex justify-center text-body-sm">
          <span className="px-2 bg-canvas-soft text-mute">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleOAuthLogin('github')}
          aria-label="Continue with GitHub"
          className="flex items-center justify-center px-4 py-3 border border-hairline rounded-lg hover:bg-canvas-soft transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </button>
        <button
          onClick={() => handleOAuthLogin('google')}
          aria-label="Continue with Google"
          className="flex items-center justify-center px-4 py-3 border border-hairline rounded-lg hover:bg-canvas-soft transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        </button>
        <button
          onClick={() => handleOAuthLogin('discord')}
          aria-label="Continue with Discord"
          className="flex items-center justify-center px-4 py-3 border border-hairline rounded-lg hover:bg-canvas-soft transition-colors"
        >
          <svg className="w-5 h-5" fill="#5865F2" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
        </button>
      </div>
    </div>
  );
}

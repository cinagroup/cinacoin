'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FarcasterProvider, FarcasterAuth } from '@cinacoin/farcaster-miniapp';
import { Link } from 'lucide-react';
import type { FarcasterUser, FarcasterContext } from '@cinacoin/farcaster-miniapp';

interface FarcasterConnectProps {
  /** Callback when connection succeeds */
  onConnect?: (user: FarcasterUser) => void;
  /** Callback when connection fails */
  onError?: (error: Error) => void;
  /** Custom app name */
  appName?: string;
  /** Supported chain IDs */
  chains?: number[];
}

/**
 * FarcasterConnect - Sign-In with Farcaster button and state management.
 *
 * Handles the SIWF flow using the @cinacoin/farcaster-miniapp SDK.
 */
export function FarcasterConnect({
  onConnect,
  onError,
  appName = 'Cinacoin',
  chains = [1, 10, 8453],
}: FarcasterConnectProps) {
  const [provider, setProvider] = useState<FarcasterProvider | null>(null);
  const [context, setContext] = useState<FarcasterContext | null>(null);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize provider
    const fcProvider = new FarcasterProvider({
      appName,
      chains,
      autoInit: true,
    });

    setProvider(fcProvider);

    // Try to init
    fcProvider.init().then((ctx) => {
      if (ctx) {
        setContext(ctx);
        if (ctx.user) {
          setUser(ctx.user);
        }
      }
    }).catch(() => {
      // Not in Farcaster context
    });
  }, [appName, chains]);

  const handleConnect = async () => {
    if (!provider) {
      setError('Provider not initialized.');
      onError?.(new Error('Provider not initialized'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we're in Farcaster
      if (!provider.isInFarcaster) {
        throw new Error('Not running inside Farcaster. Open this app in the Farcaster client.');
      }

      // Get user from context
      const fcUser = provider.user;
      if (!fcUser) {
        throw new Error('No Farcaster user found in context');
      }

      // Generate nonce for SIWF
      const nonce = FarcasterAuth.generateNonce();

      // Create sign-in message
      const message = FarcasterAuth.createSignInMessage(fcUser, {
        domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        nonce,
        statement: 'Sign in with Farcaster to Cinacoin.',
      });

      // In production, request signature from Farcaster client
      // For now, we'll just use the user data directly
      setUser(fcUser);
      onConnect?.(fcUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed.';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setUser(null);
    setContext(null);
  };

  // Already connected
  if (user) {
    return (
      <div className="flex items-center space-x-3">
        {user.pfp_url && (
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={user.pfp_url}
              alt={user.display_name ?? user.username}
              fill
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          </div>
        )}
        <div>
          <p className="text-[var(--cc-ink)] font-medium">
            {user.display_name ?? user.username}
          </p>
          <p className="text-body-sm text-[var(--cc-mute)]">@{user.username}</p>
        </div>
        <button
          onClick={handleDisconnect}
          className="ml-auto text-body-sm text-[var(--cc-mute)] hover:text-[var(--cc-ink)]"
          aria-label="Disconnect"
        >
          Disconnect.
        </button>
      </div>
    );
  }

  // Not connected
  return (
    <div className="space-y-3">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full bg-[var(--cc-violet)] hover:bg-[var(--cc-violet-deep)] disabled:bg-[var(--cc-hairline-strong)] disabled:cursor-not-allowed text-[var(--cc-on-primary)] px-6 py-3 rounded-sm font-medium transition-colors flex items-center justify-center space-x-2"
        aria-label="Sign in with Farcaster"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Link className="w-5 h-5" aria-hidden="true" />
            <span>Sign in with Farcaster</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-[var(--cc-error)] text-body-sm text-center" role="alert">{error}</p>
      )}

      {!provider?.isInFarcaster && (
        <p className="text-[var(--cc-mute)] text-caption text-center">
          Open in Farcaster to connect.
        </p>
      )}
    </div>
  );
}

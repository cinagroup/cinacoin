'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import type { FarcasterUser } from '@cinacoin/farcaster-miniapp';
import { User, ExternalLink } from 'lucide-react';

interface ProfileCardProps {
  /** Farcaster user data */
  user: FarcasterUser | null;
  /** Connected wallet address */
  walletAddress?: `0x${string}` | null;
  /** Loading state */
  loading?: boolean;
}

/**
 * ProfileCard - Display Farcaster identity and wallet connection.
 *
 * Shows user avatar, username, FID, verified addresses, and wallet status.
 */
export const ProfileCard = React.memo(function ProfileCard({
  user,
  walletAddress,
  loading = false,
}: ProfileCardProps) {
  if (loading) {
    return (
      <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-6 border border-[var(--cc-hairline)] animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-[var(--cc-canvas-soft-2)] rounded-full" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-[var(--cc-canvas-soft-2)] rounded" />
            <div className="h-3 w-24 bg-[var(--cc-canvas-soft-2)] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-6 border border-[var(--cc-hairline)] text-center">
        <div className="w-16 h-16 mx-auto bg-[var(--cc-canvas-soft-2)] rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-[var(--cc-mute)]" aria-hidden="true" />
        </div>
        <p className="text-[var(--cc-mute)]">Not connected</p>
        <p className="text-body-sm text-[var(--cc-mute)] mt-1">Sign in with Farcaster to view profile.</p>
      </div>
    );
  }

  const verifiedAddress = user.verified_addresses?.eth_addresses?.[0];
  const displayName = user.display_name ?? user.username;

  return (
    <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-6 border border-[var(--cc-hairline)] space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-4">
        {user.pfp_url ? (
          <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[var(--cc-violet)]">
            <Image
              src={user.pfp_url}
              alt={displayName}
              fill
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--cc-violet)] to-[var(--cc-link)] flex items-center justify-center text-display-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="text-display-sm font-semibold text-[var(--cc-ink)] flex items-center space-x-2">
            <span>{displayName}</span>
            {user.verified && (
              <span className="text-[var(--cc-link)]" title="Verified" aria-label="Verified user">✓</span>
            )}
          </h3>
          <p className="text-[var(--cc-mute)]">@{user.username}</p>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-[var(--cc-body)] text-body-sm">{user.bio}</p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-3">
          <p className="text-caption text-[var(--cc-mute)] mb-1">Farcaster FID</p>
          <p className="text-[var(--cc-ink)] font-[family-name:var(--font-geist-mono)]">{user.fid}</p>
        </div>
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-3">
          <p className="text-caption text-[var(--cc-mute)] mb-1">Wallet</p>
          <p className="text-[var(--cc-ink)] font-[family-name:var(--font-geist-mono)] text-caption truncate">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : 'Not connected.'}
          </p>
        </div>
      </div>

      {/* Verified Addresses */}
      {(verifiedAddress || user.custody_address) && (
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-3 space-y-2">
          <p className="text-caption text-[var(--cc-mute)]">Verified Addresses</p>
          {verifiedAddress && (
            <p className="text-body-sm text-[var(--cc-success)] font-[family-name:var(--font-geist-mono)] truncate">
              {verifiedAddress}
            </p>
          )}
          {user.custody_address && user.custody_address !== verifiedAddress && (
            <p className="text-body-sm text-[var(--cc-mute)] font-[family-name:var(--font-geist-mono)] truncate">
              Custody: {user.custody_address}
            </p>
          )}
        </div>
      )}

      {/* External Link */}
      {user.url && (
        <a
          href={user.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-body-sm text-[var(--cc-violet)] hover:text-[var(--cc-violet)] transition-colors"
          aria-label={`Visit ${user.url}`}
        >
          <span className="flex items-center justify-center gap-1"><ExternalLink className="w-4 h-4" aria-hidden="true" /> {user.url.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
    </div>
  );
});

'use client';

import React from 'react';
import type { FarcasterUser } from '@cinacoin/farcaster-miniapp';

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
export function ProfileCard({
  user,
  walletAddress,
  loading = false,
}: ProfileCardProps) {
  if (loading) {
    return (
      <div className="bg-[var(--color-canvas-soft-2)] rounded-2xl p-6 border border-[var(--color-hairline)] animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-[var(--color-canvas-soft-2)] rounded-full" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-[var(--color-canvas-soft-2)] rounded" />
            <div className="h-3 w-24 bg-[var(--color-canvas-soft-2)] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[var(--color-canvas-soft-2)] rounded-2xl p-6 border border-[var(--color-hairline)] text-center">
        <div className="w-16 h-16 mx-auto bg-[var(--color-canvas-soft-2)] rounded-full flex items-center justify-center text-[24px] mb-4">
          👤
        </div>
        <p className="text-[var(--color-mute)]">Not connected</p>
        <p className="text-[14px] text-[var(--color-mute)] mt-1">Sign in with Farcaster to view profile</p>
      </div>
    );
  }

  const verifiedAddress = user.verified_addresses?.eth_addresses?.[0];
  const displayName = user.display_name ?? user.username;

  return (
    <div className="bg-[var(--color-canvas-soft-2)] rounded-2xl p-6 border border-[var(--color-hairline)] space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-4">
        {user.pfp_url ? (
          <img
            src={user.pfp_url}
            alt={displayName}
            className="w-16 h-16 rounded-full ring-2 ring-[var(--color-violet)]"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-violet)] to-[var(--color-link)] flex items-center justify-center text-[24px]">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="text-[20px] font-bold text-[var(--color-on-primary)] flex items-center space-x-2">
            <span>{displayName}</span>
            {user.verified && (
              <span className="text-[var(--color-link)]" title="Verified">✓</span>
            )}
          </h3>
          <p className="text-[var(--color-mute)]">@{user.username}</p>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-[var(--color-body)] text-[14px]">{user.bio}</p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--color-canvas-soft-2)] rounded-xl p-3">
          <p className="text-[12px] text-[var(--color-mute)] mb-1">Farcaster FID</p>
          <p className="text-[var(--color-on-primary)] font-[var(--font-mono)]">{user.fid}</p>
        </div>
        <div className="bg-[var(--color-canvas-soft-2)] rounded-xl p-3">
          <p className="text-[12px] text-[var(--color-mute)] mb-1">Wallet</p>
          <p className="text-[var(--color-on-primary)] font-[var(--font-mono)] text-[12px] truncate">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : 'Not connected'}
          </p>
        </div>
      </div>

      {/* Verified Addresses */}
      {(verifiedAddress || user.custody_address) && (
        <div className="bg-[var(--color-canvas-soft-2)] rounded-xl p-3 space-y-2">
          <p className="text-[12px] text-[var(--color-mute)]">Verified Addresses</p>
          {verifiedAddress && (
            <p className="text-[14px] text-[var(--color-success)] font-[var(--font-mono)] truncate">
              {verifiedAddress}
            </p>
          )}
          {user.custody_address && user.custody_address !== verifiedAddress && (
            <p className="text-[14px] text-[var(--color-mute)] font-[var(--font-mono)] truncate">
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
          className="block text-center text-[14px] text-[var(--color-violet)] hover:text-[var(--color-violet)] transition-colors"
        >
          🔗 {user.url.replace(/^https?:\/\//, '')}
        </a>
      )}
    </div>
  );
}

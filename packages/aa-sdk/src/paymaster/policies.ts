/**
 * Paymaster sponsorship policies
 */

import type { Address } from 'viem';

export interface SponsorshipPolicy {
  type: string;
  description?: string;
}

export interface FreeTierPolicy extends SponsorshipPolicy {
  type: 'free-tier';
}

export interface WhitelistPolicy extends SponsorshipPolicy {
  type: 'whitelist';
  allowedAddresses: Address[];
}

export interface BlacklistPolicy extends SponsorshipPolicy {
  type: 'blacklist';
  blockedAddresses: Address[];
}

export interface GasLimitPolicy extends SponsorshipPolicy {
  type: 'gas-limit';
  maxGasPerOp?: bigint;
  maxGasPerWindow?: bigint;
  windowMs?: number;
}

export type AnySponsorshipPolicy =
  | FreeTierPolicy
  | WhitelistPolicy
  | BlacklistPolicy
  | GasLimitPolicy;

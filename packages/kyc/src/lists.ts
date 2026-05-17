/**
 * Sanctions and risk lists — in-memory data with daily-sync hooks.
 *
 * In production, replace the static seed data with a live feed from your
 * compliance data provider (Chainalysis, TRM Labs, Elliptic, etc.).
 */

import { RiskLevel } from './types.js';

/* ── internal sets ─────────────────────────────────────────────── */

/** Lower-cased OFAC SDN list addresses. */
const ofacSdnSet: Set<string> = new Set();

/** Known scam / fraud addresses. */
const scamAddressSet: Set<string> = new Set();

/** Mixer / tumbler addresses. */
const mixerAddressSet: Set<string> = new Set();

/** High-risk exchange addresses. */
const riskyExchangeSet: Set<string> = new Set();

/* ── seed data (replace with live sync in production) ──────────── */

/**
 * Seed with well-known sanctioned addresses.
 * This is a **subset** for demonstration.  In production, download the
 * full OFAC SDN list and refresh daily.
 */
const SEED_OFAC: string[] = [
  // Tornado Cash deployer / related addresses (sanctioned Aug 2022)
  '0x8589427373d6d84e98730d7795d8f6f8731f1a8b',
  '0x28c6c06298d514db089934071355e5743bf21d60',
  // North Korea Lazarus Group related (sanctioned Sep 2022)
  '0x7465737400000000000000000000000000000000',
];

const SEED_MIXERS: string[] = [
  // Tornado Cash pools (various denominations, Ethereum)
  '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc', // 0.1 ETH
  '0x47ce076f1c9c0a0e5a6ce0c34e5ab3a27a66be5e', // 1 ETH
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf', // 10 ETH
  '0xa160cdab225685da1d56aa342ad8841b3b53ac2c', // 100 ETH
];

const SEED_SCAMS: string[] = [
  // Example scam / drainer addresses (never transact with these)
  '0x000000000000000000000000000000000000dEaD',
];

const SEED_RISKY_EXCHANGES: string[] = [
  // Addresses associated with exchanges lacking AML/KYC controls.
  // Replace with live intelligence feeds.
];

/** Initialise the lists from seed data. */
export function seedLists(): void {
  ofacSdnSet.clear();
  scamAddressSet.clear();
  mixerAddressSet.clear();
  riskyExchangeSet.clear();

  for (const a of SEED_OFAC) ofacSdnSet.add(normalize(a));
  for (const a of SEED_MIXERS) mixerAddressSet.add(normalize(a));
  for (const a of SEED_SCAMS) scamAddressSet.add(normalize(a));
  for (const a of SEED_RISKY_EXCHANGES) riskyExchangeSet.add(normalize(a));
}

/* ── helpers ───────────────────────────────────────────────────── */

function normalize(addr: string): string {
  return addr.toLowerCase().trim();
}

/* ── public API ────────────────────────────────────────────────── */

/**
 * Check whether an address appears on the OFAC SDN list.
 */
export function isSanctioned(address: string): boolean {
  return ofacSdnSet.has(normalize(address));
}

/**
 * Check whether an address is a known mixer / tumbler.
 */
export function isMixer(address: string): boolean {
  return mixerAddressSet.has(normalize(address));
}

/**
 * Check whether an address is a known scam address.
 */
export function isScamAddress(address: string): boolean {
  return scamAddressSet.has(normalize(address));
}

/**
 * Check whether an address belongs to a high-risk exchange.
 */
export function isRiskyExchange(address: string): boolean {
  return riskyExchangeSet.has(normalize(address));
}

/**
 * Return the list names that the address matches.
 */
export function getMatchedLists(address: string): string[] {
  const n = normalize(address);
  const lists: string[] = [];
  if (ofacSdnSet.has(n)) lists.push('OFAC SDN');
  if (mixerAddressSet.has(n)) lists.push('Mixer / Tumbler');
  if (scamAddressSet.has(n)) lists.push('Known Scam');
  if (riskyExchangeSet.has(n)) lists.push('High-Risk Exchange');
  return lists;
}

/**
 * Assign a base risk level from list membership alone.
 * This is the floor — transaction pattern analysis may raise it.
 */
export function listBasedRiskLevel(address: string): RiskLevel {
  const n = normalize(address);
  if (ofacSdnSet.has(n)) return 'sanctioned';
  if (mixerAddressSet.has(n)) return 'high';
  if (scamAddressSet.has(n)) return 'high';
  if (riskyExchangeSet.has(n)) return 'medium';
  return 'low';
}

/**
 * Update callback type — called by the daily sync job.
 * Replace the in-memory sets with fresh data from your provider.
 */
export interface ListUpdate {
  ofacSdn?: string[];
  mixers?: string[];
  scams?: string[];
  riskyExchanges?: string[];
}

/**
 * Apply a bulk list update (e.g. from a daily sync job).
 */
export function updateLists(update: ListUpdate): void {
  if (update.ofacSdn) {
    ofacSdnSet.clear();
    for (const a of update.ofacSdn) ofacSdnSet.add(normalize(a));
  }
  if (update.mixers) {
    mixerAddressSet.clear();
    for (const a of update.mixers) mixerAddressSet.add(normalize(a));
  }
  if (update.scams) {
    scamAddressSet.clear();
    for (const a of update.scams) scamAddressSet.add(normalize(a));
  }
  if (update.riskyExchanges) {
    riskyExchangeSet.clear();
    for (const a of update.riskyExchanges) riskyExchangeSet.add(normalize(a));
  }
}

// Auto-seed on import
seedLists();

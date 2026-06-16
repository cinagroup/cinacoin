/**
 * Mock implementations for testing and development.
 */

import type {
  VaspRegistry,
  VaspRecord,
  ScreeningProvider,
  ScreeningResult,
  ScreeningProviderName,
} from './types.js';

// ---------------------------------------------------------------------------
// In-Memory VASP Registry
// ---------------------------------------------------------------------------

/** Simple in-memory VASP registry implementation. */
export class InMemoryVaspRegistry implements VaspRegistry {
  private readonly vasps = new Map<string, VaspRecord>();
  private readonly walletToVasp = new Map<string, string>();

  /** Register a VASP. */
  register(vasp: VaspRecord): void {
    this.vasps.set(vasp.id, vasp);
  }

  /** Associate a wallet address with a VASP. */
  registerWallet(address: string, vaspId: string): void {
    this.walletToVasp.set(address.toLowerCase(), vaspId);
  }

  async lookup(id: string): Promise<VaspRecord | null> {
    return this.vasps.get(id) ?? null;
  }

  async lookupByWallet(address: string): Promise<VaspRecord | null> {
    const vaspId = this.walletToVasp.get(address.toLowerCase());
    if (!vaspId) return null;
    return this.vasps.get(vaspId) ?? null;
  }

  async listAll(): Promise<VaspRecord[]> {
    return Array.from(this.vasps.values());
  }

  async isLicensed(id: string): Promise<boolean> {
    const vasp = this.vasps.get(id);
    return vasp?.licensed ?? false;
  }
}

// ---------------------------------------------------------------------------
// Mock Screening Provider
// ---------------------------------------------------------------------------

/** Mock screening provider that returns configurable results. */
export class MockScreeningProvider implements ScreeningProvider {
  private readonly knownRisky = new Set<string>();
  private readonly knownSanctioned = new Set<string>();

  /** Mark an address as risky. */
  flagRisky(address: string): void {
    this.knownRisky.add(address.toLowerCase());
  }

  /** Mark an address as sanctioned. */
  flagSanctioned(address: string): void {
    this.knownSanctioned.add(address.toLowerCase());
  }

  async screenAddress(address: string): Promise<ScreeningResult> {
    const addr = address.toLowerCase();
    const sanctioned = this.knownSanctioned.has(addr);
    const risky = this.knownRisky.has(addr);

    return {
      provider: 'chainalysis',
      riskScore: sanctioned ? 100 : risky ? 65 : 5,
      riskLevel: sanctioned ? 'critical' : risky ? 'high' : 'low',
      sanctioned,
      sanctionsLists: sanctioned ? ['OFAC SDN'] : [],
      illicitActivity: risky,
      illicitCategories: risky ? ['mixer'] : [],
      screenedAt: new Date().toISOString(),
    };
  }

  async screenBatch(addresses: string[]): Promise<ScreeningResult[]> {
    return Promise.all(addresses.map(a => this.screenAddress(a)));
  }

  getProviderName(): ScreeningProviderName {
    return 'chainalysis';
  }
}

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TravelRuleEngine,
  InMemoryVaspRegistry,
  MockScreeningProvider,
  validateTravelRulePayload,
  isValidEvmAddress,
  isValidWalletAddress,
  type TravelRulePayload,
  type VaspRecord,
} from '../src/TravelRule';

describe('TravelRule Validation Helpers', () => {
  it('should validate EVM addresses correctly', () => {
    expect(isValidEvmAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(true);
    expect(isValidEvmAddress('0xinvalid')).toBe(false);
    expect(isValidEvmAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false);
  });

  it('should validate wallet addresses (EVM or Solana)', () => {
    expect(isValidWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(true);
    expect(isValidWalletAddress('7EcDhSYGhXysn68B7pZcJrQk9KvTgQmX')).toBe(true); // Solana
    expect(isValidWalletAddress('invalid')).toBe(false);
  });

  it('should validate complete TravelRule payloads', () => {
    const validPayload: TravelRulePayload = {
      transferId: 'test-transfer-1',
      direction: 'outbound',
      originator: {
        type: 'natural_person',
        naturalPerson: { name: 'Alice Smith' },
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      },
      originatorVasp: 'vasp-alice',
      beneficiary: {
        type: 'natural_person',
        naturalPerson: { name: 'Bob Jones' },
        walletAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
      },
      beneficiaryVasp: 'vasp-bob',
      amount: '1.5',
      asset: 'ETH',
      timestamp: new Date().toISOString(),
    };

    const errors = validateTravelRulePayload(validPayload);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid payloads', () => {
    const invalidPayload = {
      transferId: '',
      direction: 'outbound',
      originator: {
        type: 'natural_person',
        walletAddress: 'invalid-address',
      },
      originatorVasp: 'vasp-1',
      beneficiary: {
        type: 'natural_person',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      },
      beneficiaryVasp: 'vasp-2',
      amount: 'invalid',
      asset: 'ETH',
      timestamp: new Date().toISOString(),
    } as TravelRulePayload;

    const errors = validateTravelRulePayload(invalidPayload);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('TravelRuleEngine', () => {
  let engine: TravelRuleEngine;
  let vaspRegistry: InMemoryVaspRegistry;
  let screeningProvider: MockScreeningProvider;

  beforeEach(() => {
    vaspRegistry = new InMemoryVaspRegistry();
    screeningProvider = new MockScreeningProvider();

    // Register test VASPs
    const vaspAlice: VaspRecord = {
      id: 'vasp-alice',
      name: 'Alice VASP',
      website: 'https://alice.example.com',
      jurisdiction: 'US',
      licensed: true,
    };
    const vaspBob: VaspRecord = {
      id: 'vasp-bob',
      name: 'Bob VASP',
      website: 'https://bob.example.com',
      jurisdiction: 'EU',
      licensed: true,
    };

    vaspRegistry.register(vaspAlice);
    vaspRegistry.register(vaspBob);

    engine = new TravelRuleEngine({
      thresholdUsd: 1000,
      vaspRegistry,
      screeningProvider,
      rejectSanctioned: true,
      requireLicensedVasp: true,
      maxRiskScore: 70,
    });
  });

  it('should approve transfers below threshold', async () => {
    const payload: TravelRulePayload = {
      transferId: 'test-1',
      direction: 'outbound',
      originator: {
        type: 'natural_person',
        naturalPerson: { name: 'Alice' },
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      },
      originatorVasp: 'vasp-alice',
      beneficiary: {
        type: 'natural_person',
        naturalPerson: { name: 'Bob' },
        walletAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
      },
      beneficiaryVasp: 'vasp-bob',
      amount: '0.1', // Below threshold
      asset: 'ETH',
      timestamp: new Date().toISOString(),
    };

    const result = await engine.evaluate(payload);
    expect(result.status).toBe('approved');
    expect(result.aboveThreshold).toBe(false);
  });

  it('should reject sanctioned addresses', async () => {
    screeningProvider.flagSanctioned('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    const payload: TravelRulePayload = {
      transferId: 'test-2',
      direction: 'outbound',
      originator: {
        type: 'natural_person',
        naturalPerson: { name: 'Alice' },
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      },
      originatorVasp: 'vasp-alice',
      beneficiary: {
        type: 'natural_person',
        naturalPerson: { name: 'Bob' },
        walletAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
      },
      beneficiaryVasp: 'vasp-bob',
      amount: '2.0',
      asset: 'ETH',
      timestamp: new Date().toISOString(),
    };

    const result = await engine.evaluate(payload);
    expect(result.status).toBe('rejected');
    expect(result.reason).toContain('sanctions');
  });

  it('should flag high-risk addresses for review', async () => {
    screeningProvider.flagRisky('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    const payload: TravelRulePayload = {
      transferId: 'test-3',
      direction: 'outbound',
      originator: {
        type: 'natural_person',
        naturalPerson: { name: 'Alice' },
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      },
      originatorVasp: 'vasp-alice',
      beneficiary: {
        type: 'natural_person',
        naturalPerson: { name: 'Bob' },
        walletAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
      },
      beneficiaryVasp: 'vasp-bob',
      amount: '1.5',
      asset: 'ETH',
      timestamp: new Date().toISOString(),
    };

    const result = await engine.evaluate(payload);
    expect(result.overallRiskScore).toBeGreaterThan(50);
  });
});

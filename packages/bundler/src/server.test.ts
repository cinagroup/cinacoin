// eslint-disable @typescript-eslint/no-explicit-any
import { describe, it, expect, vi, beforeEach } from 'vitest';

let keccakCounter = 0;

// Mock viem modules before importing server modules
vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem');
  return {
    ...actual,
    createPublicClient: vi.fn().mockReturnValue({
      call: vi.fn().mockResolvedValue({ data: '0x' }),
      getBlock: vi.fn().mockResolvedValue({
        baseFeePerGas: 10_000_000_000n,
      }),
      getFeeHistory: vi.fn().mockResolvedValue({
        reward: [
          [1_000_000_000n, 2_000_000_000n, 5_000_000_000n],
          [1_100_000_000n, 2_100_000_000n, 5_100_000_000n],
        ],
      }),
      readContract: vi.fn().mockResolvedValue({}),
      estimateGas: vi.fn().mockResolvedValue(500_000n),
    }),
    createWalletClient: vi.fn().mockReturnValue({
      sendTransaction: vi.fn().mockResolvedValue('0xtxhash'),
      account: { address: '0xbundler' },
      chain: { id: 1 },
    }),
    http: vi.fn().mockReturnValue({}),
    encodeFunctionData: vi.fn().mockReturnValue('0xencoded'),
    encodeAbiParameters: vi.fn().mockImplementation(() => {
      // Return a unique value each call so different UserOps get different hashes
      return '0x' + Math.random().toString(16).slice(2).padEnd(128, '0').slice(0, 128);
    }),
    privateKeyToAccount: vi.fn().mockReturnValue({ address: '0xbundler' }),
  };
});

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn().mockReturnValue({ address: '0xbundler' }),
}));

import { UserOpPool, PoolError } from './UserOpPool';
import { ReputationTracker } from './ReputationTracker';
import { GasOracle } from './GasOracle';
import { UserOpValidator } from './UserOpValidator';
import type { BundlerServerConfig, RawUserOperation } from './server-types';

// ── Helpers ──────────────────────────────────────────────────────────

function makeMockConfig(): BundlerServerConfig {
  return {
    listen: '0.0.0.0:4337',
    beneficiary: '0xbeneficiary' as unknown,
    entryPoints: ['0xentrypoint' as unknown],
    maxOpsPerBundle: 128,
    bundleIntervalMs: 2000,
    bundleTimeoutMs: 5000,
    minBundleGas: 21_000,
    minProfitMarginBps: 500,
    reputation: {
      throttleThreshold: 5,
      banThreshold: 20,
      throttleDurationSec: 3600,
      banDurationSec: 86400,
      maxPendingPerSender: 16,
    },
    blacklistedSenders: [],
    simulation: {
      enabled: false, // Disable for unit tests
      maxSimulationGas: 30_000_000,
    },
    healthPath: '/health',
    metricsPath: '/metrics',
    metricsEnabled: true,
  };
}

function makeMockUserOp(overrides: Partial<RawUserOperation> = {}): RawUserOperation {
  return {
    sender: '0x1234567890abcdef1234567890abcdef12345678',
    nonce: '0x0',
    initCode: '0x',
    callData: '0x',
    callGasLimit: '0x186a0',       // 100_000
    verificationGasLimit: '0x30d40', // 200_000
    preVerificationGas: '0xc350',    // 50_000
    maxFeePerGas: '0x3b9aca00',      // 1_000_000_000 (1 gwei)
    maxPriorityFeePerGas: '0x3b9aca00',
    paymasterAndData: '0x',
    signature: ('0x' + 'ab'.repeat(65)) as `0x${string}`, // Valid-length signature
    ...overrides,
  };
}

// ── UserOpPool Tests ────────────────────────────────────────────────

describe('UserOpPool', () => {
  let config: BundlerServerConfig;
  let pool: UserOpPool;

  beforeEach(() => {
    config = makeMockConfig();
    pool = new UserOpPool(config);
    keccakCounter = 0; // Reset counter for unique hashes
  });

  it('should add a UserOp and return its hash', async () => {
    const userOp = makeMockUserOp();
    const hash = await pool.add(userOp);
    expect(hash).toBeDefined();
    expect(hash.startsWith('0x')).toBe(true);
    expect(pool.pendingCount()).toBe(1);
  });

  it('should reject duplicate UserOps', async () => {
    const userOp = makeMockUserOp();
    await pool.add(userOp);
    await expect(pool.add(userOp)).rejects.toThrow(PoolError);
  });

  it('should order by priority (highest first)', async () => {
    const lowPrio = makeMockUserOp({
      sender: '0xaaaa',
      maxPriorityFeePerGas: '0x1',
      maxFeePerGas: '0x1',
    });
    const highPrio = makeMockUserOp({
      sender: '0xbbbb',
      maxPriorityFeePerGas: '0x3b9aca00',
      maxFeePerGas: '0x3b9aca00',
    });

    await pool.add(lowPrio);
    await pool.add(highPrio);

    const top = pool.getTop(2);
    expect(top.length).toBe(2);
    // Higher priority fee should come first
    expect(top[0].userOp.sender).toBe('0xbbbb');
  });

  it('should mark submitted and remove from pending', async () => {
    const userOp = makeMockUserOp();
    const hash = await pool.add(userOp);
    expect(pool.pendingCount()).toBe(1);

    pool.markSubmitted([hash], '0xtx');
    expect(pool.pendingCount()).toBe(0);
  });

  it('should reject a UserOp', async () => {
    const userOp = makeMockUserOp();
    const hash = await pool.add(userOp);
    pool.reject(hash, 'AA24: test rejection');
    expect(pool.pendingCount()).toBe(0);
  });

  it('should requeue a submitted UserOp', async () => {
    const userOp = makeMockUserOp();
    const hash = await pool.add(userOp);
    pool.markSubmitted([hash], '0xtx');

    const requeued = pool.requeue(hash);
    expect(requeued).toBeDefined();
    expect(requeued?.retries).toBe(1);
  });

  it('should enforce per-sender rate limit', async () => {
    const limitedConfig: BundlerServerConfig = {
      ...config,
      reputation: { ...config.reputation, maxPendingPerSender: 2 },
    };
    const limitedPool = new UserOpPool(limitedConfig);

    await limitedPool.add(makeMockUserOp({ sender: '0xsender1', nonce: '0x0' }));
    await limitedPool.add(makeMockUserOp({ sender: '0xsender1', nonce: '0x1' }));
    await expect(
      limitedPool.add(makeMockUserOp({ sender: '0xsender1', nonce: '0x2' })),
    ).rejects.toThrow('too many pending ops');
  });

  it('should purge all ops for a sender', async () => {
    await pool.add(makeMockUserOp({ sender: '0xpurge', nonce: '0x0' }));
    await pool.add(makeMockUserOp({ sender: '0xpurge', nonce: '0x1' }));
    await pool.add(makeMockUserOp({ sender: '0xother', nonce: '0x0' }));

    const purged = pool.purgeSender('0xpurge' as unknown);
    expect(purged).toBe(2);
    expect(pool.pendingCount()).toBe(1);
  });
});

// ── ReputationTracker Tests ─────────────────────────────────────────

describe('ReputationTracker', () => {
  let tracker: ReputationTracker;

  beforeEach(() => {
    tracker = new ReputationTracker({
      throttleThreshold: 5,
      banThreshold: 20,
      throttleDurationSec: 3600,
      banDurationSec: 86400,
      maxPendingPerSender: 16,
    });
  });

  it('should start with no reputation data', () => {
    const rep = tracker.getReputation('0xunknown' as unknown);
    expect(rep.score).toBe(0);
    expect(rep.violations).toBe(0);
    expect(rep.throttled).toBe(false);
    expect(rep.banned).toBe(false);
  });

  it('should increase score on success', () => {
    tracker.recordSuccess('0xsender' as unknown);
    tracker.recordSuccess('0xsender' as unknown);
    const rep = tracker.getReputation('0xsender' as unknown);
    expect(rep.successes).toBe(2);
    expect(rep.score).toBe(2);
  });

  it('should decrease score on violation', () => {
    tracker.recordViolation('0xsender' as unknown, 'test violation');
    const rep = tracker.getReputation('0xsender' as unknown);
    expect(rep.violations).toBe(1);
    expect(rep.score).toBe(0); // Math.max(0, 0 - 10)
  });

  it('should throttle after threshold', () => {
    for (let i = 0; i < 5; i++) {
      tracker.recordViolation('0xsender' as unknown);
    }
    tracker.enforce('0xsender' as unknown);
    expect(tracker.isThrottled('0xsender' as unknown)).toBe(true);
  });

  it('should ban after ban threshold', () => {
    for (let i = 0; i < 20; i++) {
      tracker.recordViolation('0xsender' as unknown);
    }
    tracker.enforce('0xsender' as unknown);
    expect(tracker.isBanned('0xsender' as unknown)).toBe(true);
  });

  it('should return lower priority multiplier for bad senders', () => {
    // Good sender
    for (let i = 0; i < 100; i++) {
      tracker.recordSuccess('0xgood' as unknown);
    }
    expect(tracker.priorityMultiplier('0xgood' as unknown)).toBeGreaterThanOrEqual(1.0);

    // Bad sender
    for (let i = 0; i < 5; i++) {
      tracker.recordViolation('0xbad' as unknown);
    }
    tracker.enforce('0xbad' as unknown);
    expect(tracker.priorityMultiplier('0xbad' as unknown)).toBe(0.5);

    // Banned sender
    for (let i = 0; i < 20; i++) {
      tracker.recordViolation('0xbanned' as unknown);
    }
    tracker.enforce('0xbanned' as unknown);
    expect(tracker.priorityMultiplier('0xbanned' as unknown)).toBe(0);
  });
});

// ── GasOracle Tests ─────────────────────────────────────────────────

describe('GasOracle', () => {
  it('should return gas prices with slow/standard/fast tiers', async () => {
    const mod = await import('./BundlerServer');
    const oracle = new GasOracle(mod.KNOWN_CHAINS.sepolia.chain, mod.KNOWN_CHAINS.sepolia.rpcUrl);
    const prices = await oracle.getGasPrices();

    expect(prices.slow.maxFeePerGas).toBeDefined();
    expect(prices.standard.maxFeePerGas).toBeDefined();
    expect(prices.fast.maxFeePerGas).toBeDefined();
    expect(prices.slow.maxPriorityFeePerGas).toBeDefined();

    // Fast should be >= standard >= slow
    expect(prices.fast.maxFeePerGas).toBeGreaterThanOrEqual(prices.standard.maxFeePerGas);
    expect(prices.standard.maxFeePerGas).toBeGreaterThanOrEqual(prices.slow.maxFeePerGas);
  });
});

// ── UserOpValidator Tests ───────────────────────────────────────────

describe('UserOpValidator', () => {
  let validator: UserOpValidator;

  beforeEach(async () => {
    const config = makeMockConfig();
    const mod = await import('./BundlerServer');
    const sepolia = mod.KNOWN_CHAINS.sepolia;
    validator = new UserOpValidator(config, sepolia.chain, sepolia.rpcUrl);
  });

  it('should pass valid UserOp', async () => {
    const userOp = makeMockUserOp();
    const result = await validator.validate(userOp);
    expect(result.valid).toBe(true);
  });

  it('should reject UserOp with empty signature', async () => {
    const userOp = makeMockUserOp({ signature: '0x' });
    const result = await validator.validate(userOp);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty signature');
  });

  it('should reject UserOp with zero maxFeePerGas', async () => {
    const userOp = makeMockUserOp({ maxFeePerGas: '0x0' });
    const result = await validator.validate(userOp);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('maxFeePerGas is zero');
  });

  it('should reject UserOp where priorityFee exceeds maxFee', async () => {
    const userOp = makeMockUserOp({
      maxFeePerGas: '0x1',
      maxPriorityFeePerGas: '0x3b9aca00',
    });
    const result = await validator.validate(userOp);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('maxPriorityFeePerGas exceeds maxFeePerGas');
  });

  it('should reject blacklisted sender', async () => {
    const config = makeMockConfig();
    config.blacklistedSenders = ['0x1234567890abcdef1234567890abcdef12345678' as unknown];
    const mod = await import('./BundlerServer');
    const sepolia = mod.KNOWN_CHAINS.sepolia;
    const validator2 = new UserOpValidator(config, sepolia.chain, sepolia.rpcUrl);

    const userOp = makeMockUserOp();
    const result = await validator2.validate(userOp);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('blacklisted');
  });

  it('should reject excessive verification gas', async () => {
    const userOp = makeMockUserOp({ verificationGasLimit: '0x500000' }); // 5M+
    const result = await validator.validate(userOp);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('too high');
  });

  it('should blacklist and unblacklist addresses', async () => {
    const config = makeMockConfig();
    const mod = await import('./BundlerServer');
    const sepolia = mod.KNOWN_CHAINS.sepolia;
    const validator2 = new UserOpValidator(config, sepolia.chain, sepolia.rpcUrl);

    const addr = '0xdeadbeef' as unknown;
    validator2.blacklist(addr);
    expect(validator2.getBlacklist()).toContain(addr);

    validator2.unblacklist(addr);
    expect(validator2.getBlacklist()).not.toContain(addr);
  });

  it('should reject initCode that is too short', async () => {
    const userOp = makeMockUserOp({ initCode: '0x1234' });
    const result = await validator.validate(userOp);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('initCode');
  });

  it('should reject paymasterAndData that is too short', async () => {
    const userOp = makeMockUserOp({ paymasterAndData: '0x1234' });
    const result = await validator.validate(userOp);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('paymaster');
  });
});

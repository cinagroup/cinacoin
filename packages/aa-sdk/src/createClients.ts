// @cinacoin/aa-sdk — factory functions
import { type Chain, type Hex } from 'viem';
import type { Address } from 'viem';
import { SmartAccount } from './smartAccount.js';
import { SmartAccountFactory } from './factory.js';
import { PaymasterClient } from './paymaster.js';
import { BundlerClient } from './bundler.js';
import type {
  SmartAccountConfig,
  BundlerConfig,
  PaymasterConfig,
  FactoryConfig,
  BatchTransaction,
} from './types.js';
import type { EnhancedBundlerConfig } from './bundler-client.js';

// ─── Smart Account ──────────────────────────────────────────────────────────

/**
 * Create a SmartAccount instance.
 */
export function createSmartAccount(
  config: SmartAccountConfig & {
    privateKey: Hex;
    bundlerConfig?: EnhancedBundlerConfig;
  },
): SmartAccount {
  return new SmartAccount(config);
}

// ─── Bundler Client ─────────────────────────────────────────────────────────

/**
 * Create a BundlerClient instance.
 */
export function createBundlerClient(
  config: BundlerConfig,
): BundlerClient {
  return new BundlerClient(config);
}

// ─── Paymaster Client ───────────────────────────────────────────────────────

/**
 * Create a PaymasterClient instance.
 */
export function createPaymasterClient(
  config: PaymasterConfig,
): PaymasterClient {
  return new PaymasterClient(config);
}

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a SmartAccountFactory instance.
 */
export function createFactory(
  config: FactoryConfig & { rpcUrl: string; chain?: Chain },
): SmartAccountFactory {
  return new SmartAccountFactory(config);
}

// ─── Combined Execution ────────────────────────────────────────────────────

/**
 * Execute a single transaction through the full AA pipeline:
 * build → estimate → sponsor → sign → send
 */
export async function executeUserOperation(params: {
  smartAccount: SmartAccount;
  bundlerClient: BundlerClient;
  entryPoint: Address;
  to: Address;
  value?: bigint;
  data?: Hex;
}): Promise<{ userOpHash: Hex }> {
  const result = await params.smartAccount.execute(
    params.to,
    params.value ?? 0n,
    params.data ?? '0x',
  );

  return { userOpHash: result.userOpHash as Hex };
}

/**
 * Execute batch transactions through the full AA pipeline.
 */
export async function executeBatchUserOperation(params: {
  smartAccount: SmartAccount;
  bundlerClient: BundlerClient;
  entryPoint: Address;
  transactions: BatchTransaction[];
}): Promise<{ userOpHash: Hex }> {
  const result = await params.smartAccount.executeBatch(params.transactions);

  return { userOpHash: result.userOpHash as Hex };
}

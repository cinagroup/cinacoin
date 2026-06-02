// @cinacoin/aa-sdk — factory functions
import { createPublicClient, http, type Chain, type Hex } from 'viem';
import type { Address } from 'viem';
import type { AccountSigner } from './types.js';
import { SmartAccount } from './smartAccount.js';
import { SmartAccountFactory } from './factory.js';
import { PaymasterClient } from './paymaster.js';
import { BundlerClient } from './bundler.js';
import type {
  SmartAccountConfig,
  BundlerConfig,
  PaymasterConfig,
  FactoryConfig,
  UserOperation,
} from './types.js';

// ─── Smart Account ──────────────────────────────────────────────────────────

/**
 * Create a SmartAccount instance.
 */
export function createSmartAccount(
  config: Omit<SmartAccountConfig, 'rpcUrl' | 'chainId' | 'entryPoint'> & {
    rpcUrl: string;
    chainId: number;
    entryPoint: Address;
  },
): SmartAccount {
  return SmartAccount.fromConfig(config);
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
  config: FactoryConfig,
): SmartAccountFactory {
  return SmartAccountFactory.fromConfig(config);
}

// ─── Combined Execution ────────────────────────────────────────────────────

/**
 * Execute a single transaction through the full AA pipeline:
 * build → estimate → sponsor → sign → send
 */
export async function executeUserOperation(params: {
  smartAccount: SmartAccount;
  bundlerClient: BundlerClient;
  paymasterClient?: PaymasterClient;
  entryPoint: Address;
  to: Address;
  value?: bigint;
  data?: Hex;
}): Promise<{ userOpHash: Hex }> {
  // 1. Build UserOp
  const userOp = await params.smartAccount.buildUserOperation({
    to: params.to,
    value: params.value,
    data: params.data,
  });

  // 2. Estimate gas (via bundler if available)
  try {
    const estimate = await params.bundlerClient.estimateUserOperationGas(
      userOp,
      params.entryPoint,
    );
    Object.assign(userOp, {
      callGasLimit: estimate.callGasLimit,
      verificationGasLimit: estimate.verificationGasLimit,
      preVerificationGas: estimate.preVerificationGas,
      maxFeePerGas: estimate.maxFeePerGas,
      maxPriorityFeePerGas: estimate.maxPriorityFeePerGas,
    });
  } catch {
    // Use defaults
  }

  // 3. Sponsor via paymaster
  if (params.paymasterClient) {
    try {
      const sponsored = await params.paymasterClient.getPaymasterData(
        userOp,
        params.entryPoint,
        params.smartAccount.config.chainId,
      );
      userOp.paymasterAndData = sponsored.paymasterAndData;
    } catch {
      // No sponsorship available
    }
  }

  // 4. Sign
  const signedUserOp = await params.smartAccount.signUserOperation(userOp);

  // 5. Send
  const result = await params.bundlerClient.sendUserOperation(
    signedUserOp,
    params.entryPoint,
  );

  return { userOpHash: result.userOpHash };
}

/**
 * Execute batch transactions through the full AA pipeline.
 */
export async function executeBatchUserOperation(params: {
  smartAccount: SmartAccount;
  bundlerClient: BundlerClient;
  paymasterClient?: PaymasterClient;
  entryPoint: Address;
  transactions: Array<{ to: Address; value: bigint; data: Hex }>;
}): Promise<{ userOpHash: Hex }> {
  const userOp = await params.smartAccount.buildBatchUserOperation({
    transactions: params.transactions,
  });

  // Estimate gas
  try {
    const estimate = await params.bundlerClient.estimateUserOperationGas(
      userOp,
      params.entryPoint,
    );
    Object.assign(userOp, {
      callGasLimit: estimate.callGasLimit,
      verificationGasLimit: estimate.verificationGasLimit,
      preVerificationGas: estimate.preVerificationGas,
      maxFeePerGas: estimate.maxFeePerGas,
      maxPriorityFeePerGas: estimate.maxPriorityFeePerGas,
    });
  } catch {
    // Use defaults
  }

  // Sponsor
  if (params.paymasterClient) {
    try {
      const sponsored = await params.paymasterClient.getPaymasterData(
        userOp,
        params.entryPoint,
        params.smartAccount.config.chainId,
      );
      userOp.paymasterAndData = sponsored.paymasterAndData;
    } catch {
      // No sponsorship
    }
  }

  // Sign
  const signedUserOp = await params.smartAccount.signUserOperation(userOp);

  // Send
  const result = await params.bundlerClient.sendUserOperation(
    signedUserOp,
    params.entryPoint,
  );

  return { userOpHash: result.userOpHash };
}

import type { Address, Hash, PublicClient, WalletClient, Hex } from 'viem';
import { encodeFunctionData } from 'viem';
import type { PendingUserOp, Bundle, BundleResult, BundlerServerConfig } from './server-types';

// EntryPoint v0.6 handleOps ABI
const HANDLE_OPS_ABI = [
  {
    type: 'function',
    name: 'handleOps',
    inputs: [
      {
        name: 'ops',
        type: 'tuple[]',
        components: [
          { name: 'sender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'initCode', type: 'bytes' },
          { name: 'callData', type: 'bytes' },
          { name: 'callGasLimit', type: 'uint256' },
          { name: 'verificationGasLimit', type: 'uint256' },
          { name: 'preVerificationGas', type: 'uint256' },
          { name: 'maxFeePerGas', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', type: 'uint256' },
          { name: 'paymasterAndData', type: 'bytes' },
          { name: 'signature', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', type: 'address' },
    ],
    outputs: [],
  },
] as const;

/**
 * BundleBuilder — selects optimal UserOps from the pool,
 * constructs handleOps calldata, and submits the bundle.
 */
export class BundleBuilder {
  private config: BundlerServerConfig;
  private entryPoint: Address;
  private beneficiary: Address;

  constructor(config: BundlerServerConfig, entryPoint: Address, beneficiary: Address) {
    this.config = config;
    this.entryPoint = entryPoint;
    this.beneficiary = beneficiary;
  }

  /**
   * Build a bundle from the given pending UserOps.
   * Selects up to maxOpsPerBundle and estimates total gas.
   */
  buildBundle(pendingOps: PendingUserOp[]): Bundle {
    const selected = pendingOps.slice(0, this.config.maxOpsPerBundle);

    // Estimate total gas: sum of all callGasLimit + verificationGasLimit + overhead
    let estimatedGas = 0n;
    for (const op of selected) {
      estimatedGas += BigInt(op.userOp.callGasLimit);
      estimatedGas += BigInt(op.userOp.verificationGasLimit);
    }
    // Add overhead for the bundle transaction itself
    estimatedGas += BigInt(150_000); // Fixed overhead for handleOps call

    return {
      userOps: selected,
      beneficiary: this.beneficiary,
      estimatedGas,
      createdAt: Date.now(),
    };
  }

  /**
   * Encode the handleOps calldata for the bundle.
   */
  encodeHandleOps(bundle: Bundle): Hex {
    const ops = bundle.userOps.map(entry => ({
      sender: entry.userOp.sender,
      nonce: BigInt(entry.userOp.nonce),
      initCode: entry.userOp.initCode as Hex,
      callData: entry.userOp.callData as Hex,
      callGasLimit: BigInt(entry.userOp.callGasLimit),
      verificationGasLimit: BigInt(entry.userOp.verificationGasLimit),
      preVerificationGas: BigInt(entry.userOp.preVerificationGas),
      maxFeePerGas: BigInt(entry.userOp.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(entry.userOp.maxPriorityFeePerGas),
      paymasterAndData: entry.userOp.paymasterAndData as Hex,
      signature: entry.userOp.signature as Hex,
    }));

    return encodeFunctionData({
      abi: HANDLE_OPS_ABI,
      functionName: 'handleOps',
      args: [ops, bundle.beneficiary],
    });
  }

  /**
   * Submit the bundle to the EntryPoint contract.
   * Returns the transaction hash on success.
   */
  async submit(
    bundle: Bundle,
    walletClient: WalletClient,
    publicClient: PublicClient,
  ): Promise<BundleResult> {
    const data = this.encodeHandleOps(bundle);

    try {
      // Use the first gas price from the pool's userOps (they should all be similar)
      const maxFeePerGas = bundle.userOps.length > 0
        ? BigInt(bundle.userOps[0].userOp.maxFeePerGas)
        : undefined;
      const maxPriorityFeePerGas = bundle.userOps.length > 0
        ? BigInt(bundle.userOps[0].userOp.maxPriorityFeePerGas)
        : undefined;

      const txHash = await walletClient.sendTransaction({
        chain: walletClient.chain,
        to: this.entryPoint,
        data,
        gas: bundle.estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        account: walletClient.account!,
      });

      // Wait for receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      const hashes = bundle.userOps.map(e => e.hash);

      if (receipt.status === 'success') {
        return {
          success: true,
          txHash,
          count: bundle.userOps.length,
          gasUsed: receipt.gasUsed,
        };
      } else {
        return {
          success: false,
          txHash,
          count: bundle.userOps.length,
          gasUsed: receipt.gasUsed,
          error: 'Bundle transaction reverted on-chain',
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        count: bundle.userOps.length,
        error: `Bundle submission failed: ${message}`,
      };
    }
  }

  /**
   * Estimate the gas required for a bundle without submitting.
   */
  async estimateBundleGas(
    bundle: Bundle,
    publicClient: PublicClient,
  ): Promise<bigint> {
    const data = this.encodeHandleOps(bundle);

    try {
      const gas = await publicClient.estimateGas({
        to: this.entryPoint,
        data,
        account: bundle.beneficiary,
      });
      return gas;
    } catch {
      // Fallback to our pre-computed estimate
      return bundle.estimatedGas;
    }
  }
}

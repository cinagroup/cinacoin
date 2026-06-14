/**
 * Gas estimation utilities for the bundler.
 */

export interface GasOverrides {
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

/**
 * Calculate the required prefund for a UserOperation.
 */
export function calcRequiredPrefund(
  callGasLimit: bigint,
  verificationGasLimit: bigint,
  preVerificationGas: bigint,
  maxFeePerGas: bigint
): bigint {
  const mul = verificationGasLimit * 3n + callGasLimit;
  return mul * maxFeePerGas + preVerificationGas * maxFeePerGas;
}

/**
 * Get recommended gas prices from the network.
 */
export async function getGasPrices(
  rpcUrl: string
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_gasPrice',
        params: [],
      }),
    });

    const json = await response.json() as { result?: string };
    const gasPrice = BigInt(json.result || '0x0');

    return {
      maxFeePerGas: gasPrice * 2n, // 2x for safety
      maxPriorityFeePerGas: gasPrice / 10n, // 10% tip
    };
  } catch {
    // Fallback defaults
    return {
      maxFeePerGas: 30_000_000_000n, // 30 gwei
      maxPriorityFeePerGas: 1_500_000_000n, // 1.5 gwei
    };
  }
}

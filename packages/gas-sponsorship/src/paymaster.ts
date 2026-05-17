import type { Address, Hex, PublicClient, UserOperation } from "viem";
import type { PaymasterProvider } from "./types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Detect paymaster provider from URL.
 */
export function detectProvider(url: string): PaymasterProvider {
  const lower = url.toLowerCase();
  if (lower.includes("pimlico")) return "pimlico";
  if (lower.includes("alchemy")) return "alchemy";
  if (lower.includes("candle")) return "candle";
  // Default to pimlico-compatible RPC shape
  return "pimlico";
}

/**
 * Build a JSON-RPC request body.
 */
function rpcBody(method: string, params: unknown[]): string {
  return JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
}

/**
 * POST JSON to the paymaster URL and return the parsed result.
 */
async function rpcCall<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rpcBody(method, params),
  });
  if (!res.ok) {
    throw new Error(`Paymaster RPC ${method} failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Paymaster RPC ${method} error: ${JSON.stringify(json.error)}`);
  }
  return json.result as T;
}

// ---------------------------------------------------------------------------
// Provider-specific implementations
// ---------------------------------------------------------------------------

/**
 * Fetch paymaster data via Pimlico's `pm_getPaymasterStubData`.
 */
async function pimlicoGetPaymasterData(
  url: string,
  userOperation: UserOperation,
  chainId: number,
): Promise<{ paymasterAndData: Hex; isFinal: boolean }> {
  const result = await rpcCall<{
    paymasterAndData: Hex;
    isFinal: boolean;
  }>(url, "pm_getPaymasterStubData", [
    {
      sender: userOperation.sender,
      nonce: userOperation.nonce.toString(),
      initCode: userOperation.initCode ?? "0x",
      callData: userOperation.callData,
      callGasLimit: userOperation.callGasLimit.toString(),
      verificationGasLimit: userOperation.verificationGasLimit.toString(),
      preVerificationGas: userOperation.preVerificationGas.toString(),
      maxFeePerGas: userOperation.maxFeePerGas.toString(),
      maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas.toString(),
      paymasterAndData: userOperation.paymasterAndData ?? "0x",
    },
    chainId,
  ]);
  return {
    paymasterAndData: result.paymasterAndData,
    isFinal: result.isFinal ?? false,
  };
}

/**
 * Fetch paymaster data via Alchemy's `alchemy_requestGasAndPaymasterAndData`.
 */
async function alchemyGetPaymasterData(
  url: string,
  userOperation: UserOperation,
  chainId: number,
): Promise<{ paymasterAndData: Hex; isFinal: boolean }> {
  const result = await rpcCall<{
    paymasterAndData: Hex;
  }>(url, "alchemy_requestGasAndPaymasterAndData", [
    {
      policyId: "default",
      entryPointAddress: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
      userOp: {
        sender: userOperation.sender,
        nonce: userOperation.nonce.toString(),
        callData: userOperation.callData,
      },
    },
    chainId,
  ]);
  return {
    paymasterAndData: result.paymasterAndData,
    isFinal: true,
  };
}

/**
 * Fetch paymaster data via Candle.
 */
async function candleGetPaymasterData(
  url: string,
  userOperation: UserOperation,
  chainId: number,
): Promise<{ paymasterAndData: Hex; isFinal: boolean }> {
  // Candle uses the same Pimlico-compatible interface
  return pimlicoGetPaymasterData(url, userOperation, chainId);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch paymaster data for a user operation, routing to the correct provider.
 *
 * @param userOperation - Partial user operation to sponsor.
 * @param paymasterUrl - Paymaster RPC endpoint URL.
 * @param chainId - Target chain ID.
 * @returns `{ paymasterAndData, isFinal }` with paymaster-signed data.
 */
export async function getPaymasterData(
  userOperation: UserOperation,
  paymasterUrl: string,
  chainId: number,
): Promise<{ paymasterAndData: Hex; isFinal: boolean }> {
  const provider = detectProvider(paymasterUrl);
  switch (provider) {
    case "pimlico":
      return pimlicoGetPaymasterData(paymasterUrl, userOperation, chainId);
    case "alchemy":
      return alchemyGetPaymasterData(paymasterUrl, userOperation, chainId);
    case "candle":
      return candleGetPaymasterData(paymasterUrl, userOperation, chainId);
    default:
      throw new Error(`Unsupported paymaster provider: ${provider}`);
  }
}

/**
 * Fetch full sponsorship data (paymasterAndData) for a user operation.
 *
 * This is the complete call that attaches the paymaster signature and
 * gas limits so the bundler can include the operation on-chain.
 *
 * @param userOperation - Partial user operation to sponsor.
 * @param paymasterUrl - Paymaster RPC endpoint URL.
 * @param chainId - Target chain ID.
 * @returns `paymasterAndData` hex string to attach to the user operation.
 */
export async function getPaymasterAndData(
  userOperation: UserOperation,
  paymasterUrl: string,
  chainId: number,
): Promise<Hex> {
  const { paymasterAndData } = await getPaymasterData(
    userOperation,
    paymasterUrl,
    chainId,
  );
  return paymasterAndData;
}

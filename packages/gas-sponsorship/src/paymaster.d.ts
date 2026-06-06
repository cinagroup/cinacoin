import type { Hex, UserOperation } from "viem";
import type { PaymasterProvider } from "./types";
/**
 * Detect paymaster provider from URL.
 */
export declare function detectProvider(url: string): PaymasterProvider;
/**
 * Fetch paymaster data for a user operation, routing to the correct provider.
 *
 * @param userOperation - Partial user operation to sponsor.
 * @param paymasterUrl - Paymaster RPC endpoint URL.
 * @param chainId - Target chain ID.
 * @returns `{ paymasterAndData, isFinal }` with paymaster-signed data.
 */
export declare function getPaymasterData(userOperation: UserOperation, paymasterUrl: string, chainId: number): Promise<{
    paymasterAndData: Hex;
    isFinal: boolean;
}>;
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
export declare function getPaymasterAndData(userOperation: UserOperation, paymasterUrl: string, chainId: number): Promise<Hex>;
//# sourceMappingURL=paymaster.d.ts.map
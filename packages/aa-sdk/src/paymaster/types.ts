/**
 * Paymaster type definitions
 */

import type { Hex, Address } from 'viem';

export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
}

export interface PaymasterConfig {
  url: string;
  apiKey?: string;
  sponsorType: 'gasless' | 'partial' | 'post-pay';
}

export interface PaymasterRequest {
  userOperation: UserOperation;
  entryPoint: Address;
  chainId: number;
}

export interface PaymasterResponse {
  paymasterAndData: Hex;
  preVerificationGas?: bigint;
  verificationGasLimit?: bigint;
  callGasLimit?: bigint;
}

export interface GasWindowEntry {
  used: bigint;
  windowStart: number;
}

export interface PaymasterDepositInfo {
  balance: bigint;
  sufficient: boolean;
  minRequired: bigint;
}

export interface SponsorshipEstimate {
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
  totalGas: bigint;
  estimatedCostWei: bigint;
  estimatedCostNative: bigint;
}

export interface PmRouterEntry {
  id: string;
  client: any; // Will be typed as PaymasterClient after circular dependency resolution
  chains: number[];
  priority: number;
  active: boolean;
}

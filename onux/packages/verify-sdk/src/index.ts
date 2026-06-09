/**
 * @module @cinacoin/verify-sdk
 *
 * Contract safety scoring and phishing detection SDK.
 *
 * Usage:
 * ```ts
 * import { VerifySDK } from '@cinacoin/verify-sdk';
 *
 * const sdk = new VerifySDK();
 * const report = await sdk.verifyContract('0x...', 1);
 * console.log(sdk.getRiskSummary(report));
 * ```
 */

export { VerifySDK } from './sdk';
export { ContractScanner } from './scanner';
export { DomainVerifier } from './domain-verify';
export { KnownDAppRegistry } from './registry';
export type {
  VerifyReport,
  DomainVerifyReport,
  VerifyOptions,
  RiskLevel,
  VerifyFlag,
  ScanProgressEvent,
  BatchScanResult,
  KnownDAppEntry,
  DAppCategory,
  DAppSearchFilters,
  ExplorerSource,
} from './types';

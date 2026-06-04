/**
 * @module sdk
 * VerifySDK — main entry point for contract safety scanning and domain verification.
 */

import EventEmitter from 'eventemitter3';
import { ContractScanner } from './scanner';
import { DomainVerifier } from './domain-verify';
import { KnownDAppRegistry } from './registry';
import type {
  VerifyReport,
  DomainVerifyReport,
  VerifyOptions,
  ScanProgressEvent,
  BatchScanResult,
} from './types';
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
  DomainVerifyReport as DomainReport,
} from './types';

// ─── VerifySDK ──────────────────────────────────────────────────────────────────

export class VerifySDK extends EventEmitter<{
  progress: [ScanProgressEvent];
}> {
  private scanner: ContractScanner;
  private domainVerifier: DomainVerifier;
  private options: Required<Pick<VerifyOptions, 'safeThreshold'>>;

  constructor(options?: VerifyOptions) {
    super();
    this.scanner = new ContractScanner(options);
    this.domainVerifier = new DomainVerifier();
    this.options = {
      safeThreshold: options?.safeThreshold ?? 25,
    };

    // Forward scanner progress events
    this.scanner.on('progress', (event: ScanProgressEvent) => {
      this.emit('progress', event);
    });
  }

  /**
   * Verify a single contract.
   *
   * @param address Contract address (0x-prefixed)
   * @param chainId EIP-155 chain ID
   * @returns VerifyReport with risk score and flags
   */
  async verifyContract(address: string, chainId: number): Promise<VerifyReport> {
    return this.scanner.scanContract(address, chainId);
  }

  /**
   * Verify a domain for phishing risk and known dApp status.
   *
   * @param domain Domain name (with or without protocol)
   * @returns DomainVerifyReport
   */
  async verifyDomain(domain: string): Promise<DomainVerifyReport> {
    return this.domainVerifier.checkDomain(domain);
  }

  /**
   * Batch verify multiple contracts in parallel.
   *
   * @param contracts Array of { address, chainId }
   * @returns BatchScanResult with all reports
   */
  async batchVerify(
    contracts: { address: string; chainId: number }[]
  ): Promise<BatchScanResult> {
    const maxConcurrency = this.scanner['options'].maxConcurrency;
    const reports: Record<string, VerifyReport> = {};
    const errors: Record<string, string> = {};
    const startTime = Date.now();

    // Process in chunks
    for (let i = 0; i < contracts.length; i += maxConcurrency) {
      const chunk = contracts.slice(i, i + maxConcurrency);
      const results = await Promise.allSettled(
        chunk.map(async ({ address, chainId }) => {
          const report = await this.scanner.scanContract(address, chainId);
          return { address, report };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          reports[result.value.address.toLowerCase()] = result.value.report;
          this.emit('progress', {
            total: contracts.length,
            completed: Object.keys(reports).length + Object.keys(errors).length,
            current: result.value.address,
            lastReport: result.value.report,
          });
        } else {
          // Find which contract this error corresponds to
          const idx = results.indexOf(result);
          const contract = chunk[idx];
          errors[contract.address.toLowerCase()] =
            result.reason?.message ?? String(result.reason);
        }
      }
    }

    return {
      reports,
      durationMs: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Get a human-readable risk summary for a report.
   */
  static getRiskSummary(report: VerifyReport): string {
    const lines: string[] = [];

    // Header
    const levelEmoji: Record<string, string> = {
      safe: '✅',
      warning: '⚠️',
      danger: '🚨',
      critical: '🔴',
    };

    lines.push(
      `${levelEmoji[report.riskLevel] ?? '❓'} ${report.contractAddress} — Risk: ${report.riskScore}/100 (${report.riskLevel.toUpperCase()})`
    );

    // Verification status
    if (report.isVerified) {
      lines.push('  ✅ Officially verified project');
    } else {
      lines.push('  ❌ Not in verified registry');
    }

    // Metadata
    if (report.metadata.name) {
      lines.push(`  Name: ${report.metadata.name}`);
    }
    if (report.metadata.website) {
      lines.push(`  Website: ${report.metadata.website}`);
    }
    if (report.metadata.audit) {
      lines.push(`  Audit: ${report.metadata.audit}`);
    }

    // Flags
    if (report.flags.length > 0) {
      lines.push(`  ⚑ Flags (${report.flags.length}): ${report.flags.join(', ')}`);
    } else {
      lines.push('  No risk flags detected');
    }

    return lines.join('\n');
  }

  /**
   * Quick boolean safety check.
   *
   * @param report VerifyReport to evaluate
   * @returns true if risk score is below the safe threshold
   */
  isSafe(report: VerifyReport): boolean {
    return report.riskScore <= this.options.safeThreshold;
  }

  /**
   * Get the underlying scanner (for advanced usage).
   */
  getScanner(): ContractScanner {
    return this.scanner;
  }

  /**
   * Get the underlying domain verifier.
   */
  getDomainVerifier(): DomainVerifier {
    return this.domainVerifier;
  }

  /**
   * Access the known dApp registry.
   */
  static getRegistry(): typeof KnownDAppRegistry {
    return KnownDAppRegistry;
  }

  /**
   * Clear all cached scan results.
   */
  clearCache(): void {
    this.scanner.clearCache();
  }
}

// ─── Convenience exports ─────────────────────────────────────────────────────────

export { ContractScanner } from './scanner';
export { DomainVerifier } from './domain-verify';
export { KnownDAppRegistry } from './registry';

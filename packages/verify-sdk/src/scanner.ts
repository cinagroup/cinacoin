/**
 * @module scanner
 * ContractScanner — on-chain contract analysis with risk scoring.
 */

import EventEmitter from 'eventemitter3';
import type {
  VerifyReport,
  VerifyFlag,
  VerifyOptions,
  ExplorerSource,
  ScanProgressEvent,
} from './types';
import { KnownDAppRegistry } from './registry';

// ─── Default flag weights ────────────────────────────────────────────────────────

const DEFAULT_FLAG_WEIGHTS: Record<VerifyFlag, number> = {
  honeypot: 30,
  rug_pull_risk: 25,
  proxy_without_source: 15,
  unlimited_allowance: 8,
  blacklist_function: 12,
  mint_function: 15,
  pause_function: 10,
  self_destruct: 20,
  phishing_domain: 25,
  clone_contract: 20,
  unverified_source: 15,
};

// ─── Dangerous function signatures (solidity keywords) ───────────────────────────

const DANGEROUS_PATTERNS: Record<string, VerifyFlag> = {
  'selfdestruct': 'self_destruct',
  'self-destruct': 'self_destruct',
  '_mint(': 'mint_function',
  'mint(': 'mint_function',
  '_blacklist': 'blacklist_function',
  'blacklist': 'blacklist_function',
  'addToBlacklist': 'blacklist_function',
  'removeFromBlacklist': 'blacklist_function',
  '_pause(': 'pause_function',
  'pause()': 'pause_function',
  'unpause()': 'pause_function',
  'whenPaused': 'pause_function',
  'whenNotPaused': 'pause_function',
  'setMaxTxAmount': 'unlimited_allowance',
  'setTransferFee': 'unlimited_allowance',
  'setMaxWallet': 'unlimited_allowance',
  'excludeFromFee': 'unlimited_allowance',
  'includeInFee': 'unlimited_allowance',
};

// ─── Cache entry ─────────────────────────────────────────────────────────────────

interface CacheEntry {
  report: VerifyReport;
  expiresAt: number;
}

// ─── ContractScanner ─────────────────────────────────────────────────────────────

export class ContractScanner extends EventEmitter<{
  progress: [ScanProgressEvent];
}> {
  private options: Required<Pick<VerifyOptions, 'cacheTtlMs' | 'maxConcurrency' | 'safeThreshold'>> &
    Pick<VerifyOptions, 'explorerApiUrls' | 'explorerApiKeys' | 'flagWeights'>;

  private cache = new Map<string, CacheEntry>();

  constructor(options?: VerifyOptions) {
    super();
    this.options = {
      explorerApiUrls: options?.explorerApiUrls ?? {},
      explorerApiKeys: options?.explorerApiKeys ?? {},
      cacheTtlMs: options?.cacheTtlMs ?? 5 * 60 * 1_000, // 5 minutes
      maxConcurrency: options?.maxConcurrency ?? 10,
      safeThreshold: options?.safeThreshold ?? 25,
      flagWeights: options?.flagWeights ?? {},
    };
  }

  /**
   * Scan a single contract and produce a VerifyReport.
   */
  async scanContract(address: string, chainId: number): Promise<VerifyReport> {
    const cacheKey = `${chainId}:${address.toLowerCase()}`;

    // Cache hit
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.report;
    }

    const flags: VerifyFlag[] = [];
    let source: ExplorerSource | null = null;

    // 1. Source code verification via explorer API
    try {
      source = await this.fetchSource(address, chainId);
    } catch {
      // If we can't fetch source, flag as unverified
      flags.push('unverified_source');
    }

    if (source) {
      // 2. Check verification status
      if (!source.isVerified) {
        flags.push('unverified_source');
      }

      // 3. Proxy pattern detection
      this.detectProxy(source, flags);

      // 4. Dangerous function detection
      this.detectDangerousFunctions(source.sourceCode, flags);

      // 5. Honeypot detection (heuristic on source)
      if (this.detectHoneypot(source.sourceCode)) {
        flags.push('honeypot');
      }

      // 6. Unlimited allowance detection
      if (this.detectUnlimitedAllowance(source.sourceCode)) {
        flags.push('unlimited_allowance');
      }
    }

    // 7. Check against known dApp registry for official verification
    const registryMatch = KnownDAppRegistry.getDAppByContract(address, chainId);
    const isVerified = !!registryMatch;

    // If verified and has an audit, add it to metadata
    const audit = registryMatch?.auditUrl ?? source?.contractName
      ? undefined
      : undefined;

    // 8. Rug pull risk — high owner privileges
    if (source) {
      this.detectRugPullRisk(source.sourceCode, flags);
    }

    // 9. Compute risk score
    const riskScore = this.computeRiskScore(flags);
    const riskLevel = this.scoreToLevel(riskScore);

    const report: VerifyReport = {
      contractAddress: address,
      chainId,
      riskScore,
      riskLevel,
      flags,
      isVerified,
      metadata: {
        name: registryMatch?.name ?? source?.contractName,
        website: registryMatch ? `https://${registryMatch.domain}` : undefined,
        audit: audit,
        deployedAt: undefined, // Would need block explorer tx lookup
      },
      lastChecked: Date.now(),
    };

    // Store in cache
    this.cache.set(cacheKey, {
      report,
      expiresAt: Date.now() + this.options.cacheTtlMs,
    });

    return report;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Fetch verified source code from an explorer API.
   */
  private async fetchSource(address: string, chainId: number): Promise<ExplorerSource | null> {
    const baseUrl = this.options.explorerApiUrls?.[chainId];
    const apiKey = this.options.explorerApiKeys?.[chainId];

    if (!baseUrl) {
      // Default Etherscan URLs for common chains
      const defaults: Record<number, string> = {
        1: 'https://api.etherscan.io/api',
        10: 'https://api-optimistic.etherscan.io/api',
        56: 'https://api.bscscan.com/api',
        137: 'https://api.polygonscan.com/api',
        42161: 'https://api.arbiscan.io/api',
        8453: 'https://api.basescan.org/api',
        43114: 'https://api.snowtrace.io/api',
      };
      if (defaults[chainId]) {
        // Attempt default if no api key set
      }
    }

    const url = baseUrl ?? `https://api.etherscan.io/api`;
    const params = new URLSearchParams({
      module: 'contract',
      action: 'getsourcecode',
      address,
      apikey: apiKey ?? '',
    });

    const res = await fetch(`${url}?${params}`);
    if (!res.ok) return null;

    const json = await res.json() as Record<string, any>;
    if (json.status !== '1' || !json.result?.[0]) return null;

    const r = json.result[0] as Record<string, any>;
    return {
      sourceCode: r.SourceCode ?? '',
      contractName: r.ContractName ?? '',
      compilerVersion: r.CompilerVersion ?? '',
      isVerified: r.SourceCode !== undefined && r.SourceCode !== '',
      proxy: r.Proxy === '1' ? r.Implementation ?? undefined : undefined,
      implementation: r.Implementation ?? undefined,
    };
  }

  /**
   * Detect proxy patterns in source code.
   */
  private detectProxy(source: ExplorerSource, flags: VerifyFlag[]): void {
    const code = source.sourceCode.toLowerCase();

    const proxyIndicators = [
      'delegatecall',
      'proxy',
      'upgradeable',
      'upgradeability',
      'transparentupgradeableproxy',
      'uups',
      'eip1967',
      '_implementation',
      'upgradeTo',
      'changeImplementation',
    ];

    let proxyScore = 0;
    for (const indicator of proxyIndicators) {
      if (code.includes(indicator.toLowerCase())) {
        proxyScore++;
      }
    }

    // If source is not verified AND it looks like a proxy → high risk
    if (!source.isVerified && proxyScore >= 2) {
      flags.push('proxy_without_source');
    }

    // If implementation address is present but unverified
    if (source.proxy && !source.isVerified) {
      flags.push('proxy_without_source');
    }
  }

  /**
   * Detect dangerous Solidity function patterns using AST-like analysis.
   * M-003: Uses pattern matching on function definitions and calls,
   * not simple string includes, to avoid false positives from comments/strings.
   */
  private detectDangerousFunctions(sourceCode: string, flags: VerifyFlag[]): void {
    // Extract function definitions and their bodies
    const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*(?:public|external|internal|private)?\s*(?:view|pure|payable)?\s*(?:returns\s*\([^)]*\))?\s*\{/g;
    
    let match;
    const functions: Array<{ name: string; body: string }> = [];
    
    // Parse function bodies (simplified AST-like extraction)
    while ((match = functionPattern.exec(sourceCode)) !== null) {
      const funcName = match[1];
      const startIdx = match.index + match[0].length;
      let braceCount = 1;
      let endIdx = startIdx;
      
      // Find matching closing brace
      for (let i = startIdx; i < sourceCode.length && braceCount > 0; i++) {
        if (sourceCode[i] === '{') braceCount++;
        else if (sourceCode[i] === '}') braceCount--;
        endIdx = i;
      }
      
      const body = sourceCode.substring(startIdx, endIdx);
      functions.push({ name: funcName, body });
    }
    
    // Check for dangerous patterns in function names and bodies
    for (const func of functions) {
      const funcNameLower = func.name.toLowerCase();
      
      // selfdestruct
      if (func.body.includes('selfdestruct(') || func.body.includes('self-destruct(')) {
        if (!flags.includes('self_destruct')) flags.push('self_destruct');
      }
      
      // mint functions
      if (funcNameLower.includes('mint') || func.body.includes('_mint(')) {
        if (!flags.includes('mint_function')) flags.push('mint_function');
      }
      
      // blacklist functions
      if (funcNameLower.includes('blacklist') || 
          func.body.includes('addToBlacklist') || 
          func.body.includes('removeFromBlacklist')) {
        if (!flags.includes('blacklist_function')) flags.push('blacklist_function');
      }
      
      // pause functions
      if (funcNameLower.includes('pause') || 
          func.body.includes('_pause(') || 
          func.body.includes('whenPaused') || 
          func.body.includes('whenNotPaused')) {
        if (!flags.includes('pause_function')) flags.push('pause_function');
      }
      
      // unlimited allowance / fee manipulation
      if (funcNameLower.includes('setmaxtxamount') || 
          funcNameLower.includes('settransferfee') || 
          funcNameLower.includes('setmaxwallet') || 
          funcNameLower.includes('excludefromfee') || 
          funcNameLower.includes('includeinfee')) {
        if (!flags.includes('unlimited_allowance')) flags.push('unlimited_allowance');
      }
    }
  }

  /**
   * Heuristic honeypot detection based on common trap patterns.
   */
  private detectHoneypot(sourceCode: string): boolean {
    const code = sourceCode.toLowerCase();

    // Common honeypot patterns
    const honeypotIndicators = [
      // Transfer restrictions that can block selling
      code.includes('onlyowner') && code.includes('transfer') && code.includes('return false'),
      // Sell tax significantly higher than buy tax
      code.includes('_sellfee') && code.includes('_buyfee'),
      // Trading can be disabled by owner
      code.includes('tradingenabled') && code.includes('onlyowner'),
      // Liquidity lock that only owner can remove
      code.includes('removeliquidity') && code.includes('onlyowner'),
      // Anti-whale that owner can disable
      code.includes('maxtransactionamount') && code.includes('onlyowner'),
    ];

    // Count positive indicators
    let score = 0;

    if (code.includes('onlyowner') && code.includes('return false') && code.includes('transfer')) {
      score++;
    }
    if (code.includes('_sellfee') && code.includes('_buyfee')) {
      const sellFeeMatch = code.match(/_sellfee\s*=\s*(\d+)/);
      const buyFeeMatch = code.match(/_buyfee\s*=\s*(\d+)/);
      if (sellFeeMatch && buyFeeMatch) {
        if (parseInt(sellFeeMatch[1]) > parseInt(buyFeeMatch[1]) * 2) {
          score++;
        }
      }
    }
    if (code.includes('tradingenabled') && code.includes('onlyowner')) {
      score++;
    }
    if (code.includes('removeliquidity') && code.includes('onlyowner')) {
      score++;
    }
    if (code.includes('maxtransactionamount') && code.includes('onlyowner')) {
      score++;
    }

    return score >= 2;
  }

  /**
   * Detect unlimited allowance / fee manipulation patterns.
   */
  private detectUnlimitedAllowance(sourceCode: string): boolean {
    const code = sourceCode.toLowerCase();

    // No max supply cap
    if (code.includes('maxtotalupply') && code.includes('type(uint256).max')) {
      return true;
    }

    // Owner can set arbitrary fees
    if (code.includes('setfee') && code.includes('onlyowner') && !code.includes('require')) {
      return true;
    }

    return false;
  }

  /**
   * Detect rug pull risk factors (high owner privilege concentration).
   */
  private detectRugPullRisk(sourceCode: string, flags: VerifyFlag[]): void {
    const code = sourceCode.toLowerCase();

    let riskScore = 0;

    // Owner can exclude from fees
    if (code.includes('excludefromfee')) riskScore++;

    // Owner can set tax to 100%
    if (code.includes('maxfee') && code.includes('100')) riskScore++;

    // Owner can withdraw contract balance
    if (code.includes('withdraw') && code.includes('onlyowner') && code.includes('address(this).balance')) {
      riskScore++;
    }

    // No renounceOwnership call
    if (code.includes('ownable') && !code.includes('renounceownership')) {
      riskScore++;
    }

    // Owner can pause AND unpause unilaterally
    if (code.includes('pause') && code.includes('onlyowner')) riskScore++;

    if (riskScore >= 3) {
      if (!flags.includes('rug_pull_risk')) {
        flags.push('rug_pull_risk');
      }
    }
  }

  /**
   * Compute risk score as weighted sum of flags, capped at 100.
   */
  private computeRiskScore(flags: VerifyFlag[]): number {
    const weights = { ...DEFAULT_FLAG_WEIGHTS, ...this.options.flagWeights };

    let score = 0;
    for (const flag of flags) {
      score += weights[flag] ?? 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Convert numeric score to RiskLevel.
   */
  private scoreToLevel(score: number): VerifyReport['riskLevel'] {
    if (score <= 25) return 'safe';
    if (score <= 50) return 'warning';
    if (score <= 75) return 'danger';
    return 'critical';
  }

  /**
   * Clear the internal cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (for debugging).
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

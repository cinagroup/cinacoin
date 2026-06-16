/**
 * Travel Rule compliance engine - main entry point.
 */

import type {
  TravelRuleConfig,
  TravelRulePayload,
  TravelRuleResult,
  ComplianceCheck,
  ScreeningResult,
} from './types.js';
import { validateTravelRulePayload } from './validation.js';

// ---------------------------------------------------------------------------
// Compliance Check Pipeline
// ---------------------------------------------------------------------------

/** Build a compliance check object. */
function makeCheck(
  checkId: string,
  description: string,
  status: ComplianceCheck['status'],
  riskContribution: number,
  details?: string,
): ComplianceCheck {
  return { checkId, description, status, riskContribution, details };
}

/**
 * Run the full compliance check pipeline on a Travel Rule payload.
 *
 * Checks performed:
 * 1. TR-001: Payload validation (schema compliance)
 * 2. TR-002: Threshold check (amount vs regulatory minimum)
 * 3. TR-003: VASP licensing verification
 * 4. TR-004: Originator address screening
 * 5. TR-005: Beneficiary address screening
 * 6. TR-006: Sanctions list check
 * 7. TR-007: Illicit activity check
 * 8. TR-008: Same-VASP internal transfer check
 */
export async function runCompliancePipeline(
  payload: TravelRulePayload,
  config: TravelRuleConfig,
): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = [];
  const threshold = config.thresholdUsd ?? 1000;

  // TR-001: Payload validation
  const validationErrors = validateTravelRulePayload(payload);
  checks.push(makeCheck(
    'TR-001',
    'Payload schema validation',
    validationErrors.length === 0 ? 'pass' : 'fail',
    validationErrors.length === 0 ? 0 : 100,
    validationErrors.length > 0
      ? `${validationErrors.length} validation error(s): ${validationErrors.map(e => e.message).join('; ')}`
      : undefined,
  ));

  // TR-002: Threshold check
  const amountNum = parseFloat(payload.amount);
  // In production, fetch real USD price from an oracle
  const estimatedUsd = amountNum * 2000; // placeholder ETH price
  const aboveThreshold = estimatedUsd >= threshold;

  checks.push(makeCheck(
    'TR-002',
    `Threshold check ($${threshold} USD minimum)`,
    aboveThreshold ? 'pass' : 'skipped',
    0,
    aboveThreshold
      ? `Transfer value ($${estimatedUsd.toFixed(2)}) exceeds threshold`
      : `Transfer value ($${estimatedUsd.toFixed(2)}) below threshold; minimal data required`,
  ));

  // TR-003: VASP licensing
  if (config.requireLicensedVasp) {
    const originatorLicensed = await config.vaspRegistry.isLicensed(payload.originatorVasp);
    const beneficiaryLicensed = await config.vaspRegistry.isLicensed(payload.beneficiaryVasp);
    const bothLicensed = originatorLicensed && beneficiaryLicensed;

    checks.push(makeCheck(
      'TR-003',
      'VASP licensing verification',
      bothLicensed ? 'pass' : 'fail',
      bothLicensed ? 0 : 50,
      bothLicensed ? undefined : 'One or both VASPs are not licensed',
    ));
  }

  // TR-004: Originator screening
  if (config.screeningProvider) {
    const originatorScreening = await config.screeningProvider.screenAddress(
      payload.originator.walletAddress,
    );

    checks.push(makeCheck(
      'TR-004',
      'Originator address screening',
      originatorScreening.riskLevel === 'low' ? 'pass' : originatorScreening.riskLevel === 'high' || originatorScreening.riskLevel === 'critical' ? 'fail' : 'pending',
      originatorScreening.riskScore,
      `Risk score: ${originatorScreening.riskScore}/100 (${originatorScreening.riskLevel})`,
    ));

    // TR-006: Sanctions check
    checks.push(makeCheck(
      'TR-006',
      'Originator sanctions list check',
      originatorScreening.sanctioned ? 'fail' : 'pass',
      originatorScreening.sanctioned ? 100 : 0,
      originatorScreening.sanctioned
        ? `Address found on sanctions list(s): ${originatorScreening.sanctionsLists?.join(', ')}`
        : 'No sanctions match found',
    ));

    // TR-007: Illicit activity check
    checks.push(makeCheck(
      'TR-007',
      'Originator illicit activity check',
      originatorScreening.illicitActivity ? 'fail' : 'pass',
      originatorScreening.illicitActivity ? 80 : 0,
      originatorScreening.illicitActivity
        ? `Address associated with: ${originatorScreening.illicitCategories?.join(', ')}`
        : 'No illicit activity detected',
    ));
  }

  // TR-005: Beneficiary screening
  if (config.screeningProvider) {
    const beneficiaryScreening = await config.screeningProvider.screenAddress(
      payload.beneficiary.walletAddress,
    );

    checks.push(makeCheck(
      'TR-005',
      'Beneficiary address screening',
      beneficiaryScreening.riskLevel === 'low' ? 'pass' : beneficiaryScreening.riskLevel === 'high' || beneficiaryScreening.riskLevel === 'critical' ? 'fail' : 'pending',
      beneficiaryScreening.riskScore,
      `Risk score: ${beneficiaryScreening.riskScore}/100 (${beneficiaryScreening.riskLevel})`,
    ));
  }

  // TR-008: Internal transfer check
  const isInternal = payload.originatorVasp === payload.beneficiaryVasp;
  checks.push(makeCheck(
    'TR-008',
    'Internal transfer detection',
    'pass',
    0,
    isInternal ? 'Internal VASP transfer (reduced requirements)' : 'Cross-VASP transfer',
  ));

  return checks;
}

// ---------------------------------------------------------------------------
// TravelRuleEngine
// ---------------------------------------------------------------------------

/**
 * Main Travel Rule compliance engine.
 *
 * Coordinates payload validation, VASP lookup, address screening,
 * and the compliance check pipeline to produce an evaluation result.
 */
export class TravelRuleEngine {
  private readonly config: Required<TravelRuleConfig>;

  constructor(config: TravelRuleConfig) {
    this.config = {
      thresholdUsd: config.thresholdUsd ?? 1000,
      vaspRegistry: config.vaspRegistry,
      screeningProvider: config.screeningProvider ?? (undefined as unknown as NonNullable<TravelRuleConfig['screeningProvider']>),
      // Note: screeningProvider is typed as `Required<>` below but may be undefined at runtime.
      // The code guards with `if (this.config.screeningProvider)` before calling methods.
      rejectSanctioned: config.rejectSanctioned ?? true,
      requireLicensedVasp: config.requireLicensedVasp ?? false,
      maxRiskScore: config.maxRiskScore ?? 70,
    };
  }

  /**
   * Evaluate a travel rule payload through the full compliance pipeline.
   */
  async evaluate(payload: TravelRulePayload): Promise<TravelRuleResult> {
    const threshold = this.config.thresholdUsd;

    // Step 1: Validate payload
    const validationErrors = validateTravelRulePayload(payload);
    if (validationErrors.length > 0) {
      return {
        status: 'rejected',
        aboveThreshold: false,
        thresholdUsd: threshold,
        estimatedUsdValue: 0,
        checks: [makeCheck('TR-001', 'Payload validation', 'fail', 100,
          `${validationErrors.length} error(s): ${validationErrors.map(e => e.message).join('; ')}`)],
        overallRiskScore: 100,
        reason: `Invalid payload: ${validationErrors.length} validation error(s)`,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // Step 2: Estimate USD value
    const amountNum = parseFloat(payload.amount);
    const estimatedUsd = amountNum * 2000; // placeholder; use oracle in production
    const aboveThreshold = estimatedUsd >= threshold;

    // Step 3: Run compliance pipeline
    const checks = await runCompliancePipeline(payload, this.config);

    // Step 4: Run screening (if configured)
    let originatorScreening: ScreeningResult | undefined;
    let beneficiaryScreening: ScreeningResult | undefined;

    if (this.config.screeningProvider) {
      originatorScreening = await this.config.screeningProvider.screenAddress(
        payload.originator.walletAddress,
      );
      beneficiaryScreening = await this.config.screeningProvider.screenAddress(
        payload.beneficiary.walletAddress,
      );

      // Auto-reject sanctioned addresses
      if (this.config.rejectSanctioned) {
        if (originatorScreening.sanctioned) {
          return this.makeRejectedResult(
            threshold, estimatedUsd, aboveThreshold, checks,
            originatorScreening, beneficiaryScreening,
            'Originator address is on a sanctions list',
          );
        }
        if (beneficiaryScreening.sanctioned) {
          return this.makeRejectedResult(
            threshold, estimatedUsd, aboveThreshold, checks,
            originatorScreening, beneficiaryScreening,
            'Beneficiary address is on a sanctions list',
          );
        }
      }
    }

    // Step 5: Calculate overall risk score
    const maxRisk = Math.max(...checks.map(c => c.riskContribution), 0);
    const avgRisk = checks.reduce((sum, c) => sum + c.riskContribution, 0) / checks.length;
    const overallRisk = Math.round(Math.max(maxRisk, avgRisk));

    // Step 6: Determine status
    const hasFailures = checks.some(c => c.status === 'fail');
    const hasPending = checks.some(c => c.status === 'pending');

    let status: TravelRuleResult['status'];
    let reason: string;

    if (hasFailures || overallRisk > this.config.maxRiskScore) {
      status = 'rejected';
      reason = `Compliance failed: risk score ${overallRisk}/100 exceeds maximum ${this.config.maxRiskScore}`;
    } else if (hasPending) {
      status = 'review';
      reason = 'Manual review required: some checks are pending';
    } else if (!aboveThreshold) {
      status = 'approved';
      reason = `Transfer below $${threshold} threshold; minimal requirements met`;
    } else {
      status = 'approved';
      reason = 'All compliance checks passed';
    }

    return {
      status,
      aboveThreshold,
      thresholdUsd: threshold,
      estimatedUsdValue: estimatedUsd,
      checks,
      originatorScreening,
      beneficiaryScreening,
      overallRiskScore: overallRisk,
      reason,
      evaluatedAt: new Date().toISOString(),
      payload,
    };
  }

  private makeRejectedResult(
    threshold: number,
    estimatedUsd: number,
    aboveThreshold: boolean,
    checks: ComplianceCheck[],
    originatorScreening?: ScreeningResult,
    beneficiaryScreening?: ScreeningResult,
    reason?: string,
  ): TravelRuleResult {
    return {
      status: 'rejected',
      aboveThreshold,
      thresholdUsd: threshold,
      estimatedUsdValue: estimatedUsd,
      checks,
      originatorScreening,
      beneficiaryScreening,
      overallRiskScore: 100,
      reason: reason ?? 'Transfer rejected due to sanctions compliance',
      evaluatedAt: new Date().toISOString(),
    };
  }
}

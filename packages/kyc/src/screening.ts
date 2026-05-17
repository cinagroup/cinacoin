/**
 * Transaction screening engine.
 *
 * Combines sanctions-list lookups with heuristic pattern analysis to
 * produce a risk assessment for any on-chain transaction or payment.
 */

import type {
  ScreeningResult,
  TransactionRisk,
  TransactionInput,
  PaymentScreeningParams,
  AddressRiskProfile,
  ComplianceReport,
  KycStatus,
} from './types.js';
import {
  isSanctioned,
  isMixer,
  isScamAddress,
  isRiskyExchange,
  getMatchedLists,
  listBasedRiskLevel,
} from './lists.js';

/* ── helpers ───────────────────────────────────────────────────── */

function now(): string {
  return new Date().toISOString();
}

/**
 * Compute a numeric risk score (0–100) from list membership flags.
 */
function listScore(address: string): number {
  if (isSanctioned(address)) return 100;
  if (isMixer(address)) return 85;
  if (isScamAddress(address)) return 90;
  if (isRiskyExchange(address)) return 60;
  return 5;
}

/**
 * Analyse transaction parameters for suspicious patterns.
 * Returns a list of flags and an additive score.
 */
function analysePatterns(
  tx: TransactionInput,
): { flags: string[]; score: number } {
  const flags: string[] = [];
  let score = 0;

  const amt = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;

  // Round-amount heuristic (common in structured transfers)
  if (Number.isInteger(amt) && amt > 0 && amt % 1000 === 0) {
    flags.push('round-amount');
    score += 10;
  }

  // Very large transfer
  if (amt > 100000) {
    flags.push('large-amount');
    score += 15;
  }

  // Self-transfer (potential wash)
  if (tx.from.toLowerCase() === tx.to.toLowerCase()) {
    flags.push('self-transfer');
    score += 25;
  }

  // Both parties are mixers → extremely suspicious
  if (isMixer(tx.from) && isMixer(tx.to)) {
    flags.push('mixer-to-mixer');
    score += 40;
  }

  // Sanctioned party
  if (isSanctioned(tx.from) || isSanctioned(tx.to)) {
    flags.push('sanctioned-party');
    score += 50;
  }

  return { flags, score: Math.min(score, 100) };
}

/* ── public API ────────────────────────────────────────────────── */

/**
 * Screen a single address against all known lists.
 */
export function screenAddress(address: string): ScreeningResult {
  const matched = getMatchedLists(address);
  const riskLevel = listBasedRiskLevel(address);
  const score = listScore(address);

  return {
    address,
    riskLevel,
    riskScore: score,
    isSanctioned: isSanctioned(address),
    matchedLists: matched,
    flags: matched.length > 0 ? matched : [],
    screenedAt: now(),
  };
}

/**
 * Analyse a full transaction for suspicious patterns.
 */
export function screenTransaction(tx: TransactionInput): TransactionRisk {
  const sender = screenAddress(tx.from);
  const recipient = screenAddress(tx.to);
  const patterns = analysePatterns(tx);

  // Composite score: max of party scores + pattern penalty
  const compositeScore = Math.min(
    100,
    Math.max(sender.riskScore, recipient.riskScore) + patterns.score,
  );

  const riskLevel: TransactionRisk['riskLevel'] =
    compositeScore >= 100
      ? 'sanctioned'
      : compositeScore >= 75
        ? 'high'
        : compositeScore >= 40
          ? 'medium'
          : 'low';

  const allFlags = [...sender.flags, ...recipient.flags, ...patterns.flags];

  return {
    tx,
    riskScore: compositeScore,
    riskLevel,
    senderResult: sender,
    recipientResult: recipient,
    patternFlags: patterns.flags,
    shouldBlock: riskLevel === 'sanctioned' || isSanctioned(tx.from) || isSanctioned(tx.to),
    recommendation:
      riskLevel === 'sanctioned'
        ? 'BLOCK — sanctioned party involved'
        : riskLevel === 'high'
          ? 'BLOCK or escalate for manual review'
          : riskLevel === 'medium'
            ? 'Allow with enhanced monitoring'
            : 'Allow — no concerns',
    screenedAt: now(),
  };
}

/**
 * Pre-payment compliance check — convenience wrapper.
 */
export function screenPayment(params: PaymentScreeningParams): TransactionRisk {
  return screenTransaction({
    from: params.sender ?? '0x0000000000000000000000000000000000000000',
    to: params.recipient,
    amount: params.amount,
    asset: params.asset,
    network: params.network,
  });
}

/**
 * Get a numeric risk score for an address (0–100).
 */
export function getRiskScore(address: string): number {
  return screenAddress(address).riskScore;
}

/**
 * Build a full compliance report for an address.
 */
export function getComplianceReport(address: string): ComplianceReport {
  const screening = screenAddress(address);
  const riskProfile: AddressRiskProfile = {
    address,
    riskScore: screening.riskScore,
    riskLevel: screening.riskLevel,
    sanctioned: screening.isSanctioned,
    sanctioningBodies: screening.isSanctioned ? ['OFAC'] : [],
    suspiciousTxCount: 0, // Enrich with on-chain analytics in production
    lastUpdated: now(),
  };

  if (isMixer(address)) {
    riskProfile.entityLabel = 'Mixer / Tumbler';
    riskProfile.entityCategory = 'mixer';
  } else if (isRiskyExchange(address)) {
    riskProfile.entityLabel = 'High-Risk Exchange';
    riskProfile.entityCategory = 'exchange';
  } else if (isScamAddress(address)) {
    riskProfile.entityLabel = 'Known Scam';
    riskProfile.entityCategory = 'unknown';
  }

  return {
    address,
    kycStatus: screening.isSanctioned ? 'rejected' : screening.riskLevel === 'low' ? 'verified' : 'flagged',
    riskProfile,
    screening,
    sanctionsHistory: screening.isSanctioned
      ? [{ list: 'OFAC SDN', addedAt: now() }]
      : [],
    recommendation:
      screening.isSanctioned
        ? 'block'
        : screening.riskLevel === 'medium'
          ? 'review'
          : 'allow',
    generatedAt: now(),
  };
}

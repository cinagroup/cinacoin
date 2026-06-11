/**
 * Travel Rule Compliance Report Generator
 *
 * Generates standardized compliance reports for FATF Travel Rule
 * transfers. Reports include:
 * - IVMS101-compatible data format
 * - Audit trail of compliance checks
 * - PII handling (encrypted/redacted)
 * - Regulatory jurisdiction metadata
 *
 * These reports are used for:
 * - Internal compliance audits
 * - Regulatory submissions
 * - VASP-to-VASP data exchange
 * - Legal discovery
 */

import type {
  TravelRulePayload,
  TravelRuleResult,
  ComplianceCheck,
  ScreeningResult,
  VaspRecord,
  CountryCode,
  TransferDirection,
} from './TravelRule.js';

// ============================================================
// Report Types
// ============================================================

/** Compliance report format version. */
export type ReportFormat = 'ivms101' | 'cinacoin-v1' | 'trisa';

/** Report generation context. */
export interface ReportContext {
  /** Report unique ID */
  reportId: string;
  /** Report format */
  format: ReportFormat;
  /** Generating VASP ID */
  generatingVasp: string;
  /** Report purpose */
  purpose: 'audit' | 'regulatory' | 'vasp-exchange' | 'internal';
  /** Jurisdiction for regulatory requirements */
  jurisdiction?: CountryCode;
  /** Whether to include PII */
  includePii: boolean;
  /** Report generation timestamp */
  generatedAt: string;
}

/** A generated compliance report. */
export interface ComplianceReport {
  /** Report metadata */
  context: ReportContext;
  /** Original travel rule payload (may have PII redacted) */
  payload: TravelRulePayload;
  /** Compliance evaluation result */
  evaluation: TravelRuleResult;
  /** Data retention policy applied */
  retentionPolicy: DataRetentionPolicy;
  /** Audit trail entries */
  auditTrail: AuditTrailEntry[];
  /** Regulatory notes */
  regulatoryNotes?: string;
  /** Report signature (for integrity verification) */
  signature?: string;
}

/** Data retention policy applied to the report. */
export interface DataRetentionPolicy {
  /** Minimum retention period in years */
  minRetentionYears: number;
  /** PII encryption required */
  encryptPii: boolean;
  /** Auto-delete after expiry */
  autoDelete: boolean;
  /** Jurisdiction-specific requirements */
  jurisdictionalRequirements?: Record<string, string>;
}

/** A single audit trail entry. */
export interface AuditTrailEntry {
  /** Entry ID */
  entryId: string;
  /** Timestamp */
  timestamp: string;
  /** Action performed */
  action: string;
  /** Actor (system, compliance officer, etc.) */
  actor: string;
  /** Details */
  details?: string;
  /** IP address (for audit) */
  ipAddress?: string;
}

// ============================================================
// Report Generator
// ============================================================

export class ComplianceReportGenerator {
  private readonly generatingVasp: string;

  constructor(generatingVasp: string) {
    this.generatingVasp = generatingVasp;
  }

  /**
   * Generate a compliance report from a Travel Rule evaluation.
   */
  async generateReport(
    payload: TravelRulePayload,
    evaluation: TravelRuleResult,
    options?: Partial<ReportContext>,
  ): Promise<ComplianceReport> {
    const reportId = `report-${Date.now()}-${crypto.randomUUID().slice(0, 10)}`;

    const context: ReportContext = {
      reportId,
      format: options?.format ?? 'cinacoin-v1',
      generatingVasp: this.generatingVasp,
      purpose: options?.purpose ?? 'internal',
      jurisdiction: options?.jurisdiction,
      includePii: options?.includePii ?? false,
      generatedAt: new Date().toISOString(),
    };

    // Redact PII if not included
    const safePayload = context.includePii
      ? payload
      : this.redactPii(payload);

    // Build audit trail
    const auditTrail: AuditTrailEntry[] = [
      {
        entryId: `${reportId}-001`,
        timestamp: payload.timestamp,
        action: 'travel_rule_payload_received',
        actor: 'system',
        details: `Transfer ${payload.transferId} initiated`,
      },
      {
        entryId: `${reportId}-002`,
        timestamp: evaluation.evaluatedAt,
        action: 'compliance_evaluation_completed',
        actor: 'travel-rule-engine',
        details: `Status: ${evaluation.status}, Risk: ${evaluation.overallRiskScore}/100`,
      },
      {
        entryId: `${reportId}-003`,
        timestamp: context.generatedAt,
        action: 'compliance_report_generated',
        actor: 'report-generator',
        details: `Format: ${context.format}, Purpose: ${context.purpose}`,
      },
    ];

    // Add screening audit entries
    if (evaluation.originatorScreening) {
      auditTrail.push({
        entryId: `${reportId}-004`,
        timestamp: evaluation.originatorScreening.screenedAt,
        action: 'originator_screening_completed',
        actor: evaluation.originatorScreening.provider,
        details: `Risk: ${evaluation.originatorScreening.riskLevel} (${evaluation.originatorScreening.riskScore}/100)`,
      });
    }

    if (evaluation.beneficiaryScreening) {
      auditTrail.push({
        entryId: `${reportId}-005`,
        timestamp: evaluation.beneficiaryScreening.screenedAt,
        action: 'beneficiary_screening_completed',
        actor: evaluation.beneficiaryScreening.provider,
        details: `Risk: ${evaluation.beneficiaryScreening.riskLevel} (${evaluation.beneficiaryScreening.riskScore}/100)`,
      });
    }

    // Add check-specific audit entries
    for (const check of evaluation.checks) {
      if (check.status === 'fail') {
        auditTrail.push({
          entryId: `${reportId}-chk-${check.checkId}`,
          timestamp: context.generatedAt,
          action: `compliance_check_failed: ${check.checkId}`,
          actor: 'compliance-engine',
          details: check.details,
        });
      }
    }

    // Determine retention policy
    const retentionPolicy = this.determineRetentionPolicy(context.jurisdiction);

    // Regulatory notes
    let regulatoryNotes: string | undefined;
    if (context.jurisdiction) {
      regulatoryNotes = this.getJurisdictionNotes(context.jurisdiction, evaluation);
    }

    return {
      context,
      payload: safePayload,
      evaluation,
      retentionPolicy,
      auditTrail,
      regulatoryNotes,
    };
  }

  /**
   * Redact PII from a travel rule payload.
   * Keeps only the data needed for compliance verification.
   */
  private redactPii(payload: TravelRulePayload): TravelRulePayload {
    return {
      ...payload,
      originator: {
        ...payload.originator,
        naturalPerson: payload.originator.naturalPerson
          ? {
              ...payload.originator.naturalPerson,
              name: `[REDACTED]`,
              dateOfBirth: undefined,
              placeOfBirth: undefined,
              nationalId: undefined,
              nationalIdCountry: undefined,
              customerId: `[CENSORED-${payload.originator.naturalPerson.customerId?.slice(-4)}]`,
            }
          : undefined,
        legalEntity: payload.originator.legalEntity
          ? {
              ...payload.originator.legalEntity,
              name: `[REDACTED]`,
              registrationNumber: undefined,
              registeredAddress: undefined,
              taxId: undefined,
            }
          : undefined,
        geographicAddress: undefined,
        phoneNumber: undefined,
        email: undefined,
      },
      beneficiary: {
        ...payload.beneficiary,
        naturalPerson: payload.beneficiary.naturalPerson
          ? {
              ...payload.beneficiary.naturalPerson,
              name: `[REDACTED]`,
              dateOfBirth: undefined,
              placeOfBirth: undefined,
              nationalId: undefined,
              nationalIdCountry: undefined,
              customerId: undefined,
            }
          : undefined,
        legalEntity: payload.beneficiary.legalEntity
          ? {
              ...payload.beneficiary.legalEntity,
              name: `[REDACTED]`,
              registrationNumber: undefined,
              registeredAddress: undefined,
              taxId: undefined,
            }
          : undefined,
        geographicAddress: undefined,
        phoneNumber: undefined,
        email: undefined,
      },
    };
  }

  /**
   * Determine data retention policy based on jurisdiction.
   */
  private determineRetentionPolicy(
    jurisdiction?: CountryCode,
  ): DataRetentionPolicy {
    // Default: FATF recommendation is 5 years minimum
    const policies: Record<string, Partial<DataRetentionPolicy>> = {
      US: { minRetentionYears: 5, encryptPii: true, autoDelete: false },
      GB: { minRetentionYears: 5, encryptPii: true, autoDelete: true },
      EU: { minRetentionYears: 5, encryptPii: true, autoDelete: true },
      SG: { minRetentionYears: 5, encryptPii: true, autoDelete: false },
      JP: { minRetentionYears: 7, encryptPii: true, autoDelete: false },
      KR: { minRetentionYears: 5, encryptPii: true, autoDelete: false },
    };

    const policy = jurisdiction ? policies[jurisdiction] : undefined;

    return {
      minRetentionYears: policy?.minRetentionYears ?? 5,
      encryptPii: policy?.encryptPii ?? true,
      autoDelete: policy?.autoDelete ?? false,
      jurisdictionalRequirements: policy?.jurisdictionalRequirements,
    };
  }

  /**
   * Get jurisdiction-specific regulatory notes.
   */
  private getJurisdictionNotes(
    jurisdiction: CountryCode,
    evaluation: TravelRuleResult,
  ): string {
    const notes: Record<string, string> = {
      US: 'Compliance with FinCEN travel rule requirements (31 CFR 1010.410). ' +
        'Reports retained per Bank Secrecy Act requirements.',
      GB: 'Compliance with UK Money Laundering Regulations 2017. ' +
        'Data processed per GDPR and UK Data Protection Act 2018.',
      EU: 'Compliance with EU Transfer of Funds Regulation (TFR) 2023/1113. ' +
        'Data processed per GDPR (EU) 2016/679.',
      SG: 'Compliance with MAS Notice PSN02 (Prevention of Money Laundering). ' +
        'Data retained per PDPA requirements.',
      JP: 'Compliance with JFSA virtual asset exchange regulations. ' +
        'Reports retained per Act on Prevention of Transfer of Criminal Proceeds.',
    };

    return notes[jurisdiction] ?? `Standard FATF Recommendation 16 compliance applied.`;
  }

  /**
   * Export a report in IVMS101-compatible JSON format.
   */
  exportAsJson(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate a summary of the compliance report for dashboard display.
   */
  static generateSummary(report: ComplianceReport): {
    status: string;
    riskScore: number;
    checksPassed: number;
    checksFailed: number;
    checksPending: number;
    aboveThreshold: boolean;
    retentionYears: number;
    auditEntries: number;
  } {
    const { evaluation, retentionPolicy, auditTrail } = report;

    const checksPassed = evaluation.checks.filter(c => c.status === 'pass').length;
    const checksFailed = evaluation.checks.filter(c => c.status === 'fail').length;
    const checksPending = evaluation.checks.filter(c => c.status === 'pending').length;

    return {
      status: evaluation.status,
      riskScore: evaluation.overallRiskScore,
      checksPassed,
      checksFailed,
      checksPending,
      aboveThreshold: evaluation.aboveThreshold,
      retentionYears: retentionPolicy.minRetentionYears,
      auditEntries: auditTrail.length,
    };
  }
}

// ============================================================
// Data Collection Module
// ============================================================

/**
 * Collects and validates travel rule data from user input,
 * ensuring all required fields are present before submission.
 */
export class TravelRuleDataCollector {
  private originatorData: Partial<TravelRulePayload['originator']> = {};
  private beneficiaryData: Partial<TravelRulePayload['beneficiary']> = {};
  private transferData: Partial<Pick<TravelRulePayload, 'amount' | 'asset' | 'purpose'>> = {};
  private vaspData: { originatorVasp?: string; beneficiaryVasp?: string } = {};

  /**
   * Set originator data.
   */
  setOriginator(data: Partial<TravelRulePayload['originator']>): void {
    this.originatorData = { ...this.originatorData, ...data };
  }

  /**
   * Set beneficiary data.
   */
  setBeneficiary(data: Partial<TravelRulePayload['beneficiary']>): void {
    this.beneficiaryData = { ...this.beneficiaryData, ...data };
  }

  /**
   * Set transfer data.
   */
  setTransferData(data: Partial<Pick<TravelRulePayload, 'amount' | 'asset' | 'purpose'>>): void {
    this.transferData = { ...this.transferData, ...data };
  }

  /**
   * Set VASP identifiers.
   */
  setVaspData(originatorVasp: string, beneficiaryVasp: string): void {
    this.vaspData = { originatorVasp, beneficiaryVasp };
  }

  /**
   * Check if all required data has been collected.
   * Returns a list of missing fields.
   */
  validate(): { complete: boolean; missing: string[] } {
    const missing: string[] = [];

    // Originator required fields
    if (!this.originatorData.type) missing.push('originator.type');
    if (!this.originatorData.walletAddress) missing.push('originator.walletAddress');
    if (this.originatorData.type === 'natural_person' && !this.originatorData.naturalPerson?.name) {
      missing.push('originator.naturalPerson.name');
    }
    if (this.originatorData.type === 'legal_entity' && !this.originatorData.legalEntity?.name) {
      missing.push('originator.legalEntity.name');
    }

    // Beneficiary required fields
    if (!this.beneficiaryData.type) missing.push('beneficiary.type');
    if (!this.beneficiaryData.walletAddress) missing.push('beneficiary.walletAddress');
    if (this.beneficiaryData.type === 'natural_person' && !this.beneficiaryData.naturalPerson?.name) {
      missing.push('beneficiary.naturalPerson.name');
    }
    if (this.beneficiaryData.type === 'legal_entity' && !this.beneficiaryData.legalEntity?.name) {
      missing.push('beneficiary.legalEntity.name');
    }

    // Transfer required fields
    if (!this.transferData.amount) missing.push('transfer.amount');
    if (!this.transferData.asset) missing.push('transfer.asset');

    // VASP required fields
    if (!this.vaspData.originatorVasp) missing.push('originatorVasp');
    if (!this.vaspData.beneficiaryVasp) missing.push('beneficiaryVasp');

    return {
      complete: missing.length === 0,
      missing,
    };
  }

  /**
   * Build a complete TravelRulePayload from collected data.
   * Throws if data is incomplete.
   */
  buildPayload(transferId?: string): TravelRulePayload {
    const validation = this.validate();
    if (!validation.complete) {
      throw new Error(`Cannot build payload: missing fields: ${validation.missing.join(', ')}`);
    }

    return {
      transferId: transferId || crypto.randomUUID(),
      direction: 'outbound',
      originator: this.originatorData as TravelRulePayload['originator'],
      originatorVasp: this.vaspData.originatorVasp!,
      beneficiary: this.beneficiaryData as TravelRulePayload['beneficiary'],
      beneficiaryVasp: this.vaspData.beneficiaryVasp!,
      amount: this.transferData.amount!,
      asset: this.transferData.asset!,
      purpose: this.transferData.purpose,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset all collected data.
   */
  reset(): void {
    this.originatorData = {};
    this.beneficiaryData = {};
    this.transferData = {};
    this.vaspData = {};
  }

  /**
   * Get a summary of collected data (for debugging / UI display).
   */
  getSummary(): {
    originator: string;
    beneficiary: string;
    transfer: string;
    vaspOriginator: string;
    vaspBeneficiary: string;
    complete: boolean;
    missing: string[];
  } {
    const validation = this.validate();

    const originatorName = this.originatorData.naturalPerson?.name
      ?? this.originatorData.legalEntity?.name
      ?? '[Not provided]';

    const beneficiaryName = this.beneficiaryData.naturalPerson?.name
      ?? this.beneficiaryData.legalEntity?.name
      ?? '[Not provided]';

    return {
      originator: `${originatorName} (${this.originatorData.walletAddress ?? 'no address'})`,
      beneficiary: `${beneficiaryName} (${this.beneficiaryData.walletAddress ?? 'no address'})`,
      transfer: `${this.transferData.amount ?? '?'} ${this.transferData.asset ?? '?'}`,
      vaspOriginator: this.vaspData.originatorVasp ?? '[Not set]',
      vaspBeneficiary: this.vaspData.beneficiaryVasp ?? '[Not set]',
      complete: validation.complete,
      missing: validation.missing,
    };
  }
}

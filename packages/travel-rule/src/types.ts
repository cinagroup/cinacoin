/**
 * Type definitions for FATF Travel Rule compliance.
 */

// ---------------------------------------------------------------------------
// Basic Types
// ---------------------------------------------------------------------------

/** Geographic region code (ISO 3166-1 alpha-2). */
export type CountryCode = string;

/** Asset ticker symbol. */
export type AssetSymbol = 'BTC' | 'ETH' | 'USDT' | 'USDC' | 'SOL' | 'BNB' | 'XRP' | string;

/** Compliance check result status. */
export type ComplianceStatus = 'approved' | 'rejected' | 'review' | 'pending';

/** Screening provider name identifier. */
export type ScreeningProviderName = 'chainalysis' | 'elliptic' | 'ciphertrace' | 'none';

/** Transfer direction. */
export type TransferDirection = 'inbound' | 'outbound' | 'internal';

// ---------------------------------------------------------------------------
// Individual / Entity Identification
// ---------------------------------------------------------------------------

/** Natural person identification data. */
export interface NaturalPerson {
  /** Full legal name (given + surname). */
  name: string;
  /** Date of birth (ISO 8601: YYYY-MM-DD). */
  dateOfBirth?: string;
  /** Place of birth (city, country). */
  placeOfBirth?: string;
  /** National identification number. */
  nationalId?: string;
  /** National ID type (e.g., "passport", "national_id", "drivers_license"). */
  nationalIdType?: string;
  /** Country of issuance for national ID. */
  nationalIdCountry?: CountryCode;
  /** Customer identification number assigned by the VASP. */
  customerId?: string;
}

/** Legal entity identification data. */
export interface LegalEntity {
  /** Registered legal name. */
  name: string;
  /** Registration number (company registry). */
  registrationNumber?: string;
  /** Registered address. */
  registeredAddress?: string;
  /** Country of incorporation. */
  countryOfIncorporation?: CountryCode;
  /** Legal entity identifier (LEI). */
  lei?: string;
  /** Tax identification number. */
  taxId?: string;
}

/** Originator or beneficiary data container. */
export interface TravelRuleParty {
  /** Whether this party is a natural person or legal entity. */
  type: 'natural_person' | 'legal_entity';
  /** Natural person data (if type is natural_person). */
  naturalPerson?: NaturalPerson;
  /** Legal entity data (if type is legal_entity). */
  legalEntity?: LegalEntity;
  /** Virtual asset wallet address. */
  walletAddress: string;
  /** Additional geographic address. */
  geographicAddress?: string;
  /** Country of residence (ISO 3166-1 alpha-2). */
  country?: CountryCode;
  /** Phone number (E.164 format). */
  phoneNumber?: string;
  /** Email address. */
  email?: string;
}

// ---------------------------------------------------------------------------
// Travel Rule Payload
// ---------------------------------------------------------------------------

/**
 * Complete FATF Travel Rule data payload.
 *
 * Conforms to the FATF Recommendation 16 wire transfer information
 * requirements for virtual asset transfers between VASPs.
 */
export interface TravelRulePayload {
  /** Unique transfer identifier (UUID v4 recommended). */
  transferId: string;
  /** Direction of the transfer. */
  direction: TransferDirection;
  /** Originator (sender) information. */
  originator: TravelRuleParty;
  /** Originator's VASP identifier (LEI or DID). */
  originatorVasp: string;
  /** Beneficiary (receiver) information. */
  beneficiary: TravelRuleParty;
  /** Beneficiary's VASP identifier (LEI or DID). */
  beneficiaryVasp: string;
  /** Transfer amount as a string (to preserve precision). */
  amount: string;
  /** Asset ticker symbol. */
  asset: AssetSymbol;
  /** On-chain transaction hash (when available). */
  txId?: string;
  /** Purpose of transfer (free text, optional). */
  purpose?: string;
  /** Timestamp of transfer initiation (ISO 8601). */
  timestamp: string;
  /** Jurisdiction-specific additional data. */
  jurisdictionData?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Screening & Compliance Results
// ---------------------------------------------------------------------------

/** Result from a compliance screening provider. */
export interface ScreeningResult {
  /** Provider that performed the screening. */
  provider: ScreeningProviderName;
  /** Risk score (0 = clean, 100 = highest risk). */
  riskScore: number;
  /** Risk category label. */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Whether the address is on a sanctions list. */
  sanctioned: boolean;
  /** Sanctions list name(s) if sanctioned. */
  sanctionsLists?: string[];
  /** Whether the address is associated with illicit activity. */
  illicitActivity: boolean;
  /** Illicit category labels (e.g., "darknet", "ransomware"). */
  illicitCategories?: string[];
  /** Screening timestamp. */
  screenedAt: string;
  /** Raw provider response (opaque). */
  rawResponse?: Record<string, unknown>;
}

/** Result of a single compliance check step. */
export interface ComplianceCheck {
  /** Check identifier. */
  checkId: string;
  /** Human-readable description. */
  description: string;
  /** Pass/fail/pending status. */
  status: 'pass' | 'fail' | 'pending' | 'skipped';
  /** Risk score contribution (0-100). */
  riskContribution: number;
  /** Details or failure reason. */
  details?: string;
}

/**
 * Complete compliance evaluation result for a Travel Rule payload.
 */
export interface TravelRuleResult {
  /** Overall compliance status. */
  status: ComplianceStatus;
  /** Whether the transfer amount exceeds the regulatory threshold. */
  aboveThreshold: boolean;
  /** Required regulatory threshold in USD. */
  thresholdUsd: number;
  /** Estimated USD value of the transfer. */
  estimatedUsdValue: number;
  /** List of compliance checks performed. */
  checks: ComplianceCheck[];
  /** Screening result for the originator address. */
  originatorScreening?: ScreeningResult;
  /** Screening result for the beneficiary address. */
  beneficiaryScreening?: ScreeningResult;
  /** Overall risk score (0-100). */
  overallRiskScore: number;
  /** Human-readable compliance reason. */
  reason: string;
  /** Timestamp of evaluation. */
  evaluatedAt: string;
  /** Serialized Travel Rule payload (for audit trail). */
  payload?: TravelRulePayload;
}

// ---------------------------------------------------------------------------
// VASP Registry
// ---------------------------------------------------------------------------

/**
 * Virtual Asset Service Provider (VASP) record.
 */
export interface VaspRecord {
  /** Unique VASP identifier (LEI, DID, or internal ID). */
  id: string;
  /** Legal name of the VASP. */
  name: string;
  /** Website URL. */
  website: string;
  /** Jurisdiction of incorporation. */
  jurisdiction: CountryCode;
  /** Whether the VASP is licensed/registered. */
  licensed: boolean;
  /** License number. */
  licenseNumber?: string;
  /** Supported assets. */
  supportedAssets: AssetSymbol[];
  /** API endpoint for Travel Rule data exchange. */
  travelRuleEndpoint?: string;
  /** Public key for encrypted data exchange. */
  publicKey?: string;
  /** Compliance contact email. */
  complianceEmail?: string;
}

/**
 * VASP registry interface. Implement to connect to a real registry
 * (e.g., IVMS101, TRISA directory, or a custom internal registry).
 */
export interface VaspRegistry {
  /** Look up a VASP by ID. */
  lookup(id: string): Promise<VaspRecord | null>;
  /** Look up a VASP by wallet address ownership. */
  lookupByWallet(address: string): Promise<VaspRecord | null>;
  /** List all registered VASPs. */
  listAll(): Promise<VaspRecord[]>;
  /** Check if a VASP is licensed. */
  isLicensed(id: string): Promise<boolean>;
}

/**
 * Abstract interface for blockchain screening providers.
 * Implement for Chainalysis, Elliptic, CipherTrace, etc.
 */
export interface ScreeningProvider {
  /** Screen a single address for risk. */
  screenAddress(address: string): Promise<ScreeningResult>;
  /** Screen multiple addresses in batch. */
  screenBatch(addresses: string[]): Promise<ScreeningResult[]>;
  /** Get the provider name. */
  getProviderName(): ScreeningProviderName;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration options for the TravelRuleEngine. */
export interface TravelRuleConfig {
  /** USD threshold below which minimal data is required. Default: 1000. */
  thresholdUsd?: number;
  /** VASP registry instance. */
  vaspRegistry: VaspRegistry;
  /** Screening provider instance to use. Default: none (skip screening). */
  screeningProvider?: ScreeningProvider;
  /** Whether to reject transfers with sanctioned addresses. */
  rejectSanctioned?: boolean;
  /** Whether to require VASP licensing verification. */
  requireLicensedVasp?: boolean;
  /** Maximum acceptable risk score (0-100). */
  maxRiskScore?: number;
}

// ---------------------------------------------------------------------------
// Price Oracle
// ---------------------------------------------------------------------------

/**
 * Price oracle interface for real-time asset USD valuation.
 */
export interface PriceOracle {
  /** Get the current USD price for an asset. */
  getPriceUsd(asset: AssetSymbol): Promise<number>;
  /** Get the oracle source name. */
  getSourceName(): string;
}

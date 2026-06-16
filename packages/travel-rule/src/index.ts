/**
 * @cinacoin/travel-rule
 *
 * FATF Travel Rule compliance engine for virtual asset transfers.
 *
 * Implements the FATF Recommendation 16 data format for cross-VASP
 * (Virtual Asset Service Provider) information exchange. Supports
 * originator/beneficiary data validation, compliance screening,
 * and integration with Chainalysis/Elliptic for risk scoring.
 *
 * ## Usage
 *
 * ```typescript
 * import { TravelRuleEngine, InMemoryVaspRegistry } from '@cinacoin/travel-rule';
 *
 * const engine = new TravelRuleEngine({
 *   thresholdUsd: 1000,
 *   vaspRegistry: myVaspRegistry,
 *   screeningProvider: 'chainalysis',
 * });
 *
 * const result = await engine.evaluate({
 *   originator: { /* ... *\/ },
 *   beneficiary: { /* ... *\/ },
 *   amount: '5000',
 *   asset: 'ETH',
 * });
 *
 * console.log(result.status); // 'approved' | 'rejected' | 'review'
 * ```
 *
 * ## Module Structure
 *
 * - types.ts: Type definitions
 * - schema.ts: JSON Schema for payload validation
 * - validation.ts: Validation functions
 * - oracles.ts: Price oracle implementations
 * - engine.ts: Main TravelRuleEngine class
 * - mocks.ts: Mock implementations for testing
 */

// Types
export type {
  CountryCode,
  AssetSymbol,
  ComplianceStatus,
  ScreeningProviderName,
  TransferDirection,
  NaturalPerson,
  LegalEntity,
  TravelRuleParty,
  TravelRulePayload,
  ScreeningResult,
  ComplianceCheck,
  TravelRuleResult,
  VaspRecord,
  VaspRegistry,
  ScreeningProvider,
  TravelRuleConfig,
  PriceOracle,
} from './types.js';

// Schema
export { TRAVEL_RULE_JSON_SCHEMA, TravelRuleJsonSchema } from './schema.js';

// Validation
export {
  isValidEvmAddress,
  isValidSolanaAddress,
  isValidWalletAddress,
  isValidDate,
  isValidCountryCode,
  isValidPhone,
  isValidEmail,
  validateParty,
  validateTravelRulePayload,
} from './validation.js';
export type { ValidationError } from './validation.js';

// Oracles
export {
  ChainlinkPriceOracle,
  PythPriceOracle,
  FallbackPriceOracle,
} from './oracles.js';

// Engine
export { TravelRuleEngine, runCompliancePipeline } from './engine.js';

// Mocks
export { InMemoryVaspRegistry, MockScreeningProvider } from './mocks.js';

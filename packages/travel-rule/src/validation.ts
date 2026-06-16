/**
 * Validation helpers and functions for Travel Rule payloads.
 */

import type { TravelRuleParty, TravelRulePayload } from './types.js';

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/** Validate an EVM address (0x + 40 hex chars). */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/** Validate a Solana address (base58, 32-44 chars). */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/** Validate a generic wallet address (EVM or Solana). */
export function isValidWalletAddress(address: string): boolean {
  return isValidEvmAddress(address) || isValidSolanaAddress(address);
}

/** Validate an ISO 8601 date string (YYYY-MM-DD). */
export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/** Validate a country code (ISO 3166-1 alpha-2). */
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/** Validate a phone number (E.164 format). */
export function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/** Validate an email address. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Validation Pipeline
// ---------------------------------------------------------------------------

/** Validation error with field path and message. */
export interface ValidationError {
  /** JSON path to the invalid field (e.g., "originator.naturalPerson.name"). */
  field: string;
  /** Human-readable error message. */
  message: string;
}

/**
 * Validate a TravelRuleParty object.
 * Returns an array of validation errors (empty = valid).
 */
export function validateParty(
  party: TravelRuleParty,
  prefix: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Wallet address
  if (!party.walletAddress) {
    errors.push({ field: `${prefix}.walletAddress`, message: 'walletAddress is required' });
  } else if (!isValidWalletAddress(party.walletAddress)) {
    errors.push({ field: `${prefix}.walletAddress`, message: 'Invalid wallet address format' });
  }

  // Type discriminator
  if (!party.type) {
    errors.push({ field: `${prefix}.type`, message: 'type is required' });
  } else if (party.type !== 'natural_person' && party.type !== 'legal_entity') {
    errors.push({ field: `${prefix}.type`, message: 'type must be "natural_person" or "legal_entity"' });
  }

  // Natural person
  if (party.type === 'natural_person') {
    if (!party.naturalPerson?.name) {
      errors.push({ field: `${prefix}.naturalPerson.name`, message: 'name is required for natural persons' });
    }
    if (party.naturalPerson?.dateOfBirth && !isValidDate(party.naturalPerson.dateOfBirth)) {
      errors.push({ field: `${prefix}.naturalPerson.dateOfBirth`, message: 'dateOfBirth must be YYYY-MM-DD format' });
    }
    if (party.naturalPerson?.nationalIdCountry && !isValidCountryCode(party.naturalPerson.nationalIdCountry)) {
      errors.push({ field: `${prefix}.naturalPerson.nationalIdCountry`, message: 'nationalIdCountry must be ISO 3166-1 alpha-2' });
    }
  }

  // Legal entity
  if (party.type === 'legal_entity') {
    if (!party.legalEntity?.name) {
      errors.push({ field: `${prefix}.legalEntity.name`, message: 'name is required for legal entities' });
    }
    if (party.legalEntity?.countryOfIncorporation && !isValidCountryCode(party.legalEntity.countryOfIncorporation)) {
      errors.push({ field: `${prefix}.legalEntity.countryOfIncorporation`, message: 'countryOfIncorporation must be ISO 3166-1 alpha-2' });
    }
    if (party.legalEntity?.lei && !/^[A-Z0-9]{20}$/.test(party.legalEntity.lei)) {
      errors.push({ field: `${prefix}.legalEntity.lei`, message: 'LEI must be 20 alphanumeric characters' });
    }
  }

  // Optional fields format validation
  if (party.country && !isValidCountryCode(party.country)) {
    errors.push({ field: `${prefix}.country`, message: 'country must be ISO 3166-1 alpha-2' });
  }
  if (party.phoneNumber && !isValidPhone(party.phoneNumber)) {
    errors.push({ field: `${prefix}.phoneNumber`, message: 'phoneNumber must be E.164 format' });
  }
  if (party.email && !isValidEmail(party.email)) {
    errors.push({ field: `${prefix}.email`, message: 'Invalid email format' });
  }

  return errors;
}

/**
 * Validate a complete TravelRulePayload.
 * Returns an array of validation errors (empty = valid).
 */
export function validateTravelRulePayload(
  payload: TravelRulePayload,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!payload.transferId) {
    errors.push({ field: 'transferId', message: 'transferId is required' });
  }
  if (!payload.amount) {
    errors.push({ field: 'amount', message: 'amount is required' });
  } else if (!/^[0-9]+(\.[0-9]+)?$/.test(payload.amount)) {
    errors.push({ field: 'amount', message: 'amount must be a positive number string' });
  }
  if (!payload.asset) {
    errors.push({ field: 'asset', message: 'asset is required' });
  }
  if (!payload.timestamp) {
    errors.push({ field: 'timestamp', message: 'timestamp is required' });
  }
  if (!payload.originatorVasp) {
    errors.push({ field: 'originatorVasp', message: 'originatorVasp is required' });
  }
  if (!payload.beneficiaryVasp) {
    errors.push({ field: 'beneficiaryVasp', message: 'beneficiaryVasp is required' });
  }
  if (!payload.direction) {
    errors.push({ field: 'direction', message: 'direction is required' });
  }

  // Party validation
  errors.push(...validateParty(payload.originator, 'originator'));
  errors.push(...validateParty(payload.beneficiary, 'beneficiary'));

  return errors;
}

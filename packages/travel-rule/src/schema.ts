/**
 * JSON Schema for FATF Travel Rule payload validation.
 */

/**
 * FATF Travel Rule JSON Schema (IVMS101-compatible).
 * Used for validating incoming/outgoing travel rule payloads.
 */
export const TRAVEL_RULE_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://cinacoin.dev/schemas/travel-rule/v1',
  title: 'FATF Travel Rule Payload',
  description: 'IVMS101-compatible travel rule data format for VASP-to-VASP transfers',
  type: 'object',
  required: ['transferId', 'direction', 'originator', 'originatorVasp', 'beneficiary', 'beneficiaryVasp', 'amount', 'asset', 'timestamp'],
  properties: {
    transferId: { type: 'string', format: 'uuid', description: 'Unique transfer identifier' },
    direction: { type: 'string', enum: ['inbound', 'outbound', 'internal'] },
    originator: {
      type: 'object',
      required: ['type', 'walletAddress'],
      properties: {
        type: { type: 'string', enum: ['natural_person', 'legal_entity'] },
        naturalPerson: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 350 },
            dateOfBirth: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            placeOfBirth: { type: 'string', maxLength: 200 },
            nationalId: { type: 'string', maxLength: 100 },
            nationalIdType: { type: 'string' },
            nationalIdCountry: { type: 'string', pattern: '^[A-Z]{2}$' },
            customerId: { type: 'string', maxLength: 100 },
          },
        },
        legalEntity: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 350 },
            registrationNumber: { type: 'string', maxLength: 50 },
            registeredAddress: { type: 'string', maxLength: 350 },
            countryOfIncorporation: { type: 'string', pattern: '^[A-Z]{2}$' },
            lei: { type: 'string', pattern: '^[A-Z0-9]{20}$' },
            taxId: { type: 'string', maxLength: 50 },
          },
        },
        walletAddress: { type: 'string', minLength: 1, maxLength: 200 },
        geographicAddress: { type: 'string', maxLength: 350 },
        country: { type: 'string', pattern: '^[A-Z]{2}$' },
        phoneNumber: { type: 'string', pattern: '^\\+[1-9]\\d{6,14}$' },
        email: { type: 'string', format: 'email' },
      },
    },
    originatorVasp: { type: 'string', minLength: 1 },
    beneficiary: {
      type: 'object',
      required: ['type', 'walletAddress'],
      properties: {
        type: { type: 'string', enum: ['natural_person', 'legal_entity'] },
        naturalPerson: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 350 },
            dateOfBirth: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            placeOfBirth: { type: 'string', maxLength: 200 },
            nationalId: { type: 'string', maxLength: 100 },
            nationalIdType: { type: 'string' },
            nationalIdCountry: { type: 'string', pattern: '^[A-Z]{2}$' },
            customerId: { type: 'string', maxLength: 100 },
          },
        },
        legalEntity: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 350 },
            registrationNumber: { type: 'string', maxLength: 50 },
            registeredAddress: { type: 'string', maxLength: 350 },
            countryOfIncorporation: { type: 'string', pattern: '^[A-Z]{2}$' },
            lei: { type: 'string', pattern: '^[A-Z0-9]{20}$' },
            taxId: { type: 'string', maxLength: 50 },
          },
        },
        walletAddress: { type: 'string', minLength: 1, maxLength: 200 },
        geographicAddress: { type: 'string', maxLength: 350 },
        country: { type: 'string', pattern: '^[A-Z]{2}$' },
        phoneNumber: { type: 'string', pattern: '^\\+[1-9]\\d{6,14}$' },
        email: { type: 'string', format: 'email' },
      },
    },
    beneficiaryVasp: { type: 'string', minLength: 1 },
    amount: { type: 'string', pattern: '^[0-9]+(\\.[0-9]+)?$' },
    asset: { type: 'string', minLength: 1, maxLength: 20 },
    txId: { type: 'string', maxLength: 200 },
    purpose: { type: 'string', maxLength: 500 },
    timestamp: { type: 'string', format: 'date-time' },
    jurisdictionData: { type: 'object' },
  },
} as const;

export { TRAVEL_RULE_JSON_SCHEMA as TravelRuleJsonSchema };

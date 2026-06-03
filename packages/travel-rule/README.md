# @cinacoin/travel-rule

FATF Travel Rule compliance engine for virtual asset transfers between VASPs. Supports IVMS101 data format, originator/beneficiary validation, Chainalysis/Elliptic screening integration, and automated compliance pipelines.

## Installation

```bash
npm install @cinacoin/travel-rule
```

Requires Node.js >= 18.0.0

## Usage

### Basic Evaluation

```ts
import {
  TravelRuleEngine,
  InMemoryVaspRegistry,
} from '@cinacoin/travel-rule';

// Set up a VASP registry
const registry = new InMemoryVaspRegistry();
registry.register({
  id: 'vasp_001',
  name: 'Example Exchange',
  website: 'https://example.exchange',
  jurisdiction: 'US',
  licensed: true,
  supportedAssets: ['BTC', 'ETH', 'USDT'],
});
registry.registerWallet('0xabc...', 'vasp_001');

// Create the engine
const engine = new TravelRuleEngine({
  thresholdUsd: 1000,
  vaspRegistry: registry,
});

// Evaluate a transfer
const result = await engine.evaluate({
  transferId: 'uuid-v4-here',
  direction: 'outbound',
  originator: {
    type: 'natural_person',
    naturalPerson: { name: 'Alice Smith' },
    walletAddress: '0xabc...',
  },
  originatorVasp: 'vasp_001',
  beneficiary: {
    type: 'natural_person',
    naturalPerson: { name: 'Bob Jones' },
    walletAddress: '0xdef...',
  },
  beneficiaryVasp: 'vasp_001',
  amount: '2.5',
  asset: 'ETH',
  timestamp: new Date().toISOString(),
});

console.log(result.status); // 'approved' | 'rejected' | 'review'
console.log(result.overallRiskScore); // 0-100
console.log(result.checks); // individual compliance checks
```

### With Screening Provider

```ts
import { TravelRuleEngine, MockScreeningProvider } from '@cinacoin/travel-rule';

const screener = new MockScreeningProvider();
screener.flagRisky('0xdead...');
screener.flagSanctioned('0xbad...');

const engine = new TravelRuleEngine({
  vaspRegistry: registry,
  screeningProvider: screener,
  rejectSanctioned: true,
  maxRiskScore: 70,
});
```

### Payload Validation

```ts
import { validateTravelRulePayload, validateParty } from '@cinacoin/travel-rule';

const errors = validateTravelRulePayload(payload);
if (errors.length > 0) {
  errors.forEach(e => console.log(`${e.field}: ${e.message}`));
}
```

## API Reference

### TravelRuleEngine

| Method | Description |
|--------|-------------|
| `evaluate(payload)` | Run full compliance pipeline and return a `TravelRuleResult` |

### Validation

| Function | Description |
|----------|-------------|
| `validateTravelRulePayload(payload)` | Validate a complete travel rule payload |
| `validateParty(party, prefix)` | Validate originator or beneficiary data |
| `isValidEvmAddress(address)` | Validate an EVM address |
| `isValidSolanaAddress(address)` | Validate a Solana address |
| `isValidWalletAddress(address)` | Validate EVM or Solana address |

### Compliance Pipeline

| Function | Description |
|----------|-------------|
| `runCompliancePipeline(payload, config)` | Run all compliance checks (TR-001 through TR-008) |

### Built-in Implementations

| Class | Description |
|-------|-------------|
| `InMemoryVaspRegistry` | In-memory VASP registry for testing/development |
| `MockScreeningProvider` | Mock screening provider with configurable risk flags |

### Compliance Checks

| ID | Description |
|----|-------------|
| TR-001 | Payload schema validation |
| TR-002 | Regulatory threshold check |
| TR-003 | VASP licensing verification |
| TR-004 | Originator address screening |
| TR-005 | Beneficiary address screening |
| TR-006 | Sanctions list check |
| TR-007 | Illicit activity check |
| TR-008 | Internal transfer detection |

### Key Types

```ts
import type {
  TravelRulePayload,
  TravelRuleResult,
  TravelRuleParty,
  TravelRuleConfig,
  VaspRecord,
  VaspRegistry,
  ScreeningProvider,
  ScreeningResult,
  ComplianceCheck,
  ComplianceStatus,
  ValidationError,
} from '@cinacoin/travel-rule';
```

## Compliance Notes

- **Threshold**: FATF requires originator/beneficiary data for transfers above USD/EUR 1,000
- **Data retention**: PII must be retained for 5 years minimum
- **Encryption**: All data in transit must use TLS 1.3+ with mutual authentication

## License

MIT

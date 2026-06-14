# Chain Registry

Centralized chain configuration for all Cinacoin SDKs.

## Structure

```json
{
  "chains": {
    "<namespace>": {
      "<chainId>": {
        "chainId": number,
        "name": string,
        "shortName": string,
        "symbol": string,
        "decimals": number,
        "rpcUrl": string,
        "explorerUrl": string,
        "iconUrl": string,
        "testnet": boolean
      }
    }
  }
}
```

## Supported Namespaces

| Namespace | Standard | Description                     |
| --------- | -------- | ------------------------------- |
| `evm`     | EIP-155  | Ethereum Virtual Machine chains |

## Usage

### Web (TypeScript)

```typescript
import { chains } from '@cinacoin/chain-registry';
const ethereum = chains.evm['1'];
```

### iOS (Swift)

```swift
import CinacoinAppKitConfig
let ethereum = ChainRegistry.shared.chain(for: 1)
```

### Android (Kotlin)

```kotlin
import com.cinacoin.appkit.config.ChainRegistry
val ethereum = ChainRegistry.getChain(1)
```

### Flutter (Dart)

```dart
import 'package:cinacoin_appkit_config/cinacoin_appkit_config.dart';
final ethereum = ChainRegistry.getChain(1);
```

## Adding New Chains

1. Add chain entry to `chains.json`
2. Update `lastUpdated` timestamp
3. Run validation: `pnpm --filter @cinacoin/chain-registry validate`
4. Submit PR

## Sync Schedule

- Web SDK: Auto-sync on publish
- Mobile SDKs: Sync via CI/CD pipeline
- Manual sync: `pnpm sync-chains`

---

_Version: 1.0.0_  
_Last Updated: 2026-06-14_

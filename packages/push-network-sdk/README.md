# @cinacoin/push-network-sdk

Client SDK for Cinacoin Push Network — register devices and manage notification preferences on web, iOS, Android.

## Installation

```bash
npm install @cinacoin/push-network-sdk
```

## Usage

```typescript
import { PushClient } from "@cinacoin/push-network-sdk";

const client = new PushClient({ apiKey: "your-api-key" });
await client.registerDevice({ token: "fcm-token", platform: "android" });
```

## License

MIT

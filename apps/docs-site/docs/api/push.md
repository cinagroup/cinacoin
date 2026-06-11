# Push.

Real-time push notifications for wallet activity.

## Overview.

Get notified about transactions, approvals, transfers, and chain events in real-time. The CinaCoin Push system delivers notifications to iOS (via APNs) and Android (via FCM) devices, with support for batch delivery, retry logic, rate limiting, and detailed delivery tracking.

**Key capabilities:**

- Cross-platform push (APNs for iOS, FCM for Android)
- Batch notification delivery (up to 100 per batch)
- Device registration and management
- Delivery logging and status tracking
- Rate limiting and retry logic
- Custom event subscriptions

## Installation.

### Client SDK.

```bash
npm install @cinacoin/push
```

### Push server.

```bash
cd packages/push-server
npm install
```

## Quick start.

### Client: subscribe to notifications.

```typescript
import { createPush } from '@cinacoin/push'

const push = createPush({
  projectId: 'your-project-id',
})

// Subscribe to wallet activity events
push.subscribe(address, ['transaction', 'approval'])

// Listen for incoming notifications
push.on('notification', (notif) => {
  console.log('New notification:', notif.title, notif.body)
})
```

### Server: send push notifications.

```typescript
import { PushServer } from '@cinacoin/push-server'

const pushServer = new PushServer({
  apns: {
    keyId: 'YOUR_APNS_KEY_ID',
    teamId: 'YOUR_TEAM_ID',
    bundleId: 'com.yourapp.wallet',
    privateKey: '-----BEGIN PRIVATE KEY-----\n...',
  },
  fcm: {
    projectId: 'your-fcm-project',
    serviceAccountKey: '{"type": "service_account", ...}',
  },
  timeoutMs: 10_000,
})

// Send a single notification
const result = await pushServer.send({
  deviceToken: 'apns-or-fcm-token',
  platform: 'ios',
  title: 'Transaction Received',
  body: 'You received 0.5 ETH from 0x1234...',
  data: {
    type: 'transaction',
    txHash: '0xabcd...',
    amount: '0.5',
  },
})

console.log('Delivered:', result.success)
```

## API reference.

### PushNotification.

| Field | Type | Description |
|---|---|---|
| `deviceToken` | `string` | APNs or FCM device token (max 4096 chars) |
| `platform` | `'ios' \| 'android'` | Target platform |
| `title` | `string` | Notification title (max 256 chars) |
| `body` | `string` | Notification body text (max 4096 chars) |
| `data` | `Record<string, string>` | Optional key-value payload |

### DeliveryResult.

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether delivery succeeded |
| `message` | `string` | Provider message or error description |
| `timestamp` | `number` | Delivery timestamp (Unix ms) |

### PushServerConfig.

| Property | Type | Description |
|---|---|---|
| `apns` | `APNsConfig` | Apple Push Notification service configuration |
| `fcm` | `FCMConfig` | Firebase Cloud Messaging configuration |
| `timeoutMs` | `number` | Delivery timeout in milliseconds |

### APNsConfig.

| Property | Type | Description |
|---|---|---|
| `keyId` | `string` | APNs authentication key ID |
| `teamId` | `string` | Apple Developer team ID |
| `bundleId` | `string` | App bundle identifier |
| `privateKey` | `string` | APNs private key (P8 format) |

### FCMConfig.

| Property | Type | Description |
|---|---|---|
| `projectId` | `string` | Firebase project ID |
| `serviceAccountKey` | `string` | Service account JSON key |

### PushServer methods.

| Method | Description |
|---|---|
| `send(notification)` | Send a push notification to a single device |
| `sendBatch(notifications)` | Send to multiple devices (max 100 per batch) |
| `registerDevice(token, platform, userId?)` | Register a device for notifications |
| `unregisterDevice(token)` | Remove a device from notifications |
| `getDeliveryLog()` | Retrieve delivery history |
| `getRegisteredDevices()` | List all registered devices |

### Client-side push API.

| Method | Description |
|---|---|
| `subscribe(address, events)` | Subscribe to wallet activity events |
| `unsubscribe(address)` | Unsubscribe from all events for an address |
| `on(event, callback)` | Listen for push events |
| `off(event, callback)` | Remove event listener |

## Advanced usage.

### Batch notifications.

```typescript
// Send to multiple devices at once (max 100)
const results = await pushServer.sendBatch([
  {
    deviceToken: 'token-1',
    platform: 'ios',
    title: 'NFT Received',
    body: 'You received BAYC #1234',
    data: { type: 'nft', tokenId: '1234' },
  },
  {
    deviceToken: 'token-2',
    platform: 'android',
    title: 'NFT Received',
    body: 'You received BAYC #1234',
    data: { type: 'nft', tokenId: '1234' },
  },
])

const delivered = results.filter((r) => r.success).length
console.log(`${delivered}/${results.length} notifications delivered`)
```

### Device registration.

```typescript
// Register a new device
await pushServer.registerDevice('apns-device-token', 'ios', 'user-123')

// Register with metadata
await pushServer.registerDevice('fcm-device-token', 'android', 'user-456')

// List registered devices
const devices = pushServer.getRegisteredDevices()
devices.forEach((device) => {
  console.log(`${device.platform}: ${device.registeredAt}`)
})
```

### Delivery log.

```typescript
// Get recent delivery results
const log = pushServer.getDeliveryLog()

const failed = log.filter((r) => !r.success)
console.log(`${failed.length} failed deliveries`)

failed.forEach((result) => {
  console.error('Failed:', result.message, 'at', new Date(result.timestamp))
})
```

### Event subscription types.

| Event | Description |
|---|---|
| `transaction` | Incoming/outgoing transactions |
| `approval` | Token approval events |
| `transfer` | ERC-20/ERC-721 transfers |
| `chain` | Chain switch or network events |

## Architecture.

```
┌─────────────┐     ┌──────────────┐     ┌─────────┐
│  Wallet      │────►│  Push Server  │────►│  APNs   │  → iOS Device
│  Activity    │     │  (Node.js)    │     └─────────┘
│  Monitor     │     │              │     ┌─────────┐
└─────────────┘     │              │────►│  FCM    │  → Android Device
                     └──────────────┘     └─────────┘
```

The push server receives wallet activity events from the Relay or indexer, then delivers native push notifications to registered devices via APNs (iOS) or FCM (Android).

## Related.

- [Notify Server](/api/notify-server) — Notification event generation
- [Push Server](/api/push-server) — Self-hosted push server details
- [Relay](/api/relay) — Real-time message relay

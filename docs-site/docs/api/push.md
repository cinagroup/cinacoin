# Push

Real-time push notifications for wallet activity.

## Overview

Get notified about transactions, approvals, transfers, and chain events in real-time.

## Quick Start

```bash
npm install @cinacoin/push
```

```tsx
import { createPush } from '@cinacoin/push'

const push = createPush({
  projectId: 'your-project-id',
})

push.subscribe(address, ['transaction', 'approval'])
```

## Features

- Wallet activity notifications
- Transaction alerts
- Approval monitoring
- Custom event subscriptions

## Related

- [Notify Server](/api/notify-server)
- [Push Server](/api/push-server)

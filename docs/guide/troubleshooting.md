# Troubleshooting Guide

> Common issues and solutions for CinaConnect development, deployment, and production.

---

## 🔗 Wallet Not Connecting

### Checklist

| Step | Check | How to Verify |
|------|-------|---------------|
| 1 | `projectId` is configured | `console.log(config.projectId)` — must be non-empty string |
| 2 | Relay URL is reachable | `wscat -c wss://relay.yourdomain.com/v1` |
| 3 | Chains are configured | `config.chains.length > 0` |
| 4 | Metadata is set | `config.metadata.name` and `config.metadata.url` |
| 5 | No CORS issues | Check browser DevTools Network tab |

### Debug Mode

```typescript
const config = {
  projectId: 'your-project-id',
  relayUrl: 'wss://relay.cinaconnect.com/v1',
  chains: [mainnet],
  debug: true, // verbose console logging
  logger: {
    level: 'debug',
  },
}
```

### Connection Timeout

If the connection takes more than 10 seconds:

```typescript
// Test relay latency
const start = performance.now()
try {
  await cinaconnect.connect({ timeout: 10000 })
} catch (error) {
  const latency = performance.now() - start
  console.log(`Connection took ${latency}ms`)
}
```

**Fixes:**
- Deploy relay closer to users (multi-region)
- Use DNS preconnect: `<link rel="preconnect" href="https://relay.yourdomain.com">`
- Check for network firewall blocking WebSocket connections

---

## 📷 QR Code Not Showing

### Browser Compatibility

QR code rendering requires canvas or SVG support. Test in:

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+

### Common Issues

**1. QR code component not rendering:**

```tsx
// Ensure the QR code container has dimensions
<div style={{ width: 256, height: 256 }}>
  <QRCode value={pairingUri} />
</div>
```

**2. URI is empty or undefined:**

```typescript
const uri = await cinaconnect.core.pairing.create()
if (!uri) {
  console.error('Failed to generate pairing URI')
  // Check relay connection
}
```

**3. QR code expired:**

```tsx
import { useState, useEffect } from 'react'

function QRDisplay() {
  const [uri, setUri] = useState('')

  useEffect(() => {
    const refresh = async () => {
      const newUri = await cinaconnect.core.pairing.create()
      setUri(newUri)
    }

    refresh()

    // Refresh every 4 minutes (before 5-min TTL)
    const interval = setInterval(refresh, 240_000)
    return () => clearInterval(interval)
  }, [])

  if (!uri) return <p>Loading...</p>
  return <QRCode value={uri} />
}
```

---

## ❌ Transaction Failing

### Debug Steps

**1. Check gas estimation:**

```typescript
import { estimateGas, parseEther } from 'viem'

try {
  const gas = await estimateGas(publicClient, {
    account: userAddress,
    to: contractAddress,
    value: parseEther('0.1'),
    data: encodedFunctionData,
  })
  console.log('Estimated gas:', gas)
} catch (error) {
  // Gas estimation failed — likely a revert
  console.error('Gas estimation failed:', error)
}
```

**2. Check chain alignment:**

```typescript
const walletChain = await provider.request({ method: 'eth_chainId' })
const dappChain = config.chains[0].id

if (parseInt(walletChain, 16) !== dappChain) {
  console.warn(`Wallet on ${walletChain}, dApp expects ${dappChain}`)
  await switchNetwork(config.chains[0])
}
```

**3. Check token approvals:**

```typescript
import { readContract } from 'viem'

const allowance = await readContract(publicClient, {
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'allowance',
  args: [userAddress, spenderAddress],
})

if (allowance < requiredAmount) {
  console.log('Approval needed. Requesting approve transaction...')
}
```

**4. Simulate transaction before sending:**

```typescript
// Use eth_call to simulate
try {
  await publicClient.call({
    account: userAddress,
    to: contractAddress,
    data: encodedFunctionData,
  })
  console.log('Transaction would succeed')
} catch (error) {
  console.error('Transaction would revert:', error.message)
}
```

---

## 🔐 Social Login Not Working

### Magic.link API Key Issues

**1. Verify API key is set:**

```typescript
const socialLogin = new SocialLogin({
  apiKey: process.env.NEXT_PUBLIC_MAGIC_API_KEY,
  network: 'mainnet',
})

// Test initialization
if (!socialLogin.isInitialized) {
  console.error('Magic SDK failed to initialize')
}
```

**2. Check environment variables:**

```bash
# .env.local
NEXT_PUBLIC_MAGIC_API_KEY=pk_live_XXXXXXXXXXXX
```

**3. Popup blocked:**

```typescript
try {
  const user = await socialLogin.login('google')
} catch (error) {
  if (error.message.includes('popup')) {
    showNotification('Please allow popups for this site to use social login.')
  }
}
```

### OAuth Configuration

Ensure OAuth credentials are correctly configured in the Magic.link dashboard:

| Provider | Required Config |
|----------|----------------|
| Google | OAuth 2.0 Client ID + Client Secret |
| X (Twitter) | API Key + API Secret + Bearer Token |
| GitHub | OAuth App Client ID + Client Secret |
| Discord | Client ID + Client Secret |
| Apple | Services ID + Key ID + Team ID |

---

## 💧 Memory Leaks in React

### Proper Cleanup in useEffect

**❌ Wrong — no cleanup:**

```typescript
useEffect(() => {
  cinaconnect.on('accountsChanged', (accounts) => {
    setAccounts(accounts)
  })
  // Missing cleanup! Listener persists after unmount
}, [])
```

**✅ Correct — with cleanup:**

```typescript
useEffect(() => {
  const handleAccountsChanged = (accounts: string[]) => {
    setAccounts(accounts)
  }

  cinaconnect.on('accountsChanged', handleAccountsChanged)

  return () => {
    cinaconnect.off('accountsChanged', handleAccountsChanged)
  }
}, [])
```

### Multiple Listeners

```typescript
useEffect(() => {
  const handlers = {
    accountsChanged: (accounts: string[]) => setAccounts(accounts),
    chainChanged: (chainId: string) => setChain(parseInt(chainId, 16)),
    disconnect: (error: Error) => setConnected(false),
  }

  // Register all listeners
  Object.entries(handlers).forEach(([event, handler]) => {
    cinaconnect.on(event, handler)
  })

  // Cleanup all listeners
  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      cinaconnect.off(event, handler)
    })
  }
}, [])
```

### React StrictMode Double-Render

In development, React 18+ StrictMode renders components twice. Ensure your provider initialization is idempotent:

```typescript
// Use useRef to prevent double initialization
const providerRef = useRef<CinaConnect | null>(null)

if (!providerRef.current) {
  providerRef.current = new CinaConnect(config)
}
```

---

## ⚡ Performance Issues

### Lazy Loading

Only load CinaConnect when needed:

```tsx
import dynamic from 'next/dynamic'

// Lazy load the connect button — not rendered on first paint
const ConnectButton = dynamic(
  () => import('./ConnectButton'),
  { ssr: false, loading: () => <Skeleton /> }
)

function Header() {
  return (
    <header>
      <Logo />
      <nav>...</nav>
      <ConnectButton />
    </header>
  )
}
```

### Code Splitting

Split CinaConnect into its own chunk:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          cinaconnect: ['@cinaconnect/react', '@cinaconnect/core'],
        },
      },
    },
  },
})
```

### Reduce Bundle Size

```bash
# Analyze bundle
npx vite-bundle-visualizer

# Check which CinaConnect packages are pulling in dependencies
npm ls @cinaconnect/core
```

**Tips:**
- Only import what you need: `import { useOnux } from '@cinaconnect/react'` not `import * as CinaConnect from '@cinaconnect/react'`
- Use tree-shaking friendly imports
- Consider using the lightweight `@cinaconnect/core` without UI components if building custom UI

---

## 🚀 Deployment Issues

### Helm Installation Failing

```bash
# Lint the chart before installing
helm lint ./deploy/helm/cinaconnect

# Dry-run to see what would be deployed
helm install cinaconnect ./deploy/helm/cinaconnect \
  --namespace cinaconnect \
  --create-namespace \
  --dry-run

# Check required values
helm show values ./deploy/helm/cinaconnect
```

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n cinaconnect

# Describe for events
kubectl describe pod <pod-name> -n cinaconnect

# View logs
kubectl logs <pod-name> -n cinaconnect --tail=100

# View previous container logs (CrashLoopBackOff)
kubectl logs <pod-name> -n cinaconnect --previous
```

| Status | Cause | Fix |
|--------|-------|-----|
| `Pending` | Insufficient resources | Scale cluster or reduce resource requests |
| `Pending` | PVC not bound | Check StorageClass exists |
| `CrashLoopBackOff` | Config error | Check logs, fix config |
| `ImagePullBackOff` | Invalid image | Verify image name and tag |
| `OOMKilled` | Memory limit too low | Increase memory limit in values.yaml |

### Relay Server Won't Start

```bash
# Check relay pods
kubectl logs -l app=relay -n cinaconnect --tail=100

# Verify NATS connectivity
kubectl exec -it <nats-pod> -n cinaconnect -- nats-server --version

# Check relay config
kubectl get configmap relay-config -n cinaconnect -o yaml
```

---

## 📊 Monitoring & Observability

### Enable Analytics

```typescript
const config = {
  projectId: 'your-project-id',
  relayUrl: 'wss://relay.cinaconnect.com/v1',
  chains: [mainnet],
  analytics: {
    enabled: true,
    endpoint: 'https://analytics.cinaconnect.com/v1',
  },
}
```

### Error Tracking Integration

**Sentry:**

```typescript
import * as Sentry from '@sentry/react'
import { CinaConnect } from '@cinaconnect/core'

cinaconnect.on('error', (error) => {
  Sentry.captureException(error, {
    tags: {
      error_code: error.code,
      component: 'cinaconnect',
    },
  })
})
```

**Custom Event Tracking:**

```typescript
cinaconnect.on('connect', (session) => {
  analytics.track('wallet_connected', {
    wallet: session.wallet.name,
    chain: session.chain.id,
    method: session.connectionType,
  })
})
```

---

## 📞 Getting Help

If you're still stuck:

1. **Check logs** — Enable `debug: true` for verbose output
2. **Search GitHub Issues** — [cinaconnect/cinaconnect/issues](https://github.com/cinaconnect/cinaconnect/issues)
3. **Error codes** — See [Error Code Reference](./error-codes.md)
4. **Community** — Join CinaConnect community channels

```typescript
// Maximum debug configuration
const config = {
  projectId: 'your-project-id',
  relayUrl: 'wss://relay.cinaconnect.com/v1',
  chains: [mainnet],
  debug: true,
  logger: {
    level: 'trace', // most verbose
    output: 'console',
  },
}
```

---

*Troubleshooting Guide — CinaConnect Documentation*

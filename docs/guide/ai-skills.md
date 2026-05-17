# AI Skills Integration

CinaConnect provides AI-assisted development tools through the CLI.

## Quick Start

```bash
# Install the CLI
npm install -g @cinaconnect/cli

# Add AI skills to your project
npx @cinaconnect/cli skills add
```

## Supported AI Platforms

### Claude Code

```bash
npx @cinaconnect/cli skills add --platform claude
```

Adds CinaConnect skills to Claude's skill registry for:
- Wallet connection patterns
- Multi-chain configuration
- Smart account deployment
- Payment integration

### Cursor

```bash
npx @cinaconnect/cli skills add --platform cursor
```

Installs `.cursorrules` with CinaConnect best practices.

### GitHub Copilot

```bash
npx @cinaconnect/cli skills add --platform copilot
```

Generates `copilot-instructions.md` with CinaConnect patterns.

## Available Skills

| Skill | Description |
|-------|-------------|
| `wallet-connection` | Best practices for wallet connection flows |
| `multi-chain` | Configure and switch between multiple chains |
| `smart-accounts` | Deploy and manage ERC-4337 smart accounts |
| `siwe-auth` | Implement Sign-In With Ethereum |
| `payments` | Integrate swaps, on-ramp, and pay features |
| `custom-connectors` | Build custom wallet connectors |

## Code Patterns

### Wallet Connection

```tsx
// AI will suggest this pattern:
import { useCinaConnect, useCinaConnectAccount } from '@cinaconnect/react';

function ConnectFlow() {
  const { open } = useCinaConnect();
  const { address, isConnected } = useCinaConnectAccount();
  return isConnected
    ? <p>Connected: {address}</p>
    : <button onClick={() => open()}>Connect</button>;
}
```

### Multi-Chain

```tsx
import { useCinaConnectNetwork } from '@cinaconnect/react';

function NetworkSwitcher() {
  const { chain, switchNetwork } = useCinaConnectNetwork();
  return (
    <select value={chain?.id} onChange={e => switchNetwork(parseInt(e.target.value))}>
      <option value={1}>Ethereum</option>
      <option value={42161}>Arbitrum</option>
      <option value={8453}>Base</option>
    </select>
  );
}
```

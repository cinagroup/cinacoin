# @cinaconnect/cdn

CDN bundle for CinaConnect — use ConnectButton and ConnectModal via `<script>` tag. No build tools required.

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>My dApp</title>
</head>
<body>
  <div id="connect-button"></div>
  <div id="connect-modal"></div>

  <!-- Configure before loading -->
  <script>
    window.CinaConnect = {
      projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
      theme: 'dark',
      primaryColor: '#6366F1',
      chains: [1, 10, 137],
    };
  </script>

  <!-- Load CDN bundle -->
  <script src="https://cdn.cinaconnect.dev/connect.js"></script>

  <!-- Render components -->
  <script>
    // Render a ConnectButton
    CinaConnect.renderConnectButton('#connect-button', {
      size: 'lg',
      label: 'Connect',
      onConnect: (address) => console.log('Connected:', address),
      onDisconnect: () => console.log('Disconnected'),
    });

    // Render a ConnectModal
    CinaConnect.renderConnectModal('#connect-modal', {
      wallets: [
        { id: 'metamask', name: 'MetaMask', installed: true },
        { id: 'walletconnect', name: 'WalletConnect' },
      ],
      onConnect: (address) => console.log('Connected:', address),
    });

    // Control modal programmatically
    CinaConnect.showModal();
    CinaConnect.hideModal();
    CinaConnect.toggleModal();
  </script>
</body>
</html>
```

## Configuration

Set `window.CinaConnect` before loading the script:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectId` | `string` | — | WalletConnect Project ID (required) |
| `theme` | `'light' \| 'dark'` | `'light'` | Theme mode |
| `primaryColor` | `string` | `'#6366F1'` | Custom primary color |
| `chains` | `number[]` | `[1]` | Supported chain IDs |
| `metadata` | `object` | — | dApp metadata (name, description, url, icons) |

## API Reference

### ConnectButton

```ts
CinaConnect.renderConnectButton(selector: string, options?: ConnectButtonOptions): void
```

Options:
- `projectId` — WalletConnect Project ID
- `theme` — `'light' | 'dark'`
- `primaryColor` — Custom color
- `size` — `'sm' | 'md' | 'lg'`
- `variant` — `'primary' | 'outline'`
- `label` — Custom button text
- `onConnect(address)` — Callback on connect
- `onDisconnect()` — Callback on disconnect

### ConnectModal

```ts
CinaConnect.renderConnectModal(selector: string, options?: ConnectModalOptions): void
```

Options:
- `projectId` — WalletConnect Project ID
- `theme` — `'light' | 'dark'`
- `primaryColor` — Custom color
- `defaultView` — `'connect' | 'connecting' | 'connected' | 'networks'`
- `wallets` — Array of wallet definitions
- `chains` — Supported chain IDs
- `onConnect(address)` — Callback on connect
- `onClose()` — Callback on close

### Modal Controls

```ts
CinaConnect.showModal(): void
CinaConnect.hideModal(): void
CinaConnect.toggleModal(): void
CinaConnect.getModalView(): string
```

### State

```ts
CinaConnect.getButtonState(): string        // 'disconnected' | 'connecting' | 'connected'
CinaConnect.getButtonAddress(): string|null // Connected wallet address
CinaConnect.disconnect(): void              // Disconnect wallet
```

### Module Loader (Advanced)

For lazy-loading additional CinaConnect modules:

```ts
CinaConnect.loadModule('pay-ui', () => import('/pay-ui.js'))
CinaConnect.isLoaded('pay-ui')
CinaConnect.getModule('pay-ui')
CinaConnect.clearCache()
```

## CDN URLs

| File | Format | Description |
|------|--------|-------------|
| `connect.js` | IIFE | Browser-ready bundle |
| `connect.mjs` | ESM | ES module bundle |

## License

MIT

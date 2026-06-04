# Cinacoin Flutter Demo

A comprehensive Flutter demo app showcasing the **Cinacoin Flutter SDK** — a self-hosted wallet connection toolkit and Reown/WalletConnect replacement for Flutter apps.

## Features Demonstrated

### 🏠 Home Screen
- Connection status overview with live state updates
- Account information display with truncated addresses
- Native token balance fetching via RPC
- Quick action shortcuts for common operations
- SDK version and chain support info

### 🔗 Connect Screen
- Full WalletConnect v2 pairing flow
- QR code display for wallet scanning
- Wallet list with 16+ supported wallets (MetaMask, Rainbow, Phantom, etc.)
- Connect/disconnect lifecycle management
- Session state streaming via `sdk.stateChanges`

### 🔀 Chain Screen
- 12 supported chains: Ethereum, Polygon, Arbitrum, Optimism, Solana, Bitcoin, TRON, Cosmos, NEAR, Sui, Starknet, Hedera, XRPL, Polkadot
- Active chain details (ID, name, symbol, explorer, type)
- Chain switching via `sdk.switchChain()`
- EVM vs non-EVM chain categorization

### ✍️ Sign Screen
- **EIP-191** personal message signing (`personal_sign`)
- **EIP-712** typed data signing (`signTypedData_v4`)
- Sample typed data payload pre-loaded
- Signature display with copy-to-clipboard
- Real-time signing status feedback

### 💸 Send Screen
- ETH/token transfer form with recipient and amount
- Multi-chain target selection dropdown
- Gas fee estimation via RPC (`eth_gasPrice`, `eth_estimateGas`)
- Transaction submission via WalletConnect (`eth_sendTransaction`)
- Transaction polling for confirmation status
- Block explorer link (auto-generated per chain)

## Architecture

```
apps/demo-flutter/
├── lib/
│   ├── main.dart                 # App entry, SDK init, MaterialApp, bottom nav
│   ├── screens/
│   │   ├── home_screen.dart      # Dashboard with status, accounts, balance
│   │   ├── connect_screen.dart   # WalletConnect pairing & session management
│   │   ├── chain_screen.dart     # Chain registry & switching
│   │   ├── sign_screen.dart      # EIP-191 & EIP-712 signing
│   │   └── transaction_screen.dart # TX form, estimation, polling
│   └── widgets/
│       ├── status_card.dart      # Connection status card
│       ├── info_row.dart         # Label-value info row
│       └── wallet_tile.dart      # Wallet list tile
├── pubspec.yaml
└── README.md
```

## SDK Integration Points

| Demo Feature | SDK Method |
|---|---|
| Initialize | `CinacoinSdk.initialize()` |
| Create Pairing | `sdk.createPairing()` |
| Disconnect | `sdk.disconnect()` |
| State Updates | `sdk.stateChanges` stream |
| Accounts | `sdk.accounts` |
| Balance | `sdk.getBalance()` |
| Switch Chain | `sdk.switchChain()` |
| Personal Sign | `sdk.personalSign()` |
| Typed Sign | `sdk.signTypedDataV4()` |
| Estimate Fee | `sdk.estimateFee()` |
| Send TX | `sdk.sendViaWalletConnect()` |
| Poll TX | `sdk.pollTransaction()` |
| Chain Registry | `sdk.getSupportedChains()` / `sdk.getChainConfig()` |

## Setup

### Prerequisites

- **Flutter 3.16+** (`flutter --version`)
- **Dart 3.2+** (`dart --version`)
- A **WalletConnect v2 project ID** (free at https://cloud.walletconnect.com)

### Installation

```bash
# Navigate to the demo app
cd apps/demo-flutter

# Get dependencies (includes local cinacoin SDK)
flutter pub get

# Run the app
flutter run
```

### Configuration

Open `lib/main.dart` and replace `YOUR_PROJECT_ID` with your actual WalletConnect project ID:

```dart
await sdk.initialize(
  projectId: 'YOUR_PROJECT_ID',  // ← Replace this
  metadata: const AppMetadata(
    name: 'Cinacoin Demo',
    description: 'Cinacoin Flutter SDK Demo App',
    url: 'https://cinacoin.dev',
  ),
);
```

## Theme Support

The demo app includes **dark and light themes** toggleable via the sun/moon icon in the app bar. Both themes use the Inter font via `google_fonts`.

## License

Apache-2.0 — See the root project LICENSE.

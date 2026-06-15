# Cinacoin Cross-Platform API Naming Specification

**Version:** 1.0.0  
**Last Updated:** 2026-06-15  
**Status:** Active

---

## Executive Summary

This document defines the unified API naming conventions and standards for the Cinacoin SDK across all supported platforms (iOS Swift, Android Kotlin, Flutter Dart, Unity C#, .NET C#, TypeScript). The goal is to ensure consistency, reduce cognitive load for multi-platform developers, and maintain a cohesive developer experience.

---

## 1. Core Principles

### 1.1 Naming Conventions

| Aspect | Convention | Example |
|--------|-----------|---------|
| **Method names** | camelCase (all platforms) | `connect()`, `signMessage()`, `getBalance()` |
| **Class/Struct names** | PascalCase | `CinacoinSDK`, `WalletConnectManager`, `ChainConfig` |
| **Constants** | UPPER_SNAKE_CASE (all platforms) | `DEFAULT_CHAIN_ID`, `MAX_RETRY_COUNT` |
| **Private members** | Prefix with underscore (where language supports) | `_internalState`, `_cache` |
| **Events** | camelCase, past tense for completed actions | `connected`, `disconnected`, `chainChanged` |

### 1.2 Async Patterns

| Platform | Pattern | Example |
|----------|---------|---------|
| **iOS Swift** | `async throws` | `func connect() async throws -> ConnectionResult` |
| **Android Kotlin** | `suspend` functions | `suspend fun connect(): ConnectionResult` |
| **Flutter Dart** | `Future<T>` | `Future<ConnectionResult> connect()` |
| **Unity C#** | `Task<T>` / `async` | `async Task<ConnectionResult> ConnectAsync()` |
| **.NET C#** | `Task<T>` / `async` | `async Task<ConnectionResult> ConnectAsync()` |
| **TypeScript** | `Promise<T>` | `async connect(): Promise<ConnectionResult>` |

**Naming suffix:**
- Unity/.NET: Append `Async` to method names (e.g., `ConnectAsync()`)
- All other platforms: No suffix (e.g., `connect()`)

---

## 2. Standardized API Methods

### 2.1 Initialization

| Platform | Method Signature |
|----------|------------------|
| **iOS** | `func configure(projectId: String, metadata: AppMetadata) throws` |
| **Android** | `fun initialize(context: Context, config: CinacoinConfig)` |
| **Flutter** | `Future<void> init({required String projectId, AppMetadata? metadata})` |
| **Unity** | `Task InitializeAsync(string projectId, AppMetadata metadata)` |
| **.NET** | `Task InitializeAsync(string projectId, AppMetadata metadata)` |
| **TypeScript** | `initialize(config: ConnectorConfig): void` |

**Standard parameters:**
- `projectId` (String, required): Cinacoin infrastructure project ID
- `metadata` (AppMetadata, optional): Application metadata for WalletConnect pairing
- `context` (Android only, required): Android Context for system services

### 2.2 Connection

| Platform | Method Signature |
|----------|------------------|
| **iOS** | `func connect(walletId: String?, chains: [Int]?) async throws -> ConnectionResult` |
| **Android** | `suspend fun connect(connectorId: String): ConnectionResult` |
| **Flutter** | `Future<ConnectionResult> createPairing({String? walletId})` |
| **Unity** | `Task<ConnectionResult> ConnectAsync(string walletId)` |
| **.NET** | `Task<ConnectionResult> CreatePairingAsync()` |
| **TypeScript** | `async connect(chainId: string, options?: ConnectOptions): Promise<ConnectionResult>` |

**Standardized signature (recommended):**
```
connect(options?: ConnectOptions): Promise<ConnectionResult>
```

**ConnectOptions:**
```typescript
interface ConnectOptions {
  walletId?: string;        // Specific wallet to connect (e.g., "metamask", "rainbow")
  chainId?: string;         // CAIP-2 chain ID (e.g., "eip155:1")
  chains?: string[];        // Multiple chains to connect
  timeout?: number;         // Connection timeout in milliseconds
  persist?: boolean;        // Whether to persist session
}
```

**ConnectionResult:**
```typescript
interface ConnectionResult {
  sessionId: string;        // Unique session identifier
  chainId: string;          // CAIP-2 chain ID
  accounts: string[];       // Connected account addresses
  connectorId: string;      // Wallet/connector identifier
  connectedAt: number;      // Timestamp (ms since epoch)
}
```

### 2.3 Disconnection

| Platform | Method Signature |
|----------|------------------|
| **iOS** | `func disconnect() async throws` |
| **Android** | `suspend fun disconnect()` |
| **Flutter** | `Future<void> disconnect({String? topic})` |
| **Unity** | `Task DisconnectAsync(string sessionId)` |
| **.NET** | `Task DisposeAsync()` |
| **TypeScript** | `async disconnect(chainId?: string): Promise<void>` |

**Standardized signature (recommended):**
```
disconnect(chainId?: string): Promise<void>
```

### 2.4 Message Signing

#### personal_sign (EIP-191)

| Platform | Method Signature |
|----------|------------------|
| **iOS** | `func personalSign(message: String) async throws -> SignatureResult` |
| **Android** | `suspend fun personalSign(message: String, address: String?): SignatureResult` |
| **Flutter** | `Future<SignatureResult> personalSign(String message, {String? address})` |
| **Unity** | `Task<SignatureResult> PersonalSignAsync(string message)` |
| **.NET** | `Task<SignatureResult> SendRequestAsync("personal_sign", params)` |
| **TypeScript** | `async signMessage(message: string, chainId?: string): Promise<SignatureResult>` |

**Standardized signature (recommended):**
```
signMessage(message: string, options?: SignOptions): Promise<SignatureResult>
```

**SignatureResult:**
```typescript
interface SignatureResult {
  signature: string;        // Hex-encoded signature (0x-prefixed)
  address: string;          // Signer address
  method: string;           // Signing method used (e.g., "personal_sign")
  chainId: string;          // CAIP-2 chain ID
}
```

#### eth_signTypedData_v4 (EIP-712)

| Platform | Method Signature |
|----------|------------------|
| **iOS** | `func signTypedData(typedDataJson: String) async throws -> SignatureResult` |
| **Android** | `suspend fun signTypedData(typedDataJson: String, address: String?): SignatureResult` |
| **Flutter** | `Future<SignatureResult> signTypedDataV4(TypedData typedData)` |
| **Unity** | `Task<SignatureResult> SignTypedDataAsync(string typedDataJson)` |
| **.NET** | N/A |
| **TypeScript** | N/A |

**Standardized signature (recommended):**
```
signTypedData(typedData: TypedData | string, options?: SignOptions): Promise<SignatureResult>
```

### 2.5 Transaction Sending

| Platform | Method Signature |
|----------|------------------|
| **iOS** | `func sendTransaction(_ tx: TransactionRequest) async throws -> String` |
| **Android** | `suspend fun sendTransaction(params: TransactionParams): String` |
| **Flutter** | `Future<String> sendTransaction(TransactionRequest tx)` |
| **Unity** | `Task<string> SendTransactionAsync(TransactionRequest tx)` |
| **.NET** | `Task<string> SendRequestAsync("eth_sendTransaction", params)` |
| **TypeScript** | `async signTransaction(tx: TransactionRequest, chainId?: string): Promise<TxResult>` |

**Standardized signature (recommended):**
```
sendTransaction(tx: TransactionRequest, options?: TxOptions): Promise<TxResult>
```

**TransactionRequest:**
```typescript
interface TransactionRequest {
  from: string;             // Sender address
  to: string;               // Recipient address
  value?: string;           // Wei amount (hex string)
  data?: string;            // Calldata (hex string)
  gas?: string;             // Gas limit (hex string)
  gasPrice?: string;        // Gas price (hex string, legacy)
  maxFeePerGas?: string;    // Max fee (EIP-1559)
  maxPriorityFeePerGas?: string; // Priority fee (EIP-1559)
  nonce?: string;           // Transaction nonce
  chainId?: string;         // CAIP-2 chain ID
}
```

**TxResult:**
```typescript
interface TxResult {
  hash: string;             // Transaction hash
  chainId: string;          // CAIP-2 chain ID
  from: string;             // Sender address
  to?: string;              // Recipient address
  raw?: string;             // Raw signed transaction
  broadcast: boolean;       // Whether broadcast was successful
}
```

### 2.6 Balance Query

| Platform | Method Signature |
|----------|------------------|
| **iOS** | `func fetchBalance(address: String?, chainId: Int?) async throws -> String` |
| **Android** | `suspend fun fetchBalance(address: String, chainId: Int?): String` |
| **Flutter** | N/A (via adapter) |
| **Unity** | Via EvmAdapter |
| **.NET** | N/A |
| **TypeScript** | `async getBalance(address?: string, chainId?: string): Promise<BalanceResult>` |

**Standardized signature (recommended):**
```
getBalance(address?: string, chainId?: string): Promise<BalanceResult>
```

**BalanceResult:**
```typescript
interface BalanceResult {
  address: string;          // Queried address
  balance: string;          // Balance in smallest unit (wei, lamports, etc.)
  formatted: string;        // Human-readable formatted balance
  symbol: string;           // Native currency symbol
  chainId: string;          // CAIP-2 chain ID
}
```

### 2.7 Chain Switching

| Platform | Method Signature |
|----------|------------------|
| **iOS** | `func switchChain(chainId: Int) async throws -> Bool` |
| **Android** | `suspend fun switchChain(chainId: Int): Boolean` |
| **Flutter** | `Future<bool> switchChain(int chainId)` |
| **Unity** | `Task<bool> SwitchChainAsync(string sessionId, int chainId)` |
| **.NET** | `Task<bool> SendRequestAsync("wallet_switchEthereumChain", params)` |
| **TypeScript** | `async switchChain(chainId: string): Promise<void>` |

**Standardized signature (recommended):**
```
switchChain(chainId: string): Promise<void>
```

---

## 3. Chain ID Standardization

### 3.1 Format

**Standard:** CAIP-2 (Chain Agnostic Improvement Proposal 2)

**Format:** `{namespace}:{reference}`

**Examples:**
- Ethereum Mainnet: `eip155:1`
- Polygon: `eip155:137`
- Solana Mainnet: `solana:mainnet` (or `solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ`)
- Bitcoin Mainnet: `bip122:000000000019d6689c085ae165831e93`

### 3.2 Conversion Utilities

```typescript
// Convert integer chain ID to CAIP-2
function toCAIP2(namespace: string, chainId: number): string {
  return `${namespace}:${chainId}`;
}

// Parse CAIP-2 string
function parseCAIP2(caip2: string): { namespace: string; reference: string } {
  const [namespace, reference] = caip2.split(':');
  return { namespace, reference };
}

// Convert CAIP-2 to hex (for EVM RPC calls)
function caip2ToHex(caip2: string): string {
  const { namespace, reference } = parseCAIP2(caip2);
  if (namespace !== 'eip155') throw new Error('Not an EVM chain');
  return `0x${parseInt(reference).toString(16)}`;
}
```

---

## 4. Event System

### 4.1 Standard Events

| Event Name | Payload Type | Description |
|------------|--------------|-------------|
| `connect` | `ConnectEventPayload` | Emitted when a wallet connection is established |
| `disconnect` | `DisconnectEventPayload` | Emitted when disconnected from wallet |
| `chainChanged` | `ChainChangedEventPayload` | Emitted when active chain changes |
| `accountsChanged` | `AccountsChangedEventPayload` | Emitted when connected accounts change |
| `error` | `ErrorEventPayload` | Emitted on error conditions |

### 4.2 Event Payloads

```typescript
interface ConnectEventPayload {
  chainId: string;
  accounts: string[];
  adapterId: string;
}

interface DisconnectEventPayload {
  chainId: string;
  reason?: string;
}

interface ChainChangedEventPayload {
  chainId: string;
  previousChainId: string;
}

interface AccountsChangedEventPayload {
  chainId: string;
  accounts: string[];
  previousAccounts: string[];
}

interface ErrorEventPayload {
  code: string;
  message: string;
  details?: unknown;
}
```

### 4.3 Event Listener API

```typescript
// Register listener
on(event: string, callback: EventHandler): void;

// Remove listener
off(event: string, callback: EventHandler): void;

// One-time listener
once(event: string, callback: EventHandler): void;
```

---

## 5. Error Handling

### 5.1 Error Codes

| Code | Name | Description |
|------|------|-------------|
| `NOT_INITIALIZED` | NotInitialized | SDK not configured |
| `NOT_CONNECTED` | NotConnected | No active wallet connection |
| `USER_REJECTED` | UserRejected | User rejected the request |
| `TIMEOUT` | Timeout | Operation timed out |
| `CHAIN_NOT_SUPPORTED` | ChainNotSupported | Chain not supported |
| `WALLET_NOT_FOUND` | WalletNotFound | Wallet not installed |
| `SIGNING_FAILED` | SigningFailed | Signature operation failed |
| `TRANSACTION_FAILED` | TransactionFailed | Transaction failed |
| `NETWORK_ERROR` | NetworkError | Network connectivity issue |
| `INVALID_PARAMS` | InvalidParams | Invalid parameters provided |

### 5.2 Error Structure

```typescript
interface CinacoinError {
  code: string;           // Error code (see table above)
  message: string;        // Human-readable error message
  details?: unknown;      // Additional error context
}
```

---

## 6. Platform-Specific Adaptations

### 6.1 iOS Swift

- Use `async throws` for all async operations
- Return types should be non-optional where possible
- Use `Sendable` for thread-safe types
- Follow Swift API Design Guidelines

### 6.2 Android Kotlin

- Use `suspend` functions for coroutines
- Use `StateFlow` for reactive state
- Accept `Context` parameter in initialization
- Follow Kotlin Coding Conventions

### 6.3 Flutter Dart

- Use `Future<T>` for async operations
- Use `Stream` for event streams
- Accept named parameters for optional arguments
- Follow Effective Dart guidelines

### 6.4 Unity C#

- Use `Task<T>` and `async/await`
- Append `Async` suffix to async methods
- Use `CancellationToken` for cancellation support
- Follow Microsoft C# Coding Conventions

### 6.5 .NET C#

- Use `Task<T>` and `async/await`
- Append `Async` suffix to async methods
- Implement `IAsyncDisposable` for cleanup
- Follow .NET Framework Design Guidelines

### 6.6 TypeScript

- Use `Promise<T>` for async operations
- Use `async/await` syntax
- Export all public types and interfaces
- Follow TypeScript Handbook conventions

---

## 7. Migration Guide

### 7.1 From Legacy API

**Old (inconsistent):**
```typescript
// iOS
configure(projectId: String, metadata: AppMetadata)
connect(walletId: String?, chains: [Int]?)

// Android
initialize(context: Context, config: CinacoinConfig)
connect(connectorId: String)

// Flutter
init()
createPairing()
```

**New (standardized):**
```typescript
// All platforms
initialize(config: CinacoinConfig)
connect(options?: ConnectOptions): Promise<ConnectionResult>
```

### 7.2 Breaking Changes

| Old API | New API | Migration Notes |
|---------|---------|-----------------|
| `configure()` | `initialize()` | Renamed for consistency |
| `createPairing()` | `connect()` | Unified connection API |
| `personalSign()` | `signMessage()` | Simplified naming |
| `signTypedData()` | `signTypedData()` | No change |
| `fetchBalance()` | `getBalance()` | Simplified naming |
| Integer chain IDs | CAIP-2 strings | Use conversion utilities |

---

## 8. Examples

### 8.1 Basic Connection Flow

```typescript
// Initialize
const sdk = new CinacoinSDK();
await sdk.initialize({
  projectId: 'your-project-id',
  metadata: {
    name: 'My App',
    description: 'Example dApp',
    url: 'https://example.com',
    icons: ['https://example.com/icon.png']
  }
});

// Connect
const result = await sdk.connect({
  walletId: 'metamask',
  chainId: 'eip155:1',
  timeout: 30000
});

console.log('Connected:', result.accounts);

// Sign message
const signature = await sdk.signMessage('Hello, Cinacoin!');
console.log('Signature:', signature.signature);

// Send transaction
const tx = await sdk.sendTransaction({
  from: result.accounts[0],
  to: '0x1234...',
  value: '0xde0b6b3a7640000' // 1 ETH in wei
});
console.log('Tx hash:', tx.hash);

// Disconnect
await sdk.disconnect();
```

### 8.2 Event Handling

```typescript
// Listen for connection events
sdk.on('connect', (payload) => {
  console.log('Connected to', payload.chainId);
  console.log('Accounts:', payload.accounts);
});

sdk.on('disconnect', (payload) => {
  console.log('Disconnected:', payload.reason);
});

sdk.on('chainChanged', (payload) => {
  console.log('Switched from', payload.previousChainId, 'to', payload.chainId);
});

sdk.on('error', (error) => {
  console.error('Error:', error.code, error.message);
});
```

---

## 9. Compliance Checklist

When implementing or updating a platform SDK, verify:

- [ ] Method names follow camelCase convention
- [ ] Async methods use platform-appropriate patterns
- [ ] Chain IDs use CAIP-2 format
- [ ] Return types match standardized interfaces
- [ ] Events follow standard naming and payload structure
- [ ] Error codes use standardized error types
- [ ] Documentation includes code examples
- [ ] Migration guide is provided for breaking changes

---

## 10. Versioning

This specification follows Semantic Versioning (SemVer):

- **Major version**: Breaking changes to API signatures
- **Minor version**: New methods or optional parameters
- **Patch version**: Clarifications or documentation updates

**Current version:** 1.0.0

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **CAIP-2** | Chain Agnostic Improvement Proposal 2 - standard for chain ID format |
| **EIP-191** | Ethereum Improvement Proposal 191 - personal_sign standard |
| **EIP-712** | Ethereum Improvement Proposal 712 - typed structured data signing |
| **WalletConnect** | Open protocol for wallet-dApp communication |
| **Session** | Persistent connection between dApp and wallet |
| **Pairing** | Initial handshake to establish a session |

---

## Appendix B: References

- [CAIP-2 Specification](https://chainagnostic.org/CAIPs/caip-2)
- [EIP-191: Signature Validator](https://eips.ethereum.org/EIPS/eip-191)
- [EIP-712: Typed Structured Data](https://eips.ethereum.org/EIPS/eip-712)
- [WalletConnect v2 Protocol](https://docs.walletconnect.com/2.0/specs/clients/core/pairing/data-structures)
- [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/)
- [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- [Effective Dart](https://dart.dev/effective-dart)
- [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)

---

**Document maintained by:** Cinacoin SDK Team  
**Contact:** sdk@cinacoin.com  
**Repository:** https://github.com/cinacoin/cinacoin-sdk

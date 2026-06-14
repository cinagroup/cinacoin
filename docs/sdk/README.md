# AppKit SDK Documentation

Welcome to the Cinacoin AppKit SDK documentation. AppKit provides a unified interface for wallet connection, authentication, and smart account management across iOS, Android, and Flutter platforms.

## Platform Guides

### [iOS SDK](./ios/getting-started.md)

Native Swift implementation for iOS 15.0+ apps.

- [Getting Started](./ios/getting-started.md)
- [Wallet Connection](./ios/wallet-connection.md)
- [Authentication](./ios/authentication.md)
- [Smart Accounts](./ios/smart-accounts.md)

### [Android SDK](./android/getting-started.md)

Native Kotlin implementation with Jetpack Compose support.

- [Getting Started](./android/getting-started.md)
- [Wallet Connection](./android/wallet-connection.md)
- [Authentication](./android/authentication.md)
- [Smart Accounts](./android/smart-accounts.md)

### [Flutter SDK](./flutter/getting-started.md)

Cross-platform Dart implementation for Flutter apps.

- [Getting Started](./flutter/getting-started.md)
- [Wallet Connection](./flutter/wallet-connection.md)
- [Authentication](./flutter/authentication.md)
- [Smart Accounts](./flutter/smart-accounts.md)

## Core Features

### Wallet Connection

Connect to 300+ wallets with a unified interface. Support for popular wallets including MetaMask, Trust Wallet, Rainbow, and more.

### Authentication

Social login (Google, GitHub, Discord, Apple) and email-based authentication with secure token management.

### Smart Accounts

Create and manage ERC-4337 smart accounts with gas sponsorship, batched transactions, and session keys.

## Quick Start

Choose your platform and follow the getting started guide:

**iOS:**

```swift
pod 'CinacoinAppKit', '~> 1.0.0'
```

**Android:**

```kotlin
implementation("io.cinacoin:appkit:1.0.0")
```

**Flutter:**

```yaml
dependencies:
  cinacoin_appkit: ^1.0.0
```

## Examples

Complete working examples for each platform are available in the [examples](./examples/) directory:

- [iOS Example](./examples/ios/)
- [Android Example](./examples/android/)
- [Flutter Example](./examples/flutter/)

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/cinagroup/cinacoin-sdk/issues)
- Documentation: [https://docs.cinacoin.io](https://docs.cinacoin.io)
- Discord: [Join our developer community](https://discord.gg/cinacoin)

## License

MIT License - see LICENSE file for details.

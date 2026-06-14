# CHANGELOG

All notable changes to the Cinacoin Android SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-03

### Added
- Initial release of the Cinacoin Wallet SDK for Android
- Cinacoin v2 integration (`com.walletconnect:android-core`, `com.walletconnect:sign`)
- EVM chain support for wallet operations
- EncryptedSharedPreferences for secure key storage (`androidx.security:security-crypto`)
- Jetpack Compose UI components (Material3)
- Kotlin coroutines support for async wallet operations
- kotlinx-serialization JSON support
- Maven Central publishing pipeline (Sonatype OSSRH)
- ProGuard consumer rules for library consumers
- Dokka API documentation generation
- Source and Javadoc JAR artifacts
- PGP signing for Maven Central releases

### Configuration
- Minimum SDK: Android 8.0 (API 26)
- Compile SDK: 34
- JVM Target: 17
- Compose enabled with Compose BOM 2024.06.00

### Dependencies
| Dependency | Version |
|---|---|
| Cinacoin Android Core | 1.19.2 |
| Cinacoin Sign | 1.19.2 |
| kotlinx-coroutines | 1.8.1 |
| kotlinx-serialization-json | 1.6.3 |
| security-crypto | 1.1.0-alpha06 |
| Compose BOM | 2024.06.00 |
| core-ktx | 1.13.1 |
| lifecycle-runtime-ktx | 2.8.4 |
| activity-compose | 1.9.1 |
| fragment-ktx | 1.8.2 |

---

[Unreleased]: https://github.com/cinacoin/sdk-android/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/cinacoin/sdk-android/releases/tag/v1.0.0

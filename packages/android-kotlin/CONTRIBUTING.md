# Contributing to Cinacoin Android SDK

Thank you for your interest in contributing to the Cinacoin Wallet SDK! This document covers the essentials.

## Getting Started

### Prerequisites
- **JDK 17** or higher
- **Android Studio** (Koala or later) or command-line SDK tools
- **Android SDK 34** (compile), **min SDK 26**
- **Kotlin 1.9.24**

### Setup

```bash
# Clone the repository
git clone https://github.com/cinacoin/sdk-android.git
cd sdk-android

# Build the library
./gradlew assembleRelease

# Run tests
./gradlew test

# Generate API docs
./gradlew dokkaHtml
```

## Project Structure

```
android-kotlin/
├── build.gradle.kts      # Library build config, publishing, Dokka
├── gradle.properties     # Publishing & signing configuration
├── consumer-rules.pro    # ProGuard rules for consumers
├── proguard-rules.pro    # ProGuard rules for the SDK itself
├── CHANGELOG.md          # Version history
├── CONTRIBUTING.md       # This file
├── README.md             # Documentation
└── src/
    ├── main/             # SDK source code
    └── test/             # Unit tests
```

## Development Workflow

### Branching
- `main` — stable releases
- `develop` — integration branch (if used)
- Feature branches — `feat/description`
- Fix branches — `fix/description`

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-chain wallet support
fix: resolve Cinacoin reconnection issue
docs: update API documentation for v1.0
build: update Kotlin version to 1.9.24
```

### Testing
- **Unit tests:** `./gradlew test`
- **Instrumented tests:** `./gradlew connectedAndroidTest`
- New features should include tests.

## Code Style

- Follow [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Use Android Studio's default code style
- Run `./gradlew ktlintCheck` (if linter is configured) before PRs

## Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Write or update tests
4. Update `CHANGELOG.md` with your changes
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to your branch (`git push origin feat/amazing-feature`)
7. Open a Pull Request against `main`

## Publishing (Maintainers)

To publish a new release to Maven Central:

1. Update `VERSION_NAME` in `gradle.properties` and `build.gradle.kts`
2. Update `CHANGELOG.md`
3. Tag the release: `git tag -a v1.0.0 -m "v1.0.0"`
4. Build and publish:
   ```bash
   ./gradlew clean assembleRelease dokkaJavadoc publishReleasePublicationToSonatypeRepository closeAndReleaseSonatypeStagingRepository
   ```

Required credentials (set via env vars or `~/.gradle/gradle.properties`):
- `OSSRH_USERNAME` / `ossrhUsername`
- `OSSRH_PASSWORD` / `ossrhPassword`
- `SIGNING_KEY_ID`, `SIGNING_KEY`, `SIGNING_PASSWORD`

## Reporting Issues

- **Bugs:** Open an issue with steps to reproduce, expected vs actual behavior
- **Feature requests:** Describe the use case and why it matters
- **Security:** Report security issues privately to `dev@cinacoin.com`

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

# Maestro E2E Tests for Cinacoin

Cross-platform end-to-end tests using Maestro for iOS, Android, and Flutter apps.

## Structure

```
e2e/maestro/
├── flows/                    # Main test flows
│   ├── complete_user_journey.yaml    # Full user workflow
│   ├── connect_wallet.yaml           # Basic connection
│   ├── send_transaction.yaml         # Transaction sending
│   ├── sign-message.yaml             # Message signing
│   ├── switch_chain.yaml             # Chain switching
│   ├── error_handling.yaml           # Error scenarios
│   ├── session_persistence.yaml      # Session restore
│   ├── multi_wallet_support.yaml     # Multiple wallets
│   ├── chain_switching.yaml          # Multi-chain tests
│   └── signing_variants.yaml         # Different sign methods
├── subflows/                 # Reusable test components
│   ├── launch.yaml
│   ├── connect_and_verify.yaml
│   └── disconnect_and_verify.yaml
└── Maestrofile              # Maestro configuration
```

## Running Tests

### All tests
```bash
maestro test flows/
```

### Specific test
```bash
maestro test flows/complete_user_journey.yaml
```

### With device selection
```bash
maestro test --device emulator-5554 flows/connect_wallet.yaml
```

## Test Coverage

- ✅ Wallet connection (MetaMask, WalletConnect, Coinbase, Rainbow, Trust)
- ✅ Message signing (personal_sign, eth_sign, signTypedData_v4)
- ✅ Transaction sending
- ✅ Chain switching (Ethereum, Polygon, Arbitrum, Optimism, BSC, Avalanche)
- ✅ Session persistence and auto-reconnect
- ✅ Error handling (invalid addresses, insufficient balance, network failures)
- ✅ Multi-wallet support
- ✅ UI state verification

## Platform Support

These tests work across:
- **iOS**: iPhone simulator or device
- **Android**: Emulator or physical device
- **Flutter**: Both iOS and Android targets

## CI Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run Maestro E2E Tests
  run: |
    maestro test flows/ --output results.xml
  env:
    MAESTRO_DEVICE: ${{ matrix.device }}
```

## Writing New Tests

1. Create a new `.yaml` file in `flows/`
2. Use `runFlow: subflows/launch.yaml` to start
3. Use meaningful IDs for UI elements (see `id:` in existing tests)
4. Add assertions with `assertVisible` / `assertNotVisible`
5. Use `inputText` for form fields
6. Use `tapOn` for buttons and interactive elements

## Troubleshooting

- **Element not found**: Ensure the app uses the correct `id` attributes
- **Timeout**: Increase timeout with `- waitToVisible: { timeout: 10000 }`
- **Platform differences**: Use conditional logic or separate flows per platform

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro CLI Reference](https://maestro.mobile.dev/cli/commands)
- [Testing Best Practices](https://maestro.mobile.dev/best-practices)

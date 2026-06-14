# Flutter SDK — Getting Started

## Requirements

- Flutter 3.13+
- Dart 3.1+
- iOS 15.0+ / Android API 24+
- A Cinacoin project ID ([get one here](https://cloud.cinacoin.io))

## Installation

Add the package to your `pubspec.yaml`:

```yaml
dependencies:
  cinacoin_appkit: ^1.0.0
  cinacoin_appkit_ui: ^1.0.0 # Optional: pre-built UI components
  cinacoin_appkit_auth: ^1.0.0 # Optional: authentication
  cinacoin_appkit_smart_account: ^1.0.0 # Optional: smart accounts
```

Or install via CLI:

```bash
flutter pub add cinacoin_appkit
flutter pub add cinacoin_appkit_ui
flutter pub add cinacoin_appkit_auth
flutter pub add cinacoin_appkit_smart_account
```

## Quick Start

### 1. Configure AppKit

Initialize in your `main()` function:

```dart
import 'package:cinacoin_appkit/cinacoin_appkit.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await CinacoinAppKit.configure(
    AppKitConfig(
      projectId: 'YOUR_PROJECT_ID',
      metadata: AppMetadata(
        name: 'My App',
        description: 'My App Description',
        url: 'https://myapp.com',
        icons: ['https://myapp.com/icon.png'],
      ),
      themeMode: ThemeMode.dark,
    ),
  );

  runApp(const MyApp());
}
```

### 2. Add Connect Button

```dart
import 'package:cinacoin_appkit_ui/cinacoin_appkit_ui.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: CinacoinConnectButton(
          onPressed: () => _showConnectSheet(context),
        ),
      ),
    );
  }

  void _showConnectSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CinacoinConnectSheet(
        onConnect: (wallet) {
          Navigator.pop(context);
          print('Connected: ${wallet.name}');
          print('Address: ${wallet.address}');
        },
        onError: (error) {
          print('Error: $error');
        },
      ),
    );
  }
}
```

### 3. Observe Connection State

```dart
import 'package:cinacoin_appkit/cinacoin_appkit.dart';

class WalletViewModel extends ChangeNotifier {
  final _appKit = CinacoinAppKit.instance;

  bool get isConnected => _appKit.isConnected;
  String? get address => _appKit.account?.address;
  String? get chainId => _appKit.chainId;

  WalletViewModel() {
    _appKit.onConnectionChange = (connected) {
      notifyListeners();
    };

    _appKit.onAccountChange = (account) {
      notifyListeners();
    };

    _appKit.onChainChange = (chainId) {
      notifyListeners();
    };
  }
}

// Use with Provider
class WalletScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => WalletViewModel(),
      child: Consumer<WalletViewModel>(
        builder: (context, vm, child) {
          if (vm.isConnected) {
            return Text('Connected: ${vm.address}');
          }
          return CinacoinConnectButton(onPressed: () { /* ... */ });
        },
      ),
    );
  }
}
```

### 4. Make RPC Calls

```dart
// Get balance
final balance = await CinacoinAppKit.instance.getBalance();
print('Balance: $balance');

// Send transaction
final txHash = await CinacoinAppKit.instance.sendTransaction(
  to: '0xRecipientAddress',
  value: '0.01',
);
print('Transaction hash: $txHash');

// Sign message
final signature = await CinacoinAppKit.instance.signMessage('Hello, Cinacoin!');
print('Signature: $signature');
```

## Configuration Options

| Parameter         | Type          | Description                                                |
| ----------------- | ------------- | ---------------------------------------------------------- |
| `projectId`       | `String`      | Your Cinacoin Cloud project ID                             |
| `metadata`        | `AppMetadata` | App metadata displayed in the connect sheet                |
| `themeMode`       | `ThemeMode`   | `ThemeMode.light`, `ThemeMode.dark`, or `ThemeMode.system` |
| `customChains`    | `List<Chain>` | Additional chains to support                               |
| `defaultChain`    | `Chain`       | Default chain on connect                                   |
| `enableAnalytics` | `bool`        | Enable anonymous usage analytics                           |

## Platform Setup

### iOS

Add URL scheme to `ios/Runner/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>myapp</string>
        </array>
    </dict>
</array>
```

### Android

Add intent filter to `android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="myapp" android:host="wallet" />
</intent-filter>
```

## Next Steps

- [Wallet Connection](./wallet-connection.md) — Deep dive into wallet connection flows
- [Authentication](./authentication.md) — Social and email login
- [Smart Accounts](./smart-accounts.md) — ERC-4337 account abstraction

<!-- TODO: Add screenshot of connect sheet -->

# Flutter SDK — Wallet Connection

## Overview

AppKit supports connecting to 300+ wallets through a unified interface on Flutter. This guide covers all connection methods and state management.

## Using CinacoinConnectButton

The simplest way to add wallet connection:

```dart
import 'package:cinacoin_appkit_ui/cinacoin_appkit_ui.dart';

class WalletScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CinacoinConnectButton(
      onPressed: () => _showConnect(context),
    );
  }

  void _showConnect(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CinacoinConnectSheet(
        onConnect: (wallet) {
          Navigator.pop(context);
          print('Connected: ${wallet.name}');
          print('Address: ${wallet.address}');
          print('Chain ID: ${wallet.chainId}');
        },
        onError: (error) {
          print('Error: $error');
        },
      ),
    );
  }
}
```

### Customizing the Button

```dart
CinacoinConnectButton(
  label: 'Connect Wallet',
  style: ButtonStyle.primary, // primary, secondary, outline
  size: ButtonSize.large,     // small, medium, large
  onPressed: () => _showConnect(context),
)
```

## Using CinacoinConnectSheet

The connect sheet provides a pre-built UI for wallet selection:

```dart
final config = ConnectSheetConfig(
  showRecentWallets: true,
  showQRCode: true,
  featuredWallets: ['metamask', 'trust', 'rainbow'],
  excludedWallets: [],
  enableEmailLogin: true,
  enableSocialLogin: true,
);

showModalBottomSheet(
  context: context,
  isScrollControlled: true,
  backgroundColor: Colors.transparent,
  builder: (_) => CinacoinConnectSheet(
    config: config,
    onConnect: (wallet) {
      Navigator.pop(context);
      print('Connected: ${wallet.name}');
    },
  ),
);
```

## Custom Wallet List

Build your own wallet selection UI:

```dart
import 'package:cinacoin_appkit/cinacoin_appkit.dart';

class CustomWalletList extends StatefulWidget {
  @override
  State<CustomWalletList> createState() => _CustomWalletListState();
}

class _CustomWalletListState extends State<CustomWalletList> {
  final _appKit = CinacoinAppKit.instance;
  late List<Wallet> _wallets;

  @override
  void initState() {
    super.initState();
    _wallets = _appKit.getAvailableWallets();
  }

  Future<void> _connect(Wallet wallet) async {
    try {
      await _appKit.connect(wallet: wallet);
      print('Connected to ${wallet.name}');
    } catch (e) {
      print('Connection failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: _wallets.length,
      itemBuilder: (context, index) {
        final wallet = _wallets[index];
        return ListTile(
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              wallet.iconUrl,
              width: 40,
              height: 40,
              errorBuilder: (_, __, ___) => Container(
                width: 40,
                height: 40,
                color: Colors.grey,
              ),
            ),
          ),
          title: Text(wallet.name),
          subtitle: wallet.isInstalled ? Text('Installed', style: TextStyle(color: Colors.green)) : null,
          onTap: () => _connect(wallet),
        );
      },
    );
  }
}
```

## Connection State Management

### Using ChangeNotifier

```dart
import 'package:cinacoin_appkit/cinacoin_appkit.dart';

class WalletViewModel extends ChangeNotifier {
  final _appKit = CinacoinAppKit.instance;

  bool _isConnected = false;
  bool get isConnected => _isConnected;

  String? _address;
  String? get address => _address;

  String? _chainId;
  String? get chainId => _chainId;

  WalletViewModel() {
    _appKit.onConnectionChange = (connected) {
      _isConnected = connected;
      if (connected) {
        _address = _appKit.account?.address;
        _chainId = _appKit.chainId;
      } else {
        _address = null;
        _chainId = null;
      }
      notifyListeners();
    };

    _appKit.onAccountChange = (account) {
      _address = account?.address;
      notifyListeners();
    };

    _appKit.onChainChange = (chainId) {
      _chainId = chainId;
      notifyListeners();
    };

    // Check existing connection
    if (_appKit.isConnected) {
      _isConnected = true;
      _address = _appKit.account?.address;
      _chainId = _appKit.chainId;
    }
  }
}
```

### Using with Provider

```dart
class WalletScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => WalletViewModel(),
      child: Consumer<WalletViewModel>(
        builder: (context, vm, child) {
          if (vm.isConnected) {
            return Column(
              children: [
                Text('Address: ${vm.address}'),
                Text('Chain: ${vm.chainId}'),
                ElevatedButton(
                  onPressed: () async {
                    await CinacoinAppKit.instance.disconnect();
                  },
                  child: Text('Disconnect'),
                ),
              ],
            );
          }
          return CinacoinConnectButton(
            onPressed: () => _showConnect(context),
          );
        },
      ),
    );
  }
}
```

### Using with Riverpod

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

final walletProvider = ChangeNotifierProvider((ref) => WalletViewModel());

class WalletScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vm = ref.watch(walletProvider);

    if (vm.isConnected) {
      return Text('Connected: ${vm.address}');
    }
    return CinacoinConnectButton(onPressed: () { /* ... */ });
  }
}
```

## Chain Switching

### Switch Chain Programmatically

```dart
// Switch to Ethereum Mainnet
await CinacoinAppKit.instance.switchChain(chainId: '0x1');

// Switch to Polygon
await CinacoinAppKit.instance.switchChain(chainId: '0x89');

// Switch to Base
await CinacoinAppKit.instance.switchChain(chainId: '0x2105');
```

### Listen for Chain Changes

```dart
CinacoinAppKit.instance.onChainChange = (chainId) {
  print('Chain changed to: $chainId');

  switch (chainId) {
    case '0x1':
      print('Ethereum Mainnet');
      break;
    case '0x89':
      print('Polygon');
      break;
    default:
      print('Chain: $chainId');
  }
};
```

### Request Chain Switch from dApp

```dart
try {
  await CinacoinAppKit.instance.requestChainSwitch(chainId: '0x1');
  print('User approved chain switch');
} on ChainSwitchException catch (e) {
  if (e is UserRejectedChainSwitch) {
    print('User rejected');
  } else {
    print('Error: $e');
  }
}
```

## Disconnect

```dart
// Disconnect current session
await CinacoinAppKit.instance.disconnect();

// Disconnect and clear stored sessions
await CinacoinAppKit.instance.disconnect(clearSession: true);
```

## Deep Linking

### Handle Wallet Callbacks

```dart
// In your main app widget
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: AppLinksHandler(
        child: HomeScreen(),
      ),
    );
  }
}

class AppLinksHandler extends StatefulWidget {
  final Widget child;
  const AppLinksHandler({required this.child});

  @override
  State<AppLinksHandler> createState() => _AppLinksHandlerState();
}

class _AppLinksHandlerState extends State<AppLinksHandler> {
  @override
  void initState() {
    super.initState();
    _handleAppLinks();
  }

  Future<void> _handleAppLinks() async {
    // Handle initial link
    final initialUri = await CinacoinAppKit.instance.getInitialDeepLink();
    if (initialUri != null) {
      CinacoinAppKit.instance.handleDeepLink(initialUri);
    }

    // Listen for subsequent links
    CinacoinAppKit.instance.onDeepLink = (uri) {
      CinacoinAppKit.instance.handleDeepLink(uri);
    };
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
```

## Error Handling

```dart
try {
  await CinacoinAppKit.instance.connect(wallet: wallet);
} on ConnectionException catch (e) {
  if (e is WalletNotFoundException) {
    // Wallet app not installed
    _showInstallPrompt(wallet);
  } else if (e is UserRejectedException) {
    // User rejected connection
    _showRejectionMessage();
  } else if (e is ConnectionTimeoutException) {
    // Connection timed out
    _showRetryPrompt();
  } else if (e is ChainNotSupportedException) {
    // Chain not supported by wallet
    _showChainNotSupported();
  } else {
    // Unexpected error
    _showError(e.toString());
  }
}
```

<!-- TODO: Add screenshot of custom wallet list -->

# Flutter Example — Complete AppKit Integration

A complete Flutter example demonstrating wallet connection, authentication, and smart account usage.

## Project Structure

```
lib/
├── main.dart
├── app.dart
├── screens/
│   ├── home_screen.dart
│   ├── wallet_screen.dart
│   ├── login_screen.dart
│   └── smart_account_screen.dart
├── viewmodels/
│   ├── wallet_viewmodel.dart
│   └── login_viewmodel.dart
└── services/
    └── appkit_service.dart
```

## main.dart

```dart
import 'package:flutter/material.dart';
import 'package:cinacoin_appkit/cinacoin_appkit.dart';
import 'package:cinacoin_appkit_auth/cinacoin_appkit_auth.dart';
import 'package:cinacoin_appkit_smart_account/cinacoin_appkit_smart_account.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Configure AppKit
  await CinacoinAppKit.configure(
    AppKitConfig(
      projectId: 'YOUR_PROJECT_ID',
      metadata: AppMetadata(
        name: 'Cinacoin Example',
        description: 'Example app demonstrating AppKit SDK',
        url: 'https://cinacoin.io',
        icons: ['https://cinacoin.io/icon.png'],
      ),
      themeMode: ThemeMode.dark,
      smartAccountConfig: SmartAccountConfig(
        factoryAddress: '0xFACTORY_ADDRESS',
        entryPointAddress: '0xENTRY_POINT_ADDRESS',
        paymasterUrl: 'https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID',
      ),
    ),
  );

  // Configure Auth
  CinacoinAppKit.configureAuth(
    AuthConfig(
      projectId: 'YOUR_PROJECT_ID',
      supportedProviders: [
        AuthProvider.google,
        AuthProvider.github,
        AuthProvider.discord,
        AuthProvider.apple,
        AuthProvider.email,
      ],
      redirectUrl: 'cinacoinexample://auth/callback',
    ),
  );

  runApp(const CinacoinExampleApp());
}
```

## app.dart

```dart
import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

class CinacoinExampleApp extends StatelessWidget {
  const CinacoinExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cinacoin Example',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
```

## screens/home_screen.dart

```dart
import 'package:flutter/material.dart';
import 'wallet_screen.dart';
import 'login_screen.dart';
import 'smart_account_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final _screens = const [
    WalletScreen(),
    LoginScreen(),
    SmartAccountScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet),
            label: 'Wallet',
          ),
          NavigationDestination(
            icon: Icon(Icons.person),
            label: 'Login',
          ),
          NavigationDestination(
            icon: Icon(Icons.smart_toy),
            label: 'Smart Account',
          ),
        ],
      ),
    );
  }
}
```

## screens/wallet_screen.dart

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cinacoin_appkit_ui/cinacoin_appkit_ui.dart';
import '../viewmodels/wallet_viewmodel.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => WalletViewModel(),
      child: Scaffold(
        appBar: AppBar(title: const Text('Wallet')),
        body: Consumer<WalletViewModel>(
          builder: (context, vm, child) {
            return Padding(
              padding: const EdgeInsets.all(16.0),
              child: vm.isConnected
                  ? _ConnectedView(vm: vm)
                  : _DisconnectedView(vm: vm),
            );
          },
        ),
      ),
    );
  }
}

class _DisconnectedView extends StatelessWidget {
  final WalletViewModel vm;
  const _DisconnectedView({required this.vm});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.account_balance_wallet,
              size: 60, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'Connect your wallet to get started',
            style: TextStyle(fontSize: 18),
          ),
          const SizedBox(height: 24),
          CinacoinConnectButton(
            onPressed: () => _showConnect(context),
          ),
          if (vm.error != null) ...[
            const SizedBox(height: 16),
            Text(vm.error!, style: TextStyle(color: Colors.red)),
          ],
        ],
      ),
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
          vm.notifyListeners();
        },
        onError: (error) {
          print('Error: $error');
        },
      ),
    );
  }
}

class _ConnectedView extends StatelessWidget {
  final WalletViewModel vm;
  const _ConnectedView({required this.vm});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Connection info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green),
                      SizedBox(width: 8),
                      Text('Connected',
                          style: Theme.of(context).textTheme.titleMedium),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (vm.address != null) _infoRow('Address', vm.address!),
                  if (vm.chainId != null) _infoRow('Chain', vm.chainId!),
                  if (vm.balance != null) _infoRow('Balance', vm.balance!),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Action buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: vm.isLoading ? null : vm.getBalance,
                  child: const Text('Balance'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: vm.isLoading ? null : vm.disconnect,
                  child: const Text('Disconnect'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Chain switching
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Switch Chain',
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => vm.switchChain('0x1'),
                          child: const Text('ETH'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => vm.switchChain('0x89'),
                          child: const Text('Polygon'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => vm.switchChain('0x2105'),
                          child: const Text('Base'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          if (vm.error != null) ...[
            const SizedBox(height: 16),
            Text(vm.error!,
                style: TextStyle(color: Colors.red)),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 12, color: Colors.grey)),
          Text(value,
              style: TextStyle(fontFamily: 'monospace')),
        ],
      ),
    );
  }
}
```

## viewmodels/wallet_viewmodel.dart

```dart
import 'package:flutter/foundation.dart';
import 'package:cinacoin_appkit/cinacoin_appkit.dart';

class WalletViewModel extends ChangeNotifier {
  final _appKit = CinacoinAppKit.instance;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  bool get isConnected => _appKit.isConnected;
  String? get address => _appKit.account?.address;
  String? get chainId => _appKit.chainId;

  String? _balance;
  String? get balance => _balance;

  WalletViewModel() {
    _appKit.onConnectionChange = (connected) => notifyListeners();
    _appKit.onAccountChange = (account) => notifyListeners();
    _appKit.onChainChange = (chainId) => notifyListeners();
  }

  Future<void> disconnect() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _appKit.disconnect();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> getBalance() async {
    if (!isConnected) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _balance = await _appKit.getBalance();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> switchChain(String chainId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _appKit.switchChain(chainId: chainId);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }
}
```

## screens/login_screen.dart

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cinacoin_appkit_auth/cinacoin_appkit_auth.dart';
import 'package:cinacoin_appkit_ui/cinacoin_appkit_ui.dart';
import '../viewmodels/login_viewmodel.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => LoginViewModel(),
      child: Scaffold(
        appBar: AppBar(title: const Text('Login')),
        body: Consumer<LoginViewModel>(
          builder: (context, vm, child) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: vm.isAuthenticated
                  ? _AuthenticatedView(vm: vm)
                  : _LoginView(vm: vm),
            );
          },
        ),
      ),
    );
  }
}

class _LoginView extends StatefulWidget {
  final LoginViewModel vm;
  const _LoginView({required this.vm});

  @override
  State<_LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<_LoginView> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = widget.vm;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Sign In',
            style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 24),

        CinacoinSocialButton(
          provider: AuthProvider.google,
          isLoading: vm.isLoading,
          onPressed: () => vm.socialLogin(AuthProvider.google),
        ),
        const SizedBox(height: 12),

        CinacoinSocialButton(
          provider: AuthProvider.apple,
          isLoading: vm.isLoading,
          onPressed: () => vm.socialLogin(AuthProvider.apple),
        ),
        const SizedBox(height: 12),

        CinacoinSocialButton(
          provider: AuthProvider.discord,
          isLoading: vm.isLoading,
          onPressed: () => vm.socialLogin(AuthProvider.discord),
        ),
        const SizedBox(height: 12),

        CinacoinSocialButton(
          provider: AuthProvider.github,
          isLoading: vm.isLoading,
          onPressed: () => vm.socialLogin(AuthProvider.github),
        ),
        const SizedBox(height: 24),

        const Divider(),
        const SizedBox(height: 24),

        if (!vm.showOTP) ...[
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email address',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: vm.isLoading
                ? null
                : () => vm.sendOTP(_emailController.text),
            child: vm.isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Send Code'),
          ),
        ] else ...[
          Text('Enter code sent to ${_emailController.text}'),
          const SizedBox(height: 8),
          TextField(
            controller: _otpController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            decoration: const InputDecoration(
              labelText: '6-digit code',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: vm.isLoading
                ? null
                : () => vm.verifyOTP(
                    _emailController.text, _otpController.text),
            child: vm.isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Verify'),
          ),
        ],

        if (vm.error != null) ...[
          const SizedBox(height: 16),
          Text(vm.error!,
              style: const TextStyle(color: Colors.red, fontSize: 12)),
        ],
      ],
    );
  }
}

class _AuthenticatedView extends StatelessWidget {
  final LoginViewModel vm;
  const _AuthenticatedView({required this.vm});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green),
                SizedBox(width: 8),
                Text('Logged In',
                    style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 12),
            if (vm.email != null) Text('Email: ${vm.email}'),
            if (vm.address != null)
              Text('Wallet: ${vm.address}',
                  style: TextStyle(fontFamily: 'monospace')),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: vm.signOut,
              child: const Text('Sign Out'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## viewmodels/login_viewmodel.dart

```dart
import 'package:flutter/foundation.dart';
import 'package:cinacoin_appkit_auth/cinacoin_appkit_auth.dart';

class LoginViewModel extends ChangeNotifier {
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _isAuthenticated = false;
  bool get isAuthenticated => _isAuthenticated;

  String? _email;
  String? get email => _email;

  String? _address;
  String? get address => _address;

  bool _showOTP = false;
  bool get showOTP => _showOTP;

  String? _error;
  String? get error => _error;

  Future<void> socialLogin(AuthProvider provider) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await AuthManager.instance.signIn(provider: provider);
      _isAuthenticated = true;
      _email = result.email;
      _address = result.address;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> sendOTP(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await AuthManager.instance.sendEmailOTP(email: email);
      _showOTP = true;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> verifyOTP(String email, String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await AuthManager.instance.verifyEmailOTP(
        email: email,
        otp: otp,
      );
      _isAuthenticated = true;
      _email = email;
      _address = result.address;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> signOut() async {
    _isLoading = true;
    notifyListeners();

    try {
      await AuthManager.instance.signOut();
      _isAuthenticated = false;
      _email = null;
      _address = null;
      _showOTP = false;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }
}
```

## screens/smart_account_screen.dart

```dart
import 'package:flutter/material.dart';
import 'package:cinacoin_appkit/cinacoin_appkit.dart';
import 'package:cinacoin_appkit_smart_account/cinacoin_appkit_smart_account.dart';

class SmartAccountScreen extends StatefulWidget {
  const SmartAccountScreen({super.key});

  @override
  State<SmartAccountScreen> createState() => _SmartAccountScreenState();
}

class _SmartAccountScreenState extends State<SmartAccountScreen> {
  SmartAccount? _smartAccount;
  bool _isLoading = false;
  String? _error;
  String? _result;

  Future<void> _createSmartAccount() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _result = null;
    });

    try {
      final owner = CinacoinAppKit.instance.account?.address;
      if (owner == null) throw Exception('No connected account');

      final account = await SmartAccountManager.instance.createSmartAccount(
        owner: owner,
        salt: 0,
      );

      setState(() {
        _smartAccount = account;
        _result = 'Created: ${account.address}';
      });
    } catch (e) {
      setState(() => _error = e.toString());
    }

    setState(() => _isLoading = false);
  }

  Future<void> _deploy() async {
    if (_smartAccount == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
      _result = null;
    });

    try {
      final txHash = await _smartAccount!.deploy();
      setState(() => _result = 'Deployed: $txHash');
    } catch (e) {
      setState(() => _error = e.toString());
    }

    setState(() => _isLoading = false);
  }

  Future<void> _sendTransaction() async {
    if (_smartAccount == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
      _result = null;
    });

    try {
      final userOpHash = await _smartAccount!.sendTransaction(
        to: '0x0000000000000000000000000000000000000000',
        value: BigInt.zero,
        data: [],
      );
      setState(() => _result = 'UserOp: $userOpHash');
    } catch (e) {
      setState(() => _error = e.toString());
    }

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Smart Account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_smartAccount != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.check_circle, color: Colors.green),
                          SizedBox(width: 8),
                          Text('Smart Account',
                              style: Theme.of(context).textTheme.titleMedium),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Address:',
                          style: TextStyle(fontSize: 12, color: Colors.grey)),
                      Text(_smartAccount!.address,
                          style: TextStyle(fontFamily: 'monospace')),
                      const SizedBox(height: 8),
                      Text(
                          'Deployed: ${_smartAccount!.isDeployed ? "Yes" : "No"}'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading || _smartAccount!.isDeployed
                          ? null
                          : _deploy,
                      child: const Text('Deploy'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _sendTransaction,
                      child: const Text('Send Tx'),
                    ),
                  ),
                ],
              ),
            ] else ...[
              Center(
                child: Column(
                  children: [
                    Icon(Icons.smart_toy, size: 60, color: Colors.grey),
                    const SizedBox(height: 16),
                    const Text('Create a smart account'),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _createSmartAccount,
                      child: const Text('Create Smart Account'),
                    ),
                  ],
                ),
              ),
            ],
            if (_isLoading) ...[
              const SizedBox(height: 16),
              const Center(child: CircularProgressIndicator()),
            ],
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!, style: TextStyle(color: Colors.red)),
            ],
            if (_result != null) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Text(_result!,
                      style: TextStyle(fontFamily: 'monospace', fontSize: 12)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

## pubspec.yaml Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  cinacoin_appkit: ^1.0.0
  cinacoin_appkit_ui: ^1.0.0
  cinacoin_appkit_auth: ^1.0.0
  cinacoin_appkit_smart_account: ^1.0.0
  provider: ^6.0.0
```

## Running the Example

1. Replace `YOUR_PROJECT_ID` with your actual Cinacoin Cloud project ID
2. Update factory and entry point addresses
3. Run `flutter pub get`
4. Run `flutter run`
5. Test wallet connection, authentication, and smart account features

<!-- TODO: Add screenshots of the example app -->

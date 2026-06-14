import 'package:flutter/material.dart';
import 'package:cinacoin/appkit_config.dart' hide ThemeMode;
import 'package:cinacoin/appkit_config.dart' as appkit;
import 'package:cinacoin/appkit_auth.dart';
import 'package:cinacoin/appkit_ui/theme/cinacoin_theme_data.dart';

import 'screens/home_screen.dart';
import 'screens/connect_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/smart_account_screen.dart';
import 'screens/chain_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Configure Cinacoin AppKit
  CinacoinAppKit.configure(const AppKitConfig(
    projectId: 'YOUR_PROJECT_ID',
    metadata: AppMetadata(
      name: 'Cinacoin Demo',
      description: 'Cinacoin AppKit Flutter Demo',
      url: 'https://demo.cinacoin.com',
      icons: ['https://cinacoin.com/icon.png'],
    ),
    themeMode: appkit.ThemeMode.dark,
  ));

  // Configure Auth
  AuthManager().configure(projectId: 'YOUR_PROJECT_ID');

  runApp(const DemoApp());
}

class DemoApp extends StatefulWidget {
  const DemoApp({super.key});
  @override
  State<DemoApp> createState() => _DemoAppState();
}

class _DemoAppState extends State<DemoApp> {
  ThemeMode _themeMode = ThemeMode.dark;

  void toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cinacoin Demo',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,
      theme: cinacoinThemeData(darkMode: false),
      darkTheme: cinacoinThemeData(darkMode: true),
      home: MainScaffold(onToggleTheme: toggleTheme),
    );
  }
}

class MainScaffold extends StatefulWidget {
  final VoidCallback onToggleTheme;

  const MainScaffold({super.key, required this.onToggleTheme});

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      const HomeScreen(),
      const ConnectScreen(),
      const AuthScreen(),
      const SmartAccountScreen(),
      const ChainScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cinacoin Demo'),
        actions: [
          IconButton(
            icon: Icon(
              Theme.of(context).brightness == Brightness.dark
                  ? Icons.light_mode_outlined
                  : Icons.dark_mode_outlined,
            ),
            onPressed: widget.onToggleTheme,
            tooltip: 'Toggle theme',
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.link_outlined),
            activeIcon: Icon(Icons.link),
            label: 'Connect',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Auth',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_box_outlined),
            activeIcon: Icon(Icons.account_box),
            label: 'Smart Acct',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shuffle_outlined),
            activeIcon: Icon(Icons.shuffle),
            label: 'Chains',
          ),
        ],
      ),
    );
  }
}

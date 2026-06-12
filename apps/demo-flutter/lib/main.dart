import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cinacoin/cinacoin.dart';

import 'screens/home_screen.dart';
import 'screens/connect_screen.dart';
import 'screens/chain_screen.dart';
import 'screens/sign_screen.dart';
import 'screens/transaction_screen.dart';

// ── Global SDK Instance ────────────────────────────────────────────────

/// Shared CinaCoin SDK instance accessible throughout the app.
final sdk = CinacoinSdk.instance;

// ── Main ───────────────────────────────────────────────────────────────

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize the CinaCoin SDK
  try {
    await sdk.initialize(
      projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID
      metadata: const AppMetadata(
        name: 'CinaCoin Demo',
        description: 'CinaCoin Flutter SDK Demo App',
        url: 'https://cinacoin.dev',
        icons: [],
      ),
    );
    debugPrint('[Demo] CinaCoin SDK initialized');
  } catch (e) {
    debugPrint('[Demo] SDK init deferred (no valid project ID): $e');
  }

  runApp(const DemoApp());
}

// ── App Widget ─────────────────────────────────────────────────────────

class DemoApp extends StatefulWidget {
  const DemoApp({super.key});

  @override
  State<DemoApp> createState() => _DemoAppState();
}

class _DemoAppState extends State<DemoApp> {
  ThemeMode _themeMode = ThemeMode.dark;

  void toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.dark
          ? ThemeMode.light
          : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CinaCoin Demo',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,
      theme: _buildLightTheme(),
      darkTheme: _buildDarkTheme(),
      home: MainScaffold(onToggleTheme: toggleTheme),
    );
  }

  ThemeData _buildDarkTheme() {
    final base = ThemeData.dark();
    return base.copyWith(
      primaryColor: const Color(0xFF6C5CE7),
      scaffoldBackgroundColor: const Color(0xFF0D0D1A),
      cardColor: const Color(0xFF1A1A2E),
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFF6C5CE7),
        secondary: Color(0xFF00CEC9),
        surface: Color(0xFF1A1A2E),
        onSurface: Color(0xFFE2E2F0),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF0D0D1A),
        elevation: 0,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF0D0D1A),
        selectedItemColor: Color(0xFF6C5CE7),
        unselectedItemColor: Color(0xFF666680),
      ),
      textTheme: GoogleFonts.interTextTheme(base.textTheme),
    );
  }

  ThemeData _buildLightTheme() {
    final base = ThemeData.light();
    return base.copyWith(
      primaryColor: const Color(0xFF6C5CE7),
      scaffoldBackgroundColor: const Color(0xFFF5F5FA),
      cardColor: Colors.white,
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF6C5CE7),
        secondary: Color(0xFF00B894),
        surface: Colors.white,
        onSurface: Color(0xFF2D2D3A),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: Color(0xFF6C5CE7),
        unselectedItemColor: Color(0xFF9999AA),
      ),
      textTheme: GoogleFonts.interTextTheme(base.textTheme),
    );
  }
}

// ── Main Scaffold with Bottom Navigation ───────────────────────────────

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
      const ChainScreen(),
      const SignScreen(),
      const TransactionScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6C5CE7), Color(0xFF00CEC9)],
                ),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Center(
                child: Text(
                  'C',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Text('CinaCoin Demo'),
          ],
        ),
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
            icon: Icon(Icons.shuffle_outlined),
            activeIcon: Icon(Icons.shuffle),
            label: 'Chains',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.draw_outlined),
            activeIcon: Icon(Icons.draw),
            label: 'Sign',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.send_outlined),
            activeIcon: Icon(Icons.send),
            label: 'Send',
          ),
        ],
      ),
    );
  }
}

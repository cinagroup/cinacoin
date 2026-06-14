import 'package:flutter/material.dart';
import 'package:cinacoin/appkit_auth.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _authManager = AuthManager();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = _authManager.currentUser;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Icon(
                  user != null ? Icons.check_circle : Icons.person_off,
                  size: 48,
                  color: user != null ? theme.colorScheme.primary : theme.colorScheme.error,
                ),
                const SizedBox(height: 8),
                Text(
                  user != null ? 'Authenticated' : 'Not authenticated',
                  style: theme.textTheme.titleMedium,
                ),
                if (user != null) ...[
                  const SizedBox(height: 4),
                  Text(user.email ?? user.userId),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Social Login Buttons
        if (user == null) ...[
          Text('Social Login', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          _socialButton('Sign in with Google', Icons.g_mobiledata, () => _socialLogin('google')),
          const SizedBox(height: 8),
          _socialButton('Sign in with GitHub', Icons.code, () => _socialLogin('github')),
          const SizedBox(height: 8),
          _socialButton('Sign in with Discord', Icons.discord, () => _socialLogin('discord')),
          const SizedBox(height: 24),

          // Email Login
          Text('Email Login', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          TextField(
            controller: _emailController,
            decoration: const InputDecoration(
              labelText: 'Email',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.email),
            ),
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _passwordController,
            decoration: const InputDecoration(
              labelText: 'Password',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.lock),
            ),
            obscureText: true,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  child: const Text('Login'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: _isLoading ? null : _register,
                  child: const Text('Register'),
                ),
              ),
            ],
          ),
        ] else ...[
          // Sign Out
          ElevatedButton.icon(
            onPressed: () {
              _authManager.signOut();
              setState(() {});
            },
            icon: const Icon(Icons.logout),
            label: const Text('Sign Out'),
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.error,
              foregroundColor: Colors.white,
            ),
          ),
        ],

        if (_error != null) ...[
          const SizedBox(height: 16),
          Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
        ],
      ],
    );
  }

  Widget _socialButton(String label, IconData icon, VoidCallback onTap) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _isLoading ? null : onTap,
        icon: Icon(icon),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  Future<void> _socialLogin(String provider) async {
    setState(() { _isLoading = true; _error = null; });
    try {
      switch (provider) {
        case 'google':
          await _authManager.signInWithGoogle();
        case 'github':
          await _authManager.signInWithGitHub();
        case 'discord':
          await _authManager.signInWithDiscord();
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _login() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      await _authManager.login(
        email: _emailController.text,
        password: _passwordController.text,
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _register() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      await _authManager.register(
        email: _emailController.text,
        password: _passwordController.text,
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }
}

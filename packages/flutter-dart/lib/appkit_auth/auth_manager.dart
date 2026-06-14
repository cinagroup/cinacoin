import 'package:flutter/foundation.dart';
import 'models/auth_result.dart';
import 'models/auth_error.dart';
import 'social_login.dart';
import 'email_login.dart';

/// Unified auth manager
class AuthManager extends ChangeNotifier {
  static final AuthManager _instance = AuthManager._internal();
  factory AuthManager() => _instance;
  AuthManager._internal();

  AuthResult? _currentUser;
  AuthResult? get currentUser => _currentUser;

  bool _isAuthenticated = false;
  bool get isAuthenticated => _isAuthenticated;

  SocialLoginManager? _socialLogin;
  EmailLoginManager? _emailLogin;

  void configure({
    String authUrl = 'https://auth.cinacoin.com',
    required String projectId,
  }) {
    _socialLogin = SocialLoginManager(authUrl: authUrl, projectId: projectId);
    _emailLogin = EmailLoginManager(authUrl: authUrl, projectId: projectId);
  }

  // Social Login
  Future<AuthResult> signInWithGoogle() async {
    final manager = _socialLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.signInWithGoogle();
    _handleAuthResult(result);
    return result;
  }

  Future<AuthResult> signInWithGitHub() async {
    final manager = _socialLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.signInWithGitHub();
    _handleAuthResult(result);
    return result;
  }

  Future<AuthResult> signInWithDiscord() async {
    final manager = _socialLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.signInWithDiscord();
    _handleAuthResult(result);
    return result;
  }

  Future<AuthResult> signInWithApple() async {
    final manager = _socialLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.signInWithApple();
    _handleAuthResult(result);
    return result;
  }

  // Email Login
  Future<AuthResult> register({
    required String email,
    required String password,
  }) async {
    final manager = _emailLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.register(email: email, password: password);
    _handleAuthResult(result);
    return result;
  }

  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final manager = _emailLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.login(email: email, password: password);
    _handleAuthResult(result);
    return result;
  }

  void signOut() {
    _currentUser = null;
    _isAuthenticated = false;
    notifyListeners();
  }

  void _handleAuthResult(AuthResult result) {
    _currentUser = result;
    _isAuthenticated = true;
    notifyListeners();
  }
}

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'models/auth_result.dart';
import 'models/auth_error.dart';
import 'social_login.dart';
import 'email_login.dart';

/// Unified auth manager
/// Handles token refresh, session persistence, and auto-refresh scheduling
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

  String _authUrl = 'https://auth.cinacoin.com';
  String _projectId = '';

  /// How many seconds before expiry to trigger a refresh
  static const int _refreshThresholdSeconds = 300; // 5 minutes

  /// Timer for auto-refresh
  Timer? _refreshTimer;

  /// Secure storage for tokens
  final _secureStorage = const FlutterSecureStorage();

  void configure({
    String authUrl = 'https://auth.cinacoin.com',
    required String projectId,
  }) {
    _authUrl = authUrl;
    _projectId = projectId;
    _socialLogin = SocialLoginManager(authUrl: authUrl, projectId: projectId);
    _emailLogin = EmailLoginManager(authUrl: authUrl, projectId: projectId);

    // Restore session from secure storage
    restoreSession();
  }

  /// Restore session from secure storage
  Future<void> restoreSession() async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      final refreshToken = await _secureStorage.read(key: 'refresh_token');
      final userId = await _secureStorage.read(key: 'user_id');
      final expiresAtStr = await _secureStorage.read(key: 'expires_at');

      if (accessToken == null || userId == null || expiresAtStr == null) {
        return;
      }

      final expiresAt = DateTime.fromMillisecondsSinceEpoch(
        int.parse(expiresAtStr) * 1000,
      );

      // Don't restore if token is already expired
      if (DateTime.now().isAfter(expiresAt)) {
        await signOut();
        return;
      }

      final restored = AuthResult(
        userId: userId,
        email: null,
        provider: null,
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
      );

      _currentUser = restored;
      _isAuthenticated = true;
      notifyListeners();

      // Schedule auto-refresh
      _scheduleAutoRefresh(restored);
    } catch (e) {
      debugPrint('[AuthManager] Failed to restore session: $e');
    }
  }

  // Social Login
  Future<AuthResult> signInWithGoogle() async {
    final manager = _socialLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.signInWithGoogle();
    await _handleAuthResult(result);
    return result;
  }

  Future<AuthResult> signInWithGitHub() async {
    final manager = _socialLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.signInWithGitHub();
    await _handleAuthResult(result);
    return result;
  }

  Future<AuthResult> signInWithDiscord() async {
    final manager = _socialLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.signInWithDiscord();
    await _handleAuthResult(result);
    return result;
  }

  Future<AuthResult> signInWithApple() async {
    final manager = _socialLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.signInWithApple();
    await _handleAuthResult(result);
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
    await _handleAuthResult(result);
    return result;
  }

  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final manager = _emailLogin;
    if (manager == null) throw const NotConfiguredError();
    final result = await manager.login(email: email, password: password);
    await _handleAuthResult(result);
    return result;
  }

  Future<void> signOut() async {
    _currentUser = null;
    _isAuthenticated = false;
    _cancelRefreshTimer();
    notifyListeners();

    // Clear secure storage
    await _secureStorage.delete(key: 'access_token');
    await _secureStorage.delete(key: 'refresh_token');
    await _secureStorage.delete(key: 'user_id');
    await _secureStorage.delete(key: 'expires_at');
  }

  // MARK: - Token Refresh

  /// Refresh the access token using the stored refresh token
  Future<AuthResult> refreshToken() async {
    final current = _currentUser;
    if (current == null) throw const TokenExpiredError();

    final refreshTokenValue = current.refreshToken;
    if (refreshTokenValue == null) throw const TokenExpiredError();

    final response = await http.post(
      Uri.parse('$_authUrl/api/auth/oauth/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'refresh_token': refreshTokenValue,
        'project_id': _projectId,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw NetworkAuthError(
        'Token refresh failed: ${response.statusCode} - ${response.body}',
      );
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;

    // Handle refresh token rotation: if server returns a new refresh token, use it
    final newRefreshToken = json['refresh_token'] as String? ?? refreshTokenValue;

    final result = AuthResult(
      userId: json['user_id'] as String,
      email: json['email'] as String?,
      provider: current.provider,
      accessToken: json['access_token'] as String,
      refreshToken: newRefreshToken,
      expiresAt: DateTime.fromMillisecondsSinceEpoch(
        (json['expires_at'] as int) * 1000,
      ),
    );

    // Update stored tokens
    await _handleAuthResult(result);

    return result;
  }

  /// Ensure the current token is valid, refreshing if needed
  Future<String> ensureValidToken() async {
    final current = _currentUser;
    if (current == null) throw const TokenExpiredError();

    // If token is still valid for at least `refreshThresholdSeconds`, return it
    final timeUntilExpiry = current.expiresAt.difference(DateTime.now());
    if (timeUntilExpiry.inSeconds > _refreshThresholdSeconds) {
      return current.accessToken;
    }

    // Token is about to expire or already expired — refresh
    final refreshed = await refreshToken();
    return refreshed.accessToken;
  }

  // MARK: - Private

  Future<void> _handleAuthResult(AuthResult result) async {
    _currentUser = result;
    _isAuthenticated = true;
    notifyListeners();

    // Store tokens securely
    await _secureStorage.write(key: 'access_token', value: result.accessToken);
    if (result.refreshToken != null) {
      await _secureStorage.write(key: 'refresh_token', value: result.refreshToken);
    }
    await _secureStorage.write(key: 'user_id', value: result.userId);
    await _secureStorage.write(
      key: 'expires_at',
      value: (result.expiresAt.millisecondsSinceEpoch ~/ 1000).toString(),
    );

    // Schedule auto-refresh
    _scheduleAutoRefresh(result);
  }

  /// Schedule automatic token refresh before expiry
  void _scheduleAutoRefresh(AuthResult result) {
    _cancelRefreshTimer();

    final timeUntilExpiry = result.expiresAt.difference(DateTime.now());
    final refreshIn = Duration(
      seconds: (timeUntilExpiry.inSeconds - _refreshThresholdSeconds).clamp(10, 86400),
    );

    _refreshTimer = Timer(refreshIn, () async {
      try {
        debugPrint('[AuthManager] Auto-refresh triggered');
        await refreshToken();
      } catch (e) {
        debugPrint('[AuthManager] Auto-refresh failed: $e');
        // Retry in 60 seconds
        _scheduleRetryRefresh();
      }
    });
  }

  /// Retry refresh after a failure
  void _scheduleRetryRefresh() {
    _cancelRefreshTimer();
    _refreshTimer = Timer(const Duration(seconds: 60), () async {
      try {
        debugPrint('[AuthManager] Retry refresh triggered');
        await refreshToken();
      } catch (e) {
        debugPrint('[AuthManager] Retry refresh failed: $e');
      }
    });
  }

  void _cancelRefreshTimer() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }
}

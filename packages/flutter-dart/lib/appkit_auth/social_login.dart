import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:app_links/app_links.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'models/auth_result.dart';
import 'models/auth_error.dart';

/// Social login manager for Flutter using url_launcher + app_links
///
/// Flow:
/// 1. Use url_launcher to open browser to OAuth provider
/// 2. Provider redirects to cinacoin://auth/{provider}/callback?code=...
/// 3. app_links intercepts the deep link
/// 4. Exchange code for tokens via Auth Service API
/// 5. Store tokens securely using flutter_secure_storage
class SocialLoginManager {
  final String authUrl;
  final String projectId;
  final String callbackScheme;

  late final AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;

  SocialLoginManager({
    this.authUrl = 'https://auth.cinacoin.com',
    required this.projectId,
    this.callbackScheme = 'cinacoin',
  }) {
    _appLinks = AppLinks();
  }

  /// Sign in with Google (via url_launcher + deep link)
  Future<AuthResult> signInWithGoogle() async {
    return _performOAuthLogin('google', AuthProvider.google);
  }

  /// Sign in with GitHub
  Future<AuthResult> signInWithGitHub() async {
    return _performOAuthLogin('github', AuthProvider.github);
  }

  /// Sign in with Discord
  Future<AuthResult> signInWithDiscord() async {
    return _performOAuthLogin('discord', AuthProvider.discord);
  }

  /// Sign in with Apple (iOS only)
  Future<AuthResult> signInWithApple() async {
    // Use sign_in_with_apple package on iOS
    throw const NotImplementedError('Apple Sign-In requires platform channel');
  }

  /// Dispose resources
  void dispose() {
    _linkSubscription?.cancel();
  }

  // MARK: - Private

  Future<AuthResult> _performOAuthLogin(
    String provider,
    AuthProvider authProvider,
  ) async {
    final callbackUrl = '$callbackScheme://auth/$provider/callback';
    final authUrlStr =
        '$authUrl/api/auth/$provider?redirect_uri=$callbackUrl&project_id=$projectId';

    // Launch browser and wait for callback deep link
    final callbackUri = await _launchBrowserAndWaitForCallback(authUrlStr);

    // Parse authorization code
    final code = _parseAuthorizationCode(callbackUri);
    if (code == null) {
      throw const NetworkAuthError('Missing authorization code in callback');
    }

    // Exchange code for tokens
    final authResult = await _exchangeCodeForTokens(code, authProvider);

    return authResult;
  }

  /// Launch browser and wait for the callback deep link
  Future<Uri> _launchBrowserAndWaitForCallback(String authUrlStr) async {
    final completer = Completer<Uri>();

    // Listen for incoming app links BEFORE launching browser
    _linkSubscription?.cancel();
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      // Check if this is our callback
      if (uri.scheme == callbackScheme && uri.host == 'auth') {
        if (!completer.isCompleted) {
          completer.complete(uri);
        }
      }
    }, onError: (error) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    });

    // Launch browser
    final uri = Uri.parse(authUrlStr);
    if (!await canLaunchUrl(uri)) {
      _linkSubscription?.cancel();
      throw const InvalidURLError();
    }

    await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );

    try {
      // Wait for callback with timeout
      final result = await completer.future.timeout(
        const Duration(minutes: 5),
        onTimeout: () {
          throw const CancelledError();
        },
      );
      return result;
    } finally {
      _linkSubscription?.cancel();
      _linkSubscription = null;
    }
  }

  /// Parse authorization code from callback URI
  /// Expected format: cinacoin://auth/{provider}/callback?code=XXXXX
  String? _parseAuthorizationCode(Uri uri) {
    // Check for error in callback
    final error = uri.queryParameters['error'];
    if (error != null) {
      final errorDescription =
          uri.queryParameters['error_description'] ?? error;
      debugPrint('[SocialLogin] OAuth error: $errorDescription');
      return null;
    }

    return uri.queryParameters['code'];
  }

  /// Exchange authorization code for tokens via Auth Service API
  /// POST /api/auth/oauth/callback
  Future<AuthResult> _exchangeCodeForTokens(
    String code,
    AuthProvider provider,
  ) async {
    final response = await http.post(
      Uri.parse('$authUrl/api/auth/oauth/callback'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'code': code,
        'provider': provider.value,
        'project_id': projectId,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw NetworkAuthError(
        'Token exchange failed: ${response.statusCode} - ${response.body}',
      );
    }

    return AuthResult.fromJson(jsonDecode(response.body));
  }
}

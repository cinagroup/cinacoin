import 'package:flutter/services.dart';
import 'models/auth_result.dart';
import 'models/auth_error.dart';

/// Social login manager for Flutter
class SocialLoginManager {
  final String authUrl;
  final String projectId;

  SocialLoginManager({
    this.authUrl = 'https://auth.cinacoin.com',
    required this.projectId,
  });

  /// Sign in with Google (via url_launcher + deep link)
  Future<AuthResult> signInWithGoogle() async {
    final callbackUrl = '$authUrl/api/auth/google/callback';
    final authUrlStr =
        '$authUrl/api/auth/google?redirect_uri=$callbackUrl&project_id=$projectId';

    // In production, use url_launcher to open browser and handle deep link callback
    throw const NotImplementedError('Google Sign-In callback handling');
  }

  /// Sign in with GitHub
  Future<AuthResult> signInWithGitHub() async {
    final callbackUrl = '$authUrl/api/auth/github/callback';
    final authUrlStr =
        '$authUrl/api/auth/github?redirect_uri=$callbackUrl&project_id=$projectId';

    throw const NotImplementedError('GitHub Sign-In callback handling');
  }

  /// Sign in with Discord
  Future<AuthResult> signInWithDiscord() async {
    final callbackUrl = '$authUrl/api/auth/discord/callback';
    final authUrlStr =
        '$authUrl/api/auth/discord?redirect_uri=$callbackUrl&project_id=$projectId';

    throw const NotImplementedError('Discord Sign-In callback handling');
  }

  /// Sign in with Apple (iOS only)
  Future<AuthResult> signInWithApple() async {
    // Use sign_in_with_apple package on iOS
    throw const NotImplementedError('Apple Sign-In requires platform channel');
  }
}

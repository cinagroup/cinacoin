import 'dart:convert';
import 'package:http/http.dart' as http;
import 'models/auth_result.dart';
import 'models/auth_error.dart';

/// Email-based login manager
class EmailLoginManager {
  final String authUrl;
  final String projectId;

  EmailLoginManager({
    this.authUrl = 'https://auth.cinacoin.com',
    required this.projectId,
  });

  /// Register with email and password
  Future<AuthResult> register({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$authUrl/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'project_id': projectId,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const NetworkAuthError('Registration failed');
    }

    return AuthResult.fromJson(jsonDecode(response.body));
  }

  /// Login with email and password
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$authUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'project_id': projectId,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const InvalidCredentialsError();
    }

    return AuthResult.fromJson(jsonDecode(response.body));
  }

  /// Send password reset email
  Future<void> sendPasswordReset({required String email}) async {
    final response = await http.post(
      Uri.parse('$authUrl/api/auth/reset-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'project_id': projectId,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const NetworkAuthError('Password reset failed');
    }
  }

  /// Send email verification
  Future<void> sendVerification({required String email}) async {
    final response = await http.post(
      Uri.parse('$authUrl/api/auth/verify-email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'project_id': projectId,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const NetworkAuthError('Verification email failed');
    }
  }
}

/// Authentication result
class AuthResult {
  final String userId;
  final String? email;
  final AuthProvider? provider;
  final String accessToken;
  final String? refreshToken;
  final DateTime expiresAt;

  const AuthResult({
    required this.userId,
    this.email,
    this.provider,
    required this.accessToken,
    this.refreshToken,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      userId: json['user_id'] as String,
      email: json['email'] as String?,
      provider: json['provider'] != null
          ? AuthProvider.values.firstWhere((p) => p.value == json['provider'])
          : null,
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String?,
      expiresAt: DateTime.fromMillisecondsSinceEpoch(
          (json['expires_at'] as int) * 1000),
    );
  }

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        if (email != null) 'email': email,
        if (provider != null) 'provider': provider!.value,
        'access_token': accessToken,
        if (refreshToken != null) 'refresh_token': refreshToken,
        'expires_at': expiresAt.millisecondsSinceEpoch ~/ 1000,
      };
}

enum AuthProvider {
  google('google'),
  apple('apple'),
  github('github'),
  discord('discord'),
  email('email');

  final String value;
  const AuthProvider(this.value);
}

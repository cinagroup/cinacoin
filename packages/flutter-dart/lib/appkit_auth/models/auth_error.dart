/// Auth errors
sealed class AuthError implements Exception {
  const AuthError(this.message);
  final String message;

  @override
  String toString() => 'AuthError: $message';
}

class InvalidURLError extends AuthError {
  const InvalidURLError() : super('Invalid URL');
}

class CancelledError extends AuthError {
  const CancelledError() : super('Authentication cancelled');
}

class InvalidCredentialsError extends AuthError {
  const InvalidCredentialsError() : super('Invalid credentials');
}

class TokenExpiredError extends AuthError {
  const TokenExpiredError() : super('Token expired');
}

class NotConfiguredError extends AuthError {
  const NotConfiguredError() : super('Auth not configured');
}

class NetworkAuthError extends AuthError {
  const NetworkAuthError(String detail) : super('Network error: $detail');
}

class NotImplementedError extends AuthError {
  const NotImplementedError(String feature) : super('Not implemented: $feature');
}

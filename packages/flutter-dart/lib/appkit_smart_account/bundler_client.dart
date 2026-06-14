import 'dart:convert';
import 'package:http/http.dart' as http;
import 'user_operation.dart';

/// Smart account errors
sealed class SmartAccountError implements Exception {
  const SmartAccountError(this.message);
  final String message;
}

class NotInitializedError extends SmartAccountError {
  const NotInitializedError() : super('Smart account not initialized');
}

class UserOpFailedError extends SmartAccountError {
  const UserOpFailedError(String detail) : super('User operation failed: $detail');
}

/// Gas estimate result
class GasEstimate {
  final int callGasLimit;
  final int verificationGasLimit;
  final int preVerificationGas;

  const GasEstimate({
    required this.callGasLimit,
    required this.verificationGasLimit,
    required this.preVerificationGas,
  });
}

/// JSON-RPC client for ERC-4337 bundler
class BundlerClient {
  static Future<String> sendUserOperation({
    required UserOperation userOp,
    required String entryPoint,
    required String bundlerUrl,
  }) async {
    final response = await _sendRPC(
      url: bundlerUrl,
      method: 'eth_sendUserOperation',
      params: [userOp.toHexParams(), entryPoint],
    );
    return response as String;
  }

  static Future<Map<String, dynamic>> getUserOperationReceipt({
    required String userOpHash,
    required String bundlerUrl,
  }) async {
    final response = await _sendRPC(
      url: bundlerUrl,
      method: 'eth_getUserOperationReceipt',
      params: [userOpHash],
    );
    return response as Map<String, dynamic>;
  }

  static Future<GasEstimate> estimateGas({
    required UserOperation userOp,
    required String entryPoint,
    required String bundlerUrl,
  }) async {
    final response = await _sendRPC(
      url: bundlerUrl,
      method: 'eth_estimateUserOperationGas',
      params: [userOp.toHexParams(), entryPoint],
    );
    final gas = response as Map<String, dynamic>;
    return GasEstimate(
      callGasLimit: _parseHexInt(gas['callGasLimit'] as String?),
      verificationGasLimit: _parseHexInt(gas['verificationGasLimit'] as String?),
      preVerificationGas: _parseHexInt(gas['preVerificationGas'] as String?),
    );
  }

  static Future<dynamic> _sendRPC({
    required String url,
    required String method,
    required List<dynamic> params,
  }) async {
    final response = await http.post(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'jsonrpc': '2.0',
        'id': 1,
        'method': method,
        'params': params,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw UserOpFailedError('RPC request failed: ${response.statusCode}');
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;

    if (json.containsKey('error')) {
      final error = json['error'] as Map<String, dynamic>;
      throw UserOpFailedError(error['message'] as String? ?? 'Unknown error');
    }

    return json['result'];
  }

  static int _parseHexInt(String? hex) {
    if (hex == null) return 0;
    return int.tryParse(hex.replaceFirst('0x', ''), radix: 16) ?? 0;
  }
}

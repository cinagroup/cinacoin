import 'package:flutter/foundation.dart';
import 'user_operation.dart';
import 'bundler_client.dart';

/// ERC-4337 Smart Account Manager
class SmartAccountManager extends ChangeNotifier {
  final String bundlerUrl;
  static const _entryPointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

  SmartAccountManager({
    this.bundlerUrl = 'https://bundler.cinacoin.com',
  });

  String? _smartAccountAddress;
  String? get smartAccountAddress => _smartAccountAddress;

  bool _isDeployed = false;
  bool get isDeployed => _isDeployed;

  Future<String> getSmartAccount({
    required String ownerAddress,
    int salt = 0,
  }) async {
    final address = _computeAddress(ownerAddress, salt);
    _smartAccountAddress = address;
    _isDeployed = await _checkDeployed(address);
    notifyListeners();
    return address;
  }

  Future<String> deploy({
    required String ownerAddress,
    int salt = 0,
  }) async {
    final address = _smartAccountAddress ?? _computeAddress(ownerAddress, salt);
    final initCode = _buildInitCode(ownerAddress, salt);

    final userOp = UserOperation(
      sender: address,
      nonce: 0,
      initCode: initCode,
      callData: [],
      callGasLimit: 500000,
      verificationGasLimit: 500000,
      preVerificationGas: 50000,
      maxFeePerGas: 1000000000,
      maxPriorityFeePerGas: 1000000000,
      paymasterAndData: [],
      signature: [],
    );

    final txHash = await BundlerClient.sendUserOperation(
      userOp: userOp,
      entryPoint: _entryPointAddress,
      bundlerUrl: bundlerUrl,
    );

    _isDeployed = true;
    notifyListeners();
    return txHash;
  }

  Future<String> execute({
    required String target,
    required int value,
    required List<int> data,
    required String ownerAddress,
  }) async {
    final accountAddress = _smartAccountAddress;
    if (accountAddress == null) throw const NotInitializedError();

    final callData = _encodeExecute(target, value, data);
    final nonce = await _getNonce(accountAddress);

    final userOp = UserOperation(
      sender: accountAddress,
      nonce: nonce,
      initCode: [],
      callData: callData,
      callGasLimit: 500000,
      verificationGasLimit: 500000,
      preVerificationGas: 50000,
      maxFeePerGas: 1000000000,
      maxPriorityFeePerGas: 1000000000,
      paymasterAndData: [],
      signature: [],
    );

    return BundlerClient.sendUserOperation(
      userOp: userOp,
      entryPoint: _entryPointAddress,
      bundlerUrl: bundlerUrl,
    );
  }

  // Placeholder implementations
  String _computeAddress(String owner, int salt) => '0x${'0' * 40}';
  Future<bool> _checkDeployed(String address) async => false;
  List<int> _buildInitCode(String owner, int salt) => [];
  List<int> _encodeExecute(String target, int value, List<int> data) => [];
  Future<int> _getNonce(String address) async => 0;
}

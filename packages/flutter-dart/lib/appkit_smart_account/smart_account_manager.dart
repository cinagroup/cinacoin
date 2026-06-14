import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'user_operation.dart';
import 'bundler_client.dart';
import 'crypto_utils.dart';

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

  // Real implementations
  static const _factoryAddress = '0x9406Cc6185a346906296840746125a0E44976454';

  String _computeAddress(String owner, int salt) {
    // Build initCode
    final initCode = _buildInitCode(owner, salt);
    
    // Encode salt as 32 bytes (big-endian)
    final saltPadded = CryptoUtils.padUint256(salt);
    
    // CREATE2: keccak256(0xff + factory + salt + keccak256(initCode))
    return CryptoUtils.computeCreate2Address(
      factory: _factoryAddress,
      salt: saltPadded,
      initCode: initCode,
    );
  }

  Future<bool> _checkDeployed(String address) async {
    // Check code at address via RPC
    // eth_getCode should return non-empty if deployed
    // TODO: Implement actual RPC call
    return false;
  }

  List<int> _buildInitCode(String owner, int salt) {
    // factory.createAccount(address owner, uint256 salt)
    // Function selector: 0x5fbfb9cf
    final selector = [0x5f, 0xbf, 0xb9, 0xcf];
    
    // ABI encode parameters
    final ownerPadded = CryptoUtils.padAddress(owner);
    final saltPadded = CryptoUtils.padUint256(salt);
    
    // initCode = factory address + encoded call
    final factoryData = CryptoUtils.hexToBytes(_factoryAddress);
    
    return [...factoryData, ...selector, ...ownerPadded, ...saltPadded];
  }

  List<int> _encodeExecute(String target, int value, List<int> data) {
    // execute(address dest, uint256 value, bytes func)
    // Function selector: 0xb61d27f6
    final selector = [0xb6, 0x1d, 0x27, 0xf6];
    
    // ABI encode parameters
    final targetPadded = CryptoUtils.padAddress(target);
    final valuePadded = CryptoUtils.padUint256(value);
    
    // Dynamic bytes parameter: offset + length + data
    final offset = CryptoUtils.padUint256(96); // 3 * 32 bytes for fixed params
    final encodedData = CryptoUtils.abiEncodeBytes(Uint8List.fromList(data));
    
    return [...selector, ...targetPadded, ...valuePadded, ...offset, ...encodedData];
  }

  Future<int> _getNonce(String address) async {
    // Call entryPoint.getNonce(address, 0)
    // TODO: Implement actual RPC call to entry point
    return 0;
  }
}

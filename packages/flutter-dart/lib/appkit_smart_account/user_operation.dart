/// ERC-4337 User Operation
class UserOperation {
  final String sender;
  final int nonce;
  final List<int> initCode;
  final List<int> callData;
  final int callGasLimit;
  final int verificationGasLimit;
  final int preVerificationGas;
  final int maxFeePerGas;
  final int maxPriorityFeePerGas;
  final List<int> paymasterAndData;
  final List<int> signature;

  const UserOperation({
    required this.sender,
    required this.nonce,
    required this.initCode,
    required this.callData,
    required this.callGasLimit,
    required this.verificationGasLimit,
    required this.preVerificationGas,
    required this.maxFeePerGas,
    required this.maxPriorityFeePerGas,
    required this.paymasterAndData,
    required this.signature,
  });

  Map<String, String> toHexParams() => {
        'sender': sender,
        'nonce': '0x${nonce.toRadixString(16)}',
        'initCode': _bytesToHex(initCode),
        'callData': _bytesToHex(callData),
        'callGasLimit': '0x${callGasLimit.toRadixString(16)}',
        'verificationGasLimit': '0x${verificationGasLimit.toRadixString(16)}',
        'preVerificationGas': '0x${preVerificationGas.toRadixString(16)}',
        'maxFeePerGas': '0x${maxFeePerGas.toRadixString(16)}',
        'maxPriorityFeePerGas': '0x${maxPriorityFeePerGas.toRadixString(16)}',
        'paymasterAndData': _bytesToHex(paymasterAndData),
        'signature': _bytesToHex(signature),
      };

  static String _bytesToHex(List<int> bytes) {
    if (bytes.isEmpty) return '0x';
    return '0x${bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
  }
}

import 'dart:typed_data';
import 'package:pointycastle/pointycastle.dart';

/// Cryptographic utilities for ERC-4337 smart account operations.
///
/// Uses pointycastle's Keccak/256 for real Ethereum keccak256 semantics.
class CryptoUtils {
  CryptoUtils._();

  // ---- keccak256 -----------------------------------------------------------

  /// Compute keccak256 hash using pointycastle Keccak/256.
  static Uint8List keccak256(Uint8List data) {
    final digest = Digest('Keccak/256');
    return digest.process(data);
  }

  static Uint8List keccak256String(String s) =>
      keccak256(Uint8List.fromList(s.codeUnits));

  // ---- hex -----------------------------------------------------------------

  static Uint8List hexToBytes(String hex) {
    var h = hex;
    if (h.startsWith('0x') || h.startsWith('0X')) h = h.substring(2);
    if (h.length % 2 != 0) h = '0$h';
    final result = Uint8List(h.length ~/ 2);
    for (var i = 0; i < result.length; i++) {
      result[i] = int.parse(h.substring(i * 2, i * 2 + 2), radix: 16);
    }
    return result;
  }

  static String bytesToHex(Uint8List bytes, {bool prefix = true}) {
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return prefix ? '0x$hex' : hex;
  }

  // ---- ABI encoding --------------------------------------------------------

  /// Left-pad an address to 32 bytes.
  static Uint8List padAddress(String address) {
    final raw = hexToBytes(address);
    final padded = Uint8List(32);
    padded.setRange(32 - raw.length, 32, raw);
    return padded;
  }

  /// Encode an int as a 32-byte big-endian uint256.
  static Uint8List padUint256(int value) {
    final padded = Uint8List(32);
    var v = value;
    for (var i = 31; i >= 0 && v > 0; i--) {
      padded[i] = v & 0xff;
      v >>= 8;
    }
    return padded;
  }

  /// Encode arbitrary bytes as ABI dynamic bytes (length + padded data).
  static Uint8List abiEncodeBytes(Uint8List data) {
    final length = padUint256(data.length);
    final paddedLen = ((data.length + 31) ~/ 32) * 32;
    final padded = Uint8List(paddedLen);
    padded.setRange(0, data.length, data);
    return Uint8List.fromList([...length, ...padded]);
  }

  /// Function selector: first 4 bytes of keccak256(signature).
  static Uint8List functionSelector(String signature) {
    final hash = keccak256String(signature);
    return Uint8List.sublistView(hash, 0, 4);
  }

  // ---- CREATE2 -------------------------------------------------------------

  /// address = keccak256(0xff ++ factory ++ salt ++ keccak256(initCode))[12..]
  static String computeCreate2Address({
    required String factory,
    required Uint8List salt,
    required Uint8List initCode,
  }) {
    final factoryBytes = hexToBytes(factory);
    final initCodeHash = keccak256(initCode);

    final buf = Uint8List(1 + factoryBytes.length + salt.length + initCodeHash.length);
    var pos = 0;
    buf[pos++] = 0xff;
    buf.setRange(pos, pos + factoryBytes.length, factoryBytes);
    pos += factoryBytes.length;
    buf.setRange(pos, pos + salt.length, salt);
    pos += salt.length;
    buf.setRange(pos, pos + initCodeHash.length, initCodeHash);

    final hash = keccak256(buf);
    return bytesToHex(Uint8List.sublistView(hash, 12, 32));
  }
}

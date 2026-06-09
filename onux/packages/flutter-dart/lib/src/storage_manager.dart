/// Storage manager: encrypted session persistence and chain state management.
///
/// Uses flutter_secure_storage for sensitive data (session keys, topics)
/// and SharedPreferences for non-sensitive chain state (last chain, preferences).
library storage_manager;

import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Storage keys.
const String _sessionKey = 'cinacoin_session_data';
const String _sessionExpiryKey = 'cinacoin_session_expiry';
const String _pairingKey = 'cinacoin_pairing_topic';
const String _preferencesKey = 'cinacoin_preferences';

/// SharedPreferences keys.
const String _lastChainKey = 'cinacoin_last_chain';
const String _lastWalletKey = 'cinacoin_last_wallet';
const String _preferencesPrefix = 'cinacoin_pref_';

/// Storage manager handles persistent data across app launches.
///
/// Sensitive data (session tokens, keys) goes through encrypted storage.
/// Non-sensitive preferences and chain state use SharedPreferences.
class StorageManager {
  /// Encrypted storage for sensitive data.
  final FlutterSecureStorage _secureStorage;

  /// Preferences instance (lazy-initialized).
  SharedPreferences? _prefs;

  /// Session TTL.
  final Duration sessionTtl;

  /// Create a storage manager.
  StorageManager({
    FlutterSecureStorage? secureStorage,
    this.sessionTtl = const Duration(days: 7),
  }) : _secureStorage = secureStorage ?? const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
          iOptions: IOSOptions(
            accessibility: KeychainAccessibility.first_unlock_this_device,
          ),
        );

  /// Initialize SharedPreferences.
  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // ── Secure Session Storage ───────────────────────────────────────────

  /// Save a session to encrypted storage.
  Future<void> saveSession(SessionData data) async {
    final serialized = jsonEncode(data.toJson());
    await _secureStorage.write(key: _sessionKey, value: serialized);

    final expiry = DateTime.now().add(sessionTtl);
    await _secureStorage.write(
      key: _sessionExpiryKey,
      value: expiry.toIso8601String(),
    );
  }

  /// Load a session from encrypted storage.
  ///
  /// Returns null if no session exists or if it has expired.
  Future<SessionData?> loadSession() async {
    final raw = await _secureStorage.read(key: _sessionKey);
    if (raw == null) return null;

    // Check expiry
    final expiryStr = await _secureStorage.read(key: _sessionExpiryKey);
    if (expiryStr != null) {
      final expiry = DateTime.parse(expiryStr);
      if (DateTime.now().isAfter(expiry)) {
        await clearSession();
        return null;
      }
    }

    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      return SessionData.fromJson(data);
    } catch (_) {
      await clearSession();
      return null;
    }
  }

  /// Clear the stored session.
  Future<void> clearSession() async {
    await _secureStorage.delete(key: _sessionKey);
    await _secureStorage.delete(key: _sessionExpiryKey);
    await _secureStorage.delete(key: _pairingKey);
  }

  /// Check if a valid session exists.
  Future<bool> hasSession() async {
    final data = await loadSession();
    return data != null && data.isConnected;
  }

  /// Save pairing topic.
  Future<void> savePairingTopic(String topic) async {
    await _secureStorage.write(key: _pairingKey, value: topic);
  }

  /// Load pairing topic.
  Future<String?> loadPairingTopic() async {
    return _secureStorage.read(key: _pairingKey);
  }

  // ── SharedPreferences (Non-sensitive) ────────────────────────────────

  /// Save the last used chain ID.
  Future<void> setLastChainId(int chainId) async {
    await _ensurePrefs();
    await _prefs!.setInt(_lastChainKey, chainId);
  }

  /// Get the last used chain ID.
  Future<int?> getLastChainId() async {
    await _ensurePrefs();
    return _prefs!.getInt(_lastChainKey);
  }

  /// Save the last used wallet ID.
  Future<void> setLastWalletId(String walletId) async {
    await _ensurePrefs();
    await _prefs!.setString(_lastWalletKey, walletId);
  }

  /// Get the last used wallet ID.
  Future<String?> getLastWalletId() async {
    await _ensurePrefs();
    return _prefs!.getString(_lastWalletKey);
  }

  /// Save a preference value.
  Future<void> setPreference(String key, dynamic value) async {
    await _ensurePrefs();
    final fullKey = '$_preferencesPrefix$key';
    if (value is String) {
      await _prefs!.setString(fullKey, value);
    } else if (value is int) {
      await _prefs!.setInt(fullKey, value);
    } else if (value is double) {
      await _prefs!.setDouble(fullKey, value);
    } else if (value is bool) {
      await _prefs!.setBool(fullKey, value);
    } else {
      await _prefs!.setString(fullKey, jsonEncode(value));
    }
  }

  /// Get a preference value.
  Future<dynamic> getPreference(String key, {dynamic defaultValue}) async {
    await _ensurePrefs();
    final fullKey = '$_preferencesPrefix$key';
    return _prefs!.get(fullKey) ?? defaultValue;
  }

  /// Remove a preference.
  Future<void> removePreference(String key) async {
    await _ensurePrefs();
    await _prefs!.remove('$_preferencesPrefix$key');
  }

  /// Clear all preferences.
  Future<void> clearPreferences() async {
    await _ensurePrefs();
    for (final key in _prefs!.getKeys()) {
      if (key.startsWith(_preferencesPrefix)) {
        await _prefs!.remove(key);
      }
    }
  }

  /// Clear all storage (session + preferences).
  Future<void> clearAll() async {
    await clearSession();
    await clearPreferences();
  }

  // ── Private ──────────────────────────────────────────────────────────

  Future<void> _ensurePrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
  }
}

/// Session data stored in encrypted storage.
class SessionData {
  /// Session topic from WalletConnect.
  final String topic;

  /// Connected account addresses.
  final List<String> accounts;

  /// Connected chain ID.
  final int chainId;

  /// Connector/wallet ID.
  final String connectorId;

  /// Whether the session is active.
  final bool isConnected;

  /// ISO timestamp of when the session was created.
  final String createdAt;

  const SessionData({
    required this.topic,
    required this.accounts,
    required this.chainId,
    required this.connectorId,
    this.isConnected = true,
    required this.createdAt,
  });

  /// Convert to JSON.
  Map<String, dynamic> toJson() => {
        'topic': topic,
        'accounts': accounts,
        'chainId': chainId,
        'connectorId': connectorId,
        'isConnected': isConnected,
        'createdAt': createdAt,
      };

  /// Parse from JSON.
  factory SessionData.fromJson(Map<String, dynamic> json) => SessionData(
        topic: json['topic'] as String,
        accounts: List<String>.from(json['accounts'] as List),
        chainId: json['chainId'] as int,
        connectorId: json['connectorId'] as String,
        isConnected: json['isConnected'] as bool? ?? true,
        createdAt: json['createdAt'] as String,
      );

  @override
  String toString() =>
      'SessionData(topic=$topic, accounts=$accounts, chain=$chainId)';
}

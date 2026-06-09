/// WalletConnect v2 pairing, session, and relay management.
///
/// Handles the full WC v2 lifecycle:
/// - Pairing creation and URI generation
/// - Session proposal, approval, and tracking
/// - Deep link handling for wallet apps
/// - QR code URI for manual scanning
/// - Session persistence via flutter_secure_storage
///
/// Designed as a singleton manager that can be used alongside or instead of
/// the existing WalletManager for more granular WC control.
library walletconnect_manager;

import 'dart:async';
import 'dart:convert';

import 'package:walletconnect_flutter_v2/walletconnect_flutter_v2.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';

import 'types.dart';
import 'deep_link_handler.dart';

/// Storage keys for WC session persistence.
const String _wcSessionKey = 'cinacoin_wc_session';
const String _wcSessionExpiryKey = 'cinacoin_wc_session_expiry';
const String _wcPairingKey = 'cinacoin_wc_pairing';

/// Default session TTL: 7 days.
const Duration _wcDefaultTtl = Duration(days: 7);

/// Result of a pairing operation.
class PairingResult {
  /// The WalletConnect URI string for QR display.
  final String uri;

  /// The pairing topic.
  final String pairingTopic;

  const PairingResult({
    required this.uri,
    required this.pairingTopic,
  });

  @override
  String toString() => 'PairingResult(topic=$pairingTopic)';
}

/// Result of a session operation.
class WcSessionResult {
  /// Session topic.
  final String topic;

  /// Connected account addresses.
  final List<String> accounts;

  /// Connected chain IDs (CAIP-2 format).
  final List<String> chains;

  /// Namespace map from the session.
  final Map<String, Namespace> namespaces;

  const WcSessionResult({
    required this.topic,
    required this.accounts,
    required this.chains,
    required this.namespaces,
  });
}

/// WalletConnect v2 manager.
///
/// Provides granular control over WC v2 operations including pairing,
/// session management, deep link routing, and QR code generation.
///
/// Unlike WalletManager which is connection-centric, this class exposes
/// the full WC v2 API surface for advanced integrations.
class WalletConnectManager {
  // ── Configuration ────────────────────────────────────────────────────

  /// Cinacoin / WalletConnect project ID.
  final String projectId;

  /// App metadata for pairing proposals.
  final AppMetadata metadata;

  /// Optional relay URL override.
  final String? relayUrl;

  /// Required namespaces for session proposals.
  final Map<String, RequiredNamespace>? requiredNamespaces;

  /// Optional deep link handler override.
  final DeepLinkHandler? deepLinkHandler;

  /// Session TTL duration.
  final Duration sessionTtl;

  // ── Internal State ────────────────────────────────────────────────────

  IWalletConnectClient? _client;
  bool _initialized = false;
  bool _disposed = false;
  SessionStruct? _activeSession;
  String? _activePairingTopic;
  String? _pairingUri;

  // ── Storage ──────────────────────────────────────────────────────────

  final FlutterSecureStorage _storage;

  // ── Event Streams ────────────────────────────────────────────────────

  final _sessionController = StreamController<WcSessionEvent>.broadcast();
  final _pairingController = StreamController<String>.broadcast();

  /// Stream of session lifecycle events.
  Stream<WcSessionEvent> get sessionEvents => _sessionController.stream;

  /// Stream of pairing URI updates.
  Stream<String> get pairingUriEvents => _pairingController.stream;

  // ── Public Getters ───────────────────────────────────────────────────

  /// Whether the WC client is initialized.
  bool get isInitialized => _initialized;

  /// Whether a session is active.
  bool get hasActiveSession => _activeSession != null && _initialized;

  /// Current session topic (null if no active session).
  String? get activeSessionTopic => _activeSession?.topic;

  /// Current active session struct.
  SessionStruct? get activeSession => _activeSession;

  /// The underlying WC client (for advanced usage).
  IWalletConnectClient get client {
    if (!_initialized) {
      throw StateError('WalletConnectManager not initialized. Call init() first.');
    }
    return _client!;
  }

  /// Constructor.
  WalletConnectManager({
    required this.projectId,
    required this.metadata,
    this.relayUrl,
    this.requiredNamespaces,
    this.deepLinkHandler,
    this.sessionTtl = _wcDefaultTtl,
  }) : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
          iOptions: IOSOptions(
            accessibility: KeychainAccessibility.first_unlock_this_device,
          ),
        );

  // ── Initialization ───────────────────────────────────────────────────

  /// Initialize the WalletConnect v2 client.
  ///
  /// Must be called before any other operations.
  /// Automatically attempts to restore persisted sessions.
  Future<void> init() async {
    if (_initialized || _disposed) return;

    _client = await WalletConnectClient.connect(
      projectId: projectId,
      relayUrl: relayUrl ?? 'wss://relay.walletconnect.com',
      metadata: PairingMetadata(
        name: metadata.name,
        description: metadata.description,
        url: metadata.url,
        icons: metadata.icons,
      ),
    );

    // Set up event listeners
    _client!.onSessionProposal.subscribe(_onSessionProposal);
    _client!.onSessionConnect.subscribe(_onSessionConnect);
    _client!.onSessionDelete.subscribe(_onSessionDelete);
    _client!.onSessionEvent.subscribe(_onSessionEvent);
    _client!.onPairingDelete.subscribe(_onPairingDelete);

    _initialized = true;

    // Restore persisted session
    await _restoreSession();
  }

  // ── Pairing ──────────────────────────────────────────────────────────

  /// Create a new pairing and return the WC URI.
  ///
  /// [chains] list of CAIP-2 chain IDs (default: ['eip155:1']).
  /// [methods] list of supported RPC methods.
  /// [events] list of supported WC events.
  Future<PairingResult> createPairing({
    List<String> chains = const ['eip155:1'],
    List<String>? methods,
    List<String>? events,
  }) async {
    _throwIfNotInitialized();

    final defaultMethods = methods ?? [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v4',
      'wallet_switchEthereumChain',
    ];

    final defaultEvents = events ?? [
      'chainChanged',
      'accountsChanged',
    ];

    final uriData = await _client!.core.pairing.create(
      methods: defaultMethods,
      events: defaultEvents,
      chains: chains,
    );

    _activePairingTopic = uriData.topic;
    _pairingUri = uriData.uri;
    _pairingController.add(uriData.uri);

    // Persist pairing topic
    await _storage.write(key: _wcPairingKey, value: uriData.topic);

    return PairingResult(
      uri: uriData.uri,
      pairingTopic: uriData.topic,
    );
  }

  /// Pair using an existing WC URI (from QR scan or deep link).
  Future<void> pairFromUri(String uri) async {
    _throwIfNotInitialized();

    await _client!.core.pairing.pair(uri: uri);
  }

  /// Get the current pairing URI for QR code display.
  ///
  /// Returns null if no pairing is active.
  String? getPairingUri() => _pairingUri;

  // ── Session ──────────────────────────────────────────────────────────

  /// Approve a pending session proposal.
  Future<WcSessionResult> approveSession({
    required String proposerPublicKey,
    required Map<String, RequiredNamespace> namespaces,
  }) async {
    _throwIfNotInitialized();

    await _client!.approveSession(
      proposerPublicKey: proposerPublicKey,
      requiredNamespaces: namespaces,
    );

    // Wait for session connect event
    final session = await _waitForSessionConnect();

    return _parseSessionResult(session);
  }

  /// Reject a pending session proposal.
  Future<void> rejectSession({
    required String proposerPublicKey,
    String reason = 'User rejected',
  }) async {
    _throwIfNotInitialized();

    await _client!.rejectSession(
      proposerPublicKey: proposerPublicKey,
      reason: WalletConnectError(code: 6000, message: reason),
    );
  }

  /// Disconnect the active session.
  Future<void> disconnect({String? topic}) async {
    _throwIfNotInitialized();

    final t = topic ?? _activeSession?.topic;
    if (t != null) {
      try {
        await _client!.disconnect(
          topic: t,
          reason: const WalletConnectError(
            code: 6000,
            message: 'User disconnected',
          ),
        );
      } catch (_) {
        // Ignore disconnect errors (session may already be gone)
      }
    }

    _activeSession = null;
    _pairingUri = null;
    _activePairingTopic = null;
    _sessionController.add(WcSessionEvent.disconnected());

    await _clearStoredSession();
  }

  // ── Session Requests ─────────────────────────────────────────────────

  /// Send a JSON-RPC request to the connected wallet.
  Future<dynamic> request({
    required String method,
    required List<dynamic> params,
    String? topic,
    String? chainId,
  }) async {
    _throwIfNotInitialized();

    final t = topic ?? _activeSession?.topic;
    if (t == null) {
      throw StateError('No active session. Call createPairing() and approve a session first.');
    }

    return await _client!.request(
      topic: t,
      request: SessionRequestParams(
        method: method,
        params: params,
      ),
      chainId: chainId ?? 'eip155:1',
    );
  }

  // ── Deep Link Handling ───────────────────────────────────────────────

  /// Open a wallet app with a deep link and WC URI.
  Future<void> openWalletWithDeepLink({
    required String walletId,
    required String uri,
  }) async {
    final handler = deepLinkHandler ?? DeepLinkHandler();
    await handler.openDeepLink(DeepLinkParams(walletId: walletId, uri: uri));
  }

  /// Handle an incoming deep link URI.
  Future<void> handleDeepLink(String uri) async {
    _throwIfNotInitialized();

    // Parse the WC URI and pair
    await pairFromUri(uri);
  }

  // ── Session Persistence ──────────────────────────────────────────────

  /// Restore a previously persisted session from encrypted storage.
  Future<SessionStruct?> tryRestoreSession() async {
    if (!_initialized) return null;

    try {
      final raw = await _storage.read(key: _wcSessionKey);
      final expiryStr = await _storage.read(key: _wcSessionExpiryKey);

      if (raw == null || expiryStr == null) return null;

      // Check expiry
      final expiry = DateTime.parse(expiryStr);
      if (DateTime.now().isAfter(expiry)) {
        await _clearStoredSession();
        return null;
      }

      // Restore from WC client using persisted topic
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final topic = data['topic'] as String?;

      if (topic != null) {
        final sessions = _client!.session.values;
        for (final session in sessions) {
          if (session.topic == topic) {
            _activeSession = session;
            _sessionController.add(WcSessionEvent.restored(
              topic: session.topic,
              accounts: _extractAccounts(session),
              chains: _extractChains(session),
            ));
            return session;
          }
        }
      }
    } catch (_) {
      await _clearStoredSession();
    }

    return null;
  }

  // ── Utilities ────────────────────────────────────────────────────────

  /// Get all active pairings.
  List<PairingStruct> getActivePairings() {
    _throwIfNotInitialized();
    return _client!.core.pairing.getPairings();
  }

  /// Get all active sessions.
  List<SessionStruct> getActiveSessions() {
    _throwIfNotInitialized();
    return _client!.session.values;
  }

  /// Delete a pairing by topic.
  Future<void> deletePairing(String topic) async {
    _throwIfNotInitialized();
    await _client!.core.pairing.disconnect(topic: topic);
  }

  /// Check if a chain is supported in required namespaces.
  bool isChainSupported(String chainId) {
    final ns = requiredNamespaces;
    if (ns == null) return true;
    for (final namespace in ns.values) {
      if (namespace.chains?.contains(chainId) == true) return true;
    }
    return false;
  }

  /// Dispose of all resources.
  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;

    await _sessionController.close();
    await _pairingController.close();

    if (_initialized) {
      try {
        await _client!.core.disconnect();
      } catch (_) {}
    }
  }

  // ── Private: Event Handlers ──────────────────────────────────────────

  void _onSessionProposal(dynamic proposal) {
    if (proposal != null) {
      _sessionController.add(WcSessionEvent.proposalReceived(
        proposerName: proposal.proposer.metadata.name,
        proposerUrl: proposal.proposer.metadata.url,
        proposerIcons: proposal.proposer.metadata.icons,
        requiredNamespaces: proposal.requiredNamespaces,
      ));
    }
  }

  Future<void> _onSessionConnect(dynamic session) async {
    if (session != null) {
      _activeSession = session;
      _sessionController.add(WcSessionEvent.connected(
        topic: session.topic,
        accounts: _extractAccounts(session),
        chains: _extractChains(session),
      ));

      // Persist session
      await _persistSession(session);
    }
  }

  void _onSessionDelete(dynamic event) {
    _activeSession = null;
    _pairingUri = null;
    _sessionController.add(WcSessionEvent.disconnected());
  }

  void _onSessionEvent(dynamic event) {
    // Handle chainChanged, accountsChanged events
  }

  void _onPairingDelete(dynamic event) {
    _activePairingTopic = null;
    _pairingUri = null;
  }

  // ── Private: Helpers ─────────────────────────────────────────────────

  Future<SessionStruct> _waitForSessionConnect() async {
    final completer = Completer<SessionStruct>();

    final sub = _client!.onSessionConnect.subscribe((session) {
      if (session != null && !completer.isCompleted) {
        completer.complete(session);
      }
    });

    // Timeout after 3 minutes
    Timer(const Duration(minutes: 3), () {
      if (!completer.isCompleted) {
        completer.completeError(TimeoutException('Session approval timed out'));
      }
    });

    final result = await completer.future;
    await sub.cancel();
    return result;
  }

  WcSessionResult _parseSessionResult(SessionStruct session) {
    return WcSessionResult(
      topic: session.topic,
      accounts: _extractAccounts(session),
      chains: _extractChains(session),
      namespaces: session.namespaces,
    );
  }

  List<String> _extractAccounts(SessionStruct session) {
    final accounts = <String>[];
    for (final ns in session.namespaces.values) {
      accounts.addAll(ns.accounts);
    }
    return accounts.map((a) {
      final parts = a.split(':');
      return parts.length == 3 ? parts[2] : a;
    }).toList();
  }

  List<String> _extractChains(SessionStruct session) {
    final chains = <String>{};
    for (final ns in session.namespaces.values) {
      for (final account in ns.accounts) {
        final parts = account.split(':');
        if (parts.length >= 2) {
          chains.add('${parts[0]}:${parts[1]}');
        }
      }
    }
    return chains.toList();
  }

  Future<void> _persistSession(SessionStruct session) async {
    try {
      final data = {
        'topic': session.topic,
        'createdAt': DateTime.now().toIso8601String(),
      };

      await _storage.write(key: _wcSessionKey, value: jsonEncode(data));

      final expiry = DateTime.now().add(sessionTtl);
      await _storage.write(
        key: _wcSessionExpiryKey,
        value: expiry.toIso8601String(),
      );
    } catch (_) {
      // Storage failure — non-fatal
    }
  }

  Future<void> _clearStoredSession() async {
    try {
      await _storage.delete(key: _wcSessionKey);
      await _storage.delete(key: _wcSessionExpiryKey);
      await _storage.delete(key: _wcPairingKey);
    } catch (_) {}
  }

  Future<void> _restoreSession() async {
    try {
      final pairingTopic = await _storage.read(key: _wcPairingKey);
      if (pairingTopic != null) {
        _activePairingTopic = pairingTopic;
      }
    } catch (_) {}
  }

  void _throwIfNotInitialized() {
    if (!_initialized) {
      throw StateError('WalletConnectManager not initialized. Call init() first.');
    }
    if (_disposed) {
      throw StateError('WalletConnectManager has been disposed.');
    }
  }
}

// ── WcSessionEvent ──────────────────────────────────────────────────────

/// Union type for WalletConnect session events.
sealed class WcSessionEvent {
  const WcSessionEvent();

  const factory WcSessionEvent.proposalReceived({
    required String proposerName,
    required String proposerUrl,
    required List<String> proposerIcons,
    required Map<String, RequiredNamespace> requiredNamespaces,
  }) = _WcProposalEvent;

  const factory WcSessionEvent.connected({
    required String topic,
    required List<String> accounts,
    required List<String> chains,
  }) = _WcConnectedEvent;

  const factory WcSessionEvent.disconnected() = _WcDisconnectedEvent;

  const factory WcSessionEvent.restored({
    required String topic,
    required List<String> accounts,
    required List<String> chains,
  }) = _WcRestoredEvent;
}

final class _WcProposalEvent extends WcSessionEvent {
  final String proposerName;
  final String proposerUrl;
  final List<String> proposerIcons;
  final Map<String, RequiredNamespace> requiredNamespaces;
  const _WcProposalEvent({
    required this.proposerName,
    required this.proposerUrl,
    required this.proposerIcons,
    required this.requiredNamespaces,
  });
  @override
  String toString() => 'WcSessionEvent.proposalReceived(name=$proposerName)';
}

final class _WcConnectedEvent extends WcSessionEvent {
  final String topic;
  final List<String> accounts;
  final List<String> chains;
  const _WcConnectedEvent({
    required this.topic,
    required this.accounts,
    required this.chains,
  });
  @override
  String toString() => 'WcSessionEvent.connected(topic=$topic)';
}

final class _WcDisconnectedEvent extends WcSessionEvent {
  const _WcDisconnectedEvent();
  @override
  String toString() => 'WcSessionEvent.disconnected()';
}

final class _WcRestoredEvent extends WcSessionEvent {
  final String topic;
  final List<String> accounts;
  final List<String> chains;
  const _WcRestoredEvent({
    required this.topic,
    required this.accounts,
    required this.chains,
  });
  @override
  String toString() => 'WcSessionEvent.restored(topic=$topic)';
}

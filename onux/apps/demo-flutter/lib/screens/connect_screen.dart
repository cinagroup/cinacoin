import 'package:flutter/material.dart';
import '../main.dart';
import '../widgets/status_card.dart';
import '../widgets/info_row.dart';
import '../widgets/wallet_tile.dart';

/// Wallet connection screen with available wallets and connect/disconnect flow.
class ConnectScreen extends StatefulWidget {
  const ConnectScreen({super.key});

  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> {
  bool _isConnecting = false;
  bool _isConnected = false;
  String _statusText = 'Not connected';
  List<String> _accounts = [];
  String? _pairingUri;
  String _statusMessage = '';

  // Demo wallet list for display
  final List<Map<String, String>> _demoWallets = const [
    {'id': 'metamask', 'name': 'MetaMask', 'icon': '🦊'},
    {'id': 'walletconnect', 'name': 'WalletConnect', 'icon': '🔵'},
    {'id': 'rainbow', 'name': 'Rainbow', 'icon': '🌈'},
    {'id': 'coinbase', 'name': 'Coinbase Wallet', 'icon': '🔷'},
    {'id': 'trust', 'name': 'Trust Wallet', 'icon': '🛡️'},
    {'id': 'phantom', 'name': 'Phantom', 'icon': '👻'},
    {'id': 'ledger', 'name': 'Ledger Live', 'icon': '🔒'},
    {'id': 'okx', 'name': 'OKX Wallet', 'icon': '⬛'},
  ];

  @override
  void initState() {
    super.initState();
    _refreshState();
    sdk.stateChanges.listen((state) {
      if (mounted) _refreshState();
    });
  }

  void _refreshState() {
    setState(() {
      _isConnected = sdk.isConnected;
      _statusText = _isConnected ? 'Connected' : 'Disconnected';
      _accounts = sdk.accounts;
    });
  }

  Future<void> _connect() async {
    setState(() {
      _isConnecting = true;
      _statusMessage = 'Creating pairing...';
    });

    try {
      final pairing = await sdk.createPairing(
        chains: const ['eip155:1', 'eip155:137', 'eip155:42161'],
      );

      setState(() {
        _pairingUri = pairing.uri;
        _statusMessage = 'Scan the QR code with your wallet';
        _isConnecting = false;
      });

      _showPairingDialog(pairing.uri);
    } catch (e) {
      setState(() {
        _isConnecting = false;
        _statusMessage = 'Connection failed: $e';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to connect: $e')),
        );
      }
    }
  }

  Future<void> _disconnect() async {
    try {
      await sdk.disconnect();
      setState(() {
        _pairingUri = null;
        _statusMessage = 'Disconnected';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Wallet disconnected')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Disconnect failed: $e')),
        );
      }
    }
  }

  void _showPairingDialog(String uri) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Connect Wallet'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Scan this QR code with your wallet app'),
            const SizedBox(height: 16),
            Container(
              width: 200,
              height: 200,
              color: Colors.white,
              child: Center(
                child: Text(
                  'QR Code',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SelectableText(
              uri,
              style: const TextStyle(fontSize: 10),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Connection Status
        StatusCard(
          isConnected: _isConnected,
          statusText: _statusText,
          subtitle: _statusMessage.isEmpty
              ? (_isConnected
                  ? '${_accounts.length} account(s) connected'
                  : 'Tap "Connect" to scan a QR code')
              : _statusMessage,
        ),
        const SizedBox(height: 20),

        // Connect/Disconnect Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isConnecting
                ? null
                : (_isConnected ? _disconnect : _connect),
            icon: Icon(_isConnected ? Icons.link_off : Icons.qr_code_scanner),
            label: Text(_isConnected ? 'Disconnect Wallet' : 'Connect Wallet'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: _isConnected
                  ? Colors.red.shade600
                  : theme.colorScheme.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Connected Accounts
        if (_accounts.isNotEmpty) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.check_circle,
                          color: theme.colorScheme.secondary),
                      const SizedBox(width: 8),
                      Text(
                        'Connected Accounts',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  for (int i = 0; i < _accounts.length; i++)
                    InfoRow(
                      label: 'Account ${i + 1}',
                      value: _truncateAddress(_accounts[i]),
                      copyable: true,
                      copyText: _accounts[i],
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Available Wallets
        Text(
          'Available Wallets',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        ..._demoWallets.map((wallet) => WalletTile(
              id: wallet['id']!,
              name: wallet['name']!,
              icon: wallet['icon']!,
              onTap: _isConnected ? null : () => _connect(),
            )),

        const SizedBox(height: 24),

        // Info
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How it works',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '1. Tap "Connect Wallet" to generate a WalletConnect pairing URI\n'
                  '2. Scan the QR code with your mobile wallet app\n'
                  '3. Approve the connection in your wallet\n'
                  '4. You\'re ready to sign messages and send transactions!',
                  style: TextStyle(height: 1.6),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _truncateAddress(String address) {
    if (address.length <= 16) return address;
    return '${address.substring(0, 8)}...${address.substring(address.length - 6)}';
  }
}

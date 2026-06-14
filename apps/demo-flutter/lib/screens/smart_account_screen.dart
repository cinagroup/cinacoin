import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cinacoin/appkit_smart_account.dart';

class SmartAccountScreen extends StatefulWidget {
  const SmartAccountScreen({super.key});
  @override
  State<SmartAccountScreen> createState() => _SmartAccountScreenState();
}

class _SmartAccountScreenState extends State<SmartAccountScreen> {
  final _manager = SmartAccountManager();
  final _ownerController = TextEditingController(text: '0x1234567890abcdef1234567890abcdef12345678');
  bool _isLoading = false;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _ownerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Icon(
                  _manager.smartAccountAddress != null ? Icons.account_box : Icons.account_box_outlined,
                  size: 48,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(height: 8),
                Text(
                  _manager.smartAccountAddress != null ? 'Smart Account Ready' : 'No Smart Account',
                  style: theme.textTheme.titleMedium,
                ),
                if (_manager.smartAccountAddress != null) ...[
                  const SizedBox(height: 4),
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: _manager.smartAccountAddress!));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Address copied')),
                      );
                    },
                    child: Text(
                      _shorten(_manager.smartAccountAddress!),
                      style: const TextStyle(fontFamily: 'monospace'),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _manager.isDeployed ? '✅ Deployed' : '⏳ Not deployed',
                    style: TextStyle(
                      color: _manager.isDeployed ? Colors.green : Colors.orange,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Owner Address Input
        TextField(
          controller: _ownerController,
          decoration: const InputDecoration(
            labelText: 'Owner Address (EOA)',
            border: OutlineInputBorder(),
            hintText: '0x...',
          ),
        ),
        const SizedBox(height: 16),

        // Actions
        Row(
          children: [
            Expanded(
              child: ElevatedButton(
                onPressed: _isLoading ? null : _createAccount,
                child: const Text('Create'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: _isLoading || _manager.smartAccountAddress == null ? null : _deployAccount,
                child: const Text('Deploy'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Info
        Text('About Smart Accounts', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        const Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'ERC-4337 Smart Accounts provide:\n\n'
              '• Gasless transactions (paymaster)\n'
              '• Batch transactions in a single UserOp\n'
              '• Social recovery mechanisms\n'
              '• Custom validation logic\n'
              '• Session keys for dApp interactions\n\n'
              'The smart account is deployed counterfactually — '
              'it only gets deployed on-chain when the first transaction is sent.',
              style: TextStyle(height: 1.6),
            ),
          ),
        ),

        if (_error != null) ...[
          const SizedBox(height: 16),
          Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
        ],
        if (_info != null) ...[
          const SizedBox(height: 16),
          Text(_info!, style: TextStyle(color: theme.colorScheme.primary)),
        ],
      ],
    );
  }

  Future<void> _createAccount() async {
    setState(() { _isLoading = true; _error = null; _info = null; });
    try {
      final address = await _manager.getSmartAccount(
        ownerAddress: _ownerController.text,
      );
      setState(() => _info = 'Smart account created: ${_shorten(address)}');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deployAccount() async {
    setState(() { _isLoading = true; _error = null; _info = null; });
    try {
      final txHash = await _manager.deploy(
        ownerAddress: _ownerController.text,
      );
      setState(() => _info = 'Deployed! TX: ${_shorten(txHash)}');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String _shorten(String s) {
    if (s.length <= 16) return s;
    return '${s.substring(0, 8)}...${s.substring(s.length - 6)}';
  }
}

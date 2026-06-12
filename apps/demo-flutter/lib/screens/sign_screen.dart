import 'package:flutter/material.dart';
import '../main.dart';
import '../widgets/status_card.dart';

/// Sign screen with message input, sign button, signature display, and EIP-712 demo.
class SignScreen extends StatefulWidget {
  const SignScreen({super.key});

  @override
  State<SignScreen> createState() => _SignScreenState();
}

class _SignScreenState extends State<SignScreen> {
  final _messageController = TextEditingController(
    text: 'Hello CinaCoin! Sign this message.',
  );
  final _typedDataController = TextEditingController();
  bool _isSigning = false;
  String _signature = '';
  String _statusMessage = '';

  // Sample EIP-712 typed data
  final String _sampleEip712 = '''{
  "types": {
    "EIP712Domain": [
      {"name": "name", "type": "string"},
      {"name": "version", "type": "string"},
      {"name": "chainId", "type": "uint256"}
    ],
    "Message": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "contents", "type": "string"}
    ]
  },
  "primaryType": "Message",
  "domain": {
    "name": "CinaCoin Demo",
    "version": "1",
    "chainId": 1
  },
  "message": {
    "from": "0xCb2C2B8f0CC2F3E2C2A2A2A2A2A2A2A2A2A2A2A2",
    "to": "0xDeadDeadDeadDeadDeadDeadDeadDeadDeadDead",
    "contents": "Hello from CinaCoin Flutter SDK!"
  }
}''';

  @override
  void dispose() {
    _messageController.dispose();
    _typedDataController.dispose();
    super.dispose();
  }

  Future<void> _signMessage() async {
    if (!sdk.isConnected) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Connect a wallet first to sign messages'),
        ),
      );
      return;
    }

    final message = _messageController.text.trim();
    if (message.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a message to sign')),
      );
      return;
    }

    setState(() {
      _isSigning = true;
      _statusMessage = 'Signing message...';
      _signature = '';
    });

    try {
      final result = await sdk.personalSign(message: message);
      setState(() {
        _signature = result.signature;
        _statusMessage = 'Signed successfully!';
      });
    } catch (e) {
      setState(() {
        _statusMessage = 'Signing failed: $e';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Signing failed: $e')),
        );
      }
    } finally {
      setState(() => _isSigning = false);
    }
  }

  Future<void> _signTypedData() async {
    if (!sdk.isConnected) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Connect a wallet first to sign typed data'),
        ),
      );
      return;
    }

    final typedData =
        _typedDataController.text.trim().isEmpty
            ? _sampleEip712
            : _typedDataController.text.trim();

    setState(() {
      _isSigning = true;
      _statusMessage = 'Signing EIP-712 typed data...';
      _signature = '';
    });

    try {
      final result = await sdk.signTypedDataV4(typedData: typedData);
      setState(() {
        _signature = result.signature;
        _statusMessage = 'EIP-712 signed successfully!';
      });
    } catch (e) {
      setState(() {
        _statusMessage = 'Typed data signing failed: $e';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Signing failed: $e')),
        );
      }
    } finally {
      setState(() => _isSigning = false);
    }
  }

  Future<void> _copySignature() async {
    // Copy signature to clipboard
    // In a real app: await Clipboard.setData(ClipboardData(text: _signature));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Signature copied!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status
        StatusCard(
          isConnected: sdk.isConnected,
          statusText: _statusMessage.isEmpty
              ? (sdk.isConnected ? 'Ready to sign' : 'Not connected')
              : _statusMessage,
          subtitle: sdk.isConnected
              ? 'Account: ${sdk.accounts.firstOrNull ?? "N/A"}'
              : 'Connect a wallet to sign messages',
        ),
        const SizedBox(height: 20),

        // Personal Sign
        Text(
          'EIP-191: Personal Sign',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Message to sign',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _messageController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Enter message to sign...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.all(12),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isSigning ? null : _signMessage,
                    icon: _isSigning
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.draw),
                    label: Text(
                      _isSigning ? 'Signing...' : 'Sign Message',
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        // EIP-712 Typed Data
        Text(
          'EIP-712: Typed Data Sign',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Typed Data (JSON)',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _typedDataController,
                  maxLines: 8,
                  decoration: InputDecoration(
                    hintText: _sampleEip712.length > 50
                        ? _sampleEip712.substring(0, 50)
                        : _sampleEip712,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.all(12),
                  ),
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: () {
                    _typedDataController.text = _sampleEip712;
                  },
                  icon: const Icon(Icons.restore, size: 18),
                  label: const Text('Load sample EIP-712 data'),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isSigning ? null : _signTypedData,
                    icon: _isSigning
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.auto_fix_high),
                    label: Text(
                      _isSigning
                          ? 'Signing Typed Data...'
                          : 'Sign Typed Data (EIP-712)',
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Signature Result
        if (_signature.isNotEmpty)
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
                        'Signature Result',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  SelectableText(
                    _signature,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: _copySignature,
                    icon: const Icon(Icons.copy, size: 18),
                    label: const Text('Copy Signature'),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

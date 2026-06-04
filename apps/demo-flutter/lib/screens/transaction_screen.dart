import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../main.dart';
import '../widgets/status_card.dart';
import '../widgets/info_row.dart';

/// Transaction screen with ETH transfer form, gas estimation, send, and tracking.
class TransactionScreen extends StatefulWidget {
  const TransactionScreen({super.key});

  @override
  State<TransactionScreen> createState() => _TransactionScreenState();
}

class _TransactionScreenState extends State<TransactionScreen> {
  final _toController = TextEditingController();
  final _amountController = TextEditingController();
  final _dataController = TextEditingController();

  bool _isSending = false;
  bool _isEstimating = false;
  String _estimatedFee = '';
  String _txHash = '';
  String _txStatus = '';
  String _statusMessage = '';

  String _currentChainId = 'eip155:1';
  final List<String> _targetChains = const [
    'eip155:1',
    'eip155:137',
    'eip155:42161',
    'eip155:10',
  ];

  @override
  void dispose() {
    _toController.dispose();
    _amountController.dispose();
    _dataController.dispose();
    super.dispose();
  }

  String _getChainSymbol(String chainId) {
    final config = sdk.getChainConfig(chainId);
    return config?.symbol ?? 'ETH';
  }

  String _getChainExplorer(String chainId) {
    final config = sdk.getChainConfig(chainId);
    return config?.explorerUrl ?? '';
  }

  Future<void> _estimateGas() async {
    final to = _toController.text.trim();
    final amount = _amountController.text.trim();

    if (to.isEmpty || to.length < 42) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid recipient address')),
      );
      return;
    }

    setState(() {
      _isEstimating = true;
      _estimatedFee = '';
    });

    try {
      final from =
          sdk.accounts.isNotEmpty ? sdk.accounts.first : '0x0000000000000000000000000000000000000000';

      final weiAmount = _ethToWei(amount.isEmpty ? '0' : amount);
      final fee = await sdk.estimateFee(
        from: from,
        to: to,
        value: weiAmount,
        chainId: _currentChainId,
      );

      setState(() {
        _estimatedFee = fee;
        _isEstimating = false;
      });
    } catch (e) {
      setState(() {
        _isEstimating = false;
        _estimatedFee = 'Error: $e';
      });
    }
  }

  Future<void> _sendTransaction() async {
    if (!sdk.isConnected) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Connect a wallet first to send transactions'),
        ),
      );
      return;
    }

    final to = _toController.text.trim();
    final amount = _amountController.text.trim();

    if (to.isEmpty || to.length < 42) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid recipient address')),
      );
      return;
    }

    if (amount.isEmpty || double.tryParse(amount) == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid amount')),
      );
      return;
    }

    setState(() {
      _isSending = true;
      _txHash = '';
      _txStatus = '';
      _statusMessage = 'Sending transaction...';
    });

    try {
      final from = sdk.accounts.first;
      final weiAmount = _ethToWei(amount);
      final data =
          _dataController.text.trim().isEmpty
              ? '0x'
              : _dataController.text.trim();

      final hash = await sdk.sendViaWalletConnect(
        from: from,
        to: to,
        value: weiAmount,
        data: data,
        chainId: _currentChainId,
      );

      setState(() {
        _txHash = hash;
        _txStatus = 'Pending';
        _statusMessage = 'Transaction submitted!';
        _isSending = false;
      });

      // Start polling
      _pollTransaction(hash);
    } catch (e) {
      setState(() {
        _isSending = false;
        _statusMessage = 'Transaction failed: $e';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Transaction failed: $e')),
        );
      }
    }
  }

  Future<void> _pollTransaction(String hash) async {
    setState(() => _statusMessage = 'Polling for confirmation...');

    try {
      final event = await sdk.pollTransaction(
        hash,
        maxAttempts: 15,
        intervalMs: 4000,
        chainId: _currentChainId,
      );

      final statusStr = event.status.toString().split('.').last;
      if (mounted) {
        setState(() {
          _txStatus = statusStr;
          _statusMessage = 'Transaction $statusStr!';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Transaction $statusStr'),
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _statusMessage = 'Polling failed: $e');
      }
    }
  }

  Future<void> _openExplorer() async {
    if (_txHash.isEmpty) return;
    final explorer = _getChainExplorer(_currentChainId);
    if (explorer.isEmpty) return;
    final url = '$explorer/tx/$_txHash';
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  String _ethToWei(String eth) {
    final value = double.tryParse(eth) ?? 0;
    final wei = (value * 1e18).toInt();
    return '0x${wei.toRadixString(16)}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final symbol = _getChainSymbol(_currentChainId);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Chain Selector
        StatusCard(
          isConnected: sdk.isConnected,
          statusText: 'Send $symbol',
          subtitle: 'Network: ${sdk.getChainConfig(_currentChainId)?.name ?? _currentChainId}',
        ),
        const SizedBox(height: 12),

        // Chain selector dropdown
        Card(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: DropdownButtonFormField<String>(
              value: _currentChainId,
              decoration: InputDecoration(
                labelText: 'Target Chain',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              items: _targetChains.map((chainId) {
                final config = sdk.getChainConfig(chainId);
                return DropdownMenuItem(
                  value: chainId,
                  child: Text(
                    '${config?.name ?? chainId} (${config?.symbol ?? ''})',
                  ),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _currentChainId = value);
                }
              },
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Transaction Form
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Transfer Form',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),

                // Recipient
                TextField(
                  controller: _toController,
                  decoration: InputDecoration(
                    labelText: 'Recipient Address',
                    hintText: '0x...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    prefixIcon: const Icon(Icons.account_circle),
                  ),
                ),
                const SizedBox(height: 16),

                // Amount
                TextField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: 'Amount',
                    hintText: '0.0',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    prefixIcon: const Icon(Icons.currency_exchange),
                    suffixText: symbol,
                  ),
                ),
                const SizedBox(height: 16),

                // Data (optional)
                TextField(
                  controller: _dataController,
                  decoration: InputDecoration(
                    labelText: 'Data (optional)',
                    hintText: '0x...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    prefixIcon: const Icon(Icons.data_object),
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),

                // Estimate Button
                OutlinedButton.icon(
                  onPressed: _isEstimating ? null : _estimateGas,
                  icon: _isEstimating
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.calculate, size: 18),
                  label: Text(_isEstimating ? 'Estimating...' : 'Estimate Gas'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 48),
                  ),
                ),
                if (_estimatedFee.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      'Estimated Fee: $_estimatedFee $symbol',
                      style: TextStyle(
                        color: theme.colorScheme.secondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 16),

                // Send Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isSending ? null : _sendTransaction,
                    icon: _isSending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.send),
                    label: Text(
                      _isSending ? 'Sending...' : 'Send Transaction',
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Transaction Result
        if (_txHash.isNotEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _txStatus == 'confirmed'
                            ? Icons.check_circle
                            : _txStatus == 'failed' || _txStatus == 'dropped'
                                ? Icons.error
                                : Icons.hourglass_empty,
                        color: _txStatus == 'confirmed'
                            ? Colors.green
                            : _txStatus == 'failed' || _txStatus == 'dropped'
                                ? Colors.red
                                : Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Transaction Status',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  InfoRow(label: 'Hash', value: _txHash),
                  InfoRow(
                    label: 'Status',
                    value: _txStatus.isEmpty ? 'Pending' : _txStatus,
                  ),
                  InfoRow(label: 'Network', value: _currentChainId),
                  const SizedBox(height: 12),

                  // Explorer Link
                  if (_getChainExplorer(_currentChainId).isNotEmpty)
                    OutlinedButton.icon(
                      onPressed: _openExplorer,
                      icon: const Icon(Icons.open_in_new, size: 18),
                      label: const Text('View on Explorer'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 48),
                      ),
                    ),
                ],
              ),
            ),
          ),
        if (_statusMessage.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _statusMessage,
              style: TextStyle(
                color: _statusMessage.contains('failed')
                    ? Colors.red
                    : _statusMessage.contains('successfully')
                        ? Colors.green
                        : null,
              ),
            ),
          ),
      ],
    );
  }
}

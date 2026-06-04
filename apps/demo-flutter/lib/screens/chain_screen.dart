import 'package:flutter/material.dart';
import '../main.dart';
import '../widgets/chain_tile.dart';
import '../widgets/status_card.dart';

/// Chain screen with list of supported chains, chain switching, and info display.
class ChainScreen extends StatefulWidget {
  const ChainScreen({super.key});

  @override
  State<ChainScreen> createState() => _ChainScreenState();
}

class _ChainScreenState extends State<ChainScreen> {
  String _currentChain = 'eip155:1';
  List<String> _allChains = [];

  @override
  void initState() {
    super.initState();
    _loadChains();
  }

  Future<void> _loadChains() async {
    final chains = sdk.getSupportedChains();
    final lastChain = await sdk.getLastChainId();
    setState(() {
      _allChains = chains;
      _currentChain = lastChain != null ? 'eip155:$lastChain' : 'eip155:1';
    });
  }

  Future<void> _switchChain(String chainId) async {
    if (!sdk.isConnected) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Connect a wallet first to switch chains'),
        ),
      );
      return;
    }

    try {
      await sdk.switchChain(chainId);
      setState(() => _currentChain = chainId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Switched to ${_getChainName(chainId)}'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Chain switch failed: $e')),
        );
      }
    }
  }

  String _getChainName(String chainId) {
    final config = sdk.getChainConfig(chainId);
    return config?.name ?? chainId;
  }

  String _getChainSymbol(String chainId) {
    final config = sdk.getChainConfig(chainId);
    return config?.symbol ?? '';
  }

  String _getChainExplorer(String chainId) {
    final config = sdk.getChainConfig(chainId);
    return config?.explorerUrl ?? '—';
  }

  String _getChainType(String chainId) {
    final config = sdk.getChainConfig(chainId);
    if (config == null) return '';
    return config.id.startsWith('eip155') ? 'EVM' : 'Non-EVM';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Group chains by type
    final evmChains = _allChains.where((c) => c.startsWith('eip155')).toList();
    final nonEvmChains =
        _allChains.where((c) => !c.startsWith('eip155')).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Current Chain Status
        StatusCard(
          isConnected: sdk.isConnected,
          statusText: 'Current Chain',
          subtitle: '${_getChainName(_currentChain)} ($_currentChain)',
        ),
        const SizedBox(height: 16),

        // Current Chain Details
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.info_outline,
                        color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Chain Details',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                _infoItem('Chain ID', _currentChain),
                _infoItem('Name', _getChainName(_currentChain)),
                _infoItem('Symbol', _getChainSymbol(_currentChain)),
                _infoItem('Type', _getChainType(_currentChain)),
                _infoItem('Explorer', _getChainExplorer(_currentChain)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // EVM Chains
        Text(
          'EVM Chains',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        ...evmChains.map((chain) => ChainTile(
              chainId: chain,
              name: _getChainName(chain),
              symbol: _getChainSymbol(chain),
              isActive: chain == _currentChain,
              onTap: () => _switchChain(chain),
            )),

        const SizedBox(height: 24),

        // Non-EVM Chains
        Text(
          'Non-EVM Chains',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        ...nonEvmChains.map((chain) => ChainTile(
              chainId: chain,
              name: _getChainName(chain),
              symbol: _getChainSymbol(chain),
              isActive: chain == _currentChain,
              onTap: () => _switchChain(chain),
            )),
      ],
    );
  }

  Widget _infoItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: SelectableText(
              value,
              style: const TextStyle(fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

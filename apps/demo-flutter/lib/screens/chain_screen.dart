import 'package:flutter/material.dart';
import 'package:cinacoin/appkit_config.dart';
import '../widgets/status_card.dart';

/// Chain screen using AppKit ChainRegistry for chain display and selection.
class ChainScreen extends StatefulWidget {
  const ChainScreen({super.key});

  @override
  State<ChainScreen> createState() => _ChainScreenState();
}

class _ChainScreenState extends State<ChainScreen> {
  int _selectedChainId = 1;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selectedChain = ChainRegistry.getChain(_selectedChainId);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Current Chain Status
        StatusCard(
          isConnected: true,
          statusText: 'Current Chain',
          subtitle: selectedChain != null
              ? '${selectedChain.name} (Chain ID: ${selectedChain.chainId})'
              : 'No chain selected',
        ),
        const SizedBox(height: 16),

        // Current Chain Details
        if (selectedChain != null)
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
                  _infoItem('Chain ID', '${selectedChain.chainId}'),
                  _infoItem('Name', selectedChain.name),
                  _infoItem('Symbol', selectedChain.symbol),
                  _infoItem('Short Name', selectedChain.shortName.toUpperCase()),
                  _infoItem('RPC URL', selectedChain.rpcUrl),
                  _infoItem('Explorer', selectedChain.explorerUrl),
                ],
              ),
            ),
          ),
        const SizedBox(height: 24),

        // All Supported Chains
        Text(
          'Supported Chains',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        ...ChainRegistry.allEVMChains.map((chain) => Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundImage: chain.iconUrl != null ? NetworkImage(chain.iconUrl!) : null,
              child: chain.iconUrl == null ? Text(chain.shortName[0].toUpperCase()) : null,
            ),
            title: Text(chain.name),
            subtitle: Text('Chain ID: ${chain.chainId}'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(chain.symbol, style: const TextStyle(fontWeight: FontWeight.w500)),
                const SizedBox(width: 8),
                if (chain.chainId == _selectedChainId)
                  Icon(Icons.check_circle, color: theme.colorScheme.primary, size: 20),
              ],
            ),
            onTap: () {
              setState(() => _selectedChainId = chain.chainId);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Switched to ${chain.name}'),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          ),
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
            width: 90,
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

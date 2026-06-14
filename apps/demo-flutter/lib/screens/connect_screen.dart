import 'package:flutter/material.dart';
import 'package:cinacoin/appkit_ui.dart';
import 'package:cinacoin/appkit_config.dart';

class ConnectScreen extends StatelessWidget {
  const ConnectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // AppKit Connect Button
        CinacoinConnectButton(
          onPressed: () {
            CinacoinConnectSheet.show(
              context: context,
              onWalletSelect: (wallet) {
                debugPrint('Selected wallet: ${wallet.name}');
              },
            );
          },
        ),
        const SizedBox(height: 24),

        // Account Card (show when connected)
        CinacoinAccountCard(
          address: '0x1234567890abcdef1234567890abcdef12345678',
          chainId: 1,
          onDisconnect: () {
            debugPrint('Disconnect requested');
          },
        ),
        const SizedBox(height: 24),

        // Chain Selector
        const Center(
          child: CinacoinChainSelector(
            selectedChainId: 1,
            onChainSelected: (chainId) {
              debugPrint('Switched to chain: $chainId');
            },
          ),
        ),
        const SizedBox(height: 24),

        // Supported Chains List
        Text(
          'Supported Chains',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        ...ChainRegistry.allEVMChains.map((chain) => Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundImage: chain.iconUrl != null ? NetworkImage(chain.iconUrl!) : null,
              child: chain.iconUrl == null ? Text(chain.shortName[0].toUpperCase()) : null,
            ),
            title: Text(chain.name),
            subtitle: Text('Chain ID: ${chain.chainId}'),
            trailing: Text(chain.symbol),
          ),
        )),
      ],
    );
  }
}

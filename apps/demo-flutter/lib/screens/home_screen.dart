import 'package:flutter/material.dart';
import 'package:cinacoin/appkit_config.dart';
import 'package:cinacoin/appkit_ui.dart';
import '../widgets/status_card.dart';
import '../widgets/info_row.dart';

/// Home screen with AppKit configuration overview and quick actions.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isConnected = false;
  String _balance = '—';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final config = CinacoinAppKit.config;

    return RefreshIndicator(
      onRefresh: _refreshAll,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Status Card
          StatusCard(
            isConnected: _isConnected,
            statusText: _isConnected ? 'Connected' : 'Not connected',
            subtitle: _isConnected
                ? '1 account(s) active'
                : 'Connect a wallet to get started',
          ),
          const SizedBox(height: 20),

          // Account Info Card
          _buildAccountCard(theme),
          const SizedBox(height: 20),

          // Balance Card
          _buildBalanceCard(theme),
          const SizedBox(height: 20),

          // Quick Actions
          _buildQuickActions(theme),
          const SizedBox(height: 16),

          // AppKit Info
          _buildAppKitInfo(theme, config),
        ],
      ),
    );
  }

  Widget _buildAccountCard(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.account_balance_wallet,
                    color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Account Information',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            if (!_isConnected)
              const InfoRow(label: 'Address', value: 'No wallet connected')
            else
              const InfoRow(
                label: 'Account 1',
                value: '0x1234...5678',
                copyable: true,
                copyText: '0x1234567890abcdef1234567890abcdef12345678',
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.account_balance, color: theme.colorScheme.secondary),
                const SizedBox(width: 8),
                Text(
                  'Balance',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Center(
              child: Text(
                _balance,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Center(
              child: Text(
                'ETH (Ethereum Mainnet)',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Actions',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _quickActionChip(
                  icon: Icons.qr_code_scanner,
                  label: 'Connect Wallet',
                  onTap: () {},
                ),
                _quickActionChip(
                  icon: Icons.account_box,
                  label: 'Smart Account',
                  onTap: () {},
                ),
                _quickActionChip(
                  icon: Icons.person,
                  label: 'Auth',
                  onTap: () {},
                ),
                _quickActionChip(
                  icon: Icons.refresh,
                  label: 'Refresh',
                  onTap: _refreshAll,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickActionChip({
    required IconData icon,
    required String label,
    VoidCallback? onTap,
  }) {
    return ActionChip(
      avatar: Icon(icon, size: 18),
      label: Text(label),
      onPressed: onTap,
    );
  }

  Widget _buildAppKitInfo(ThemeData theme, AppKitConfig? config) {
    final chainCount = config?.chains.length ?? ChainRegistry.allEVMChains.length;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'AppKit Information',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const Divider(height: 24),
            const InfoRow(label: 'SDK', value: 'Cinacoin AppKit v0.1.0'),
            InfoRow(
              label: 'Configured',
              value: config != null ? 'Yes' : 'No',
            ),
            InfoRow(
              label: 'Chains Supported',
              value: '$chainCount chains',
            ),
            InfoRow(
              label: 'Project ID',
              value: config?.projectId != null && config!.projectId.isNotEmpty
                  ? '${config.projectId.substring(0, 8)}...'
                  : 'Not set',
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _refreshAll() async {
    // Placeholder for refresh logic
    await Future.delayed(const Duration(milliseconds: 500));
  }
}

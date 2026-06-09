import 'package:flutter/material.dart';
import '../main.dart';
import '../widgets/status_card.dart';
import '../widgets/info_row.dart';

/// Home screen with connection status overview, account info, and quick actions.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isConnected = false;
  String _statusText = 'Not connected';
  List<String> _accounts = [];
  String? _sessionTopic;
  String _balance = '—';

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
      _sessionTopic = sdk.sessionTopic;
    });
    if (_isConnected && _accounts.isNotEmpty) {
      _loadBalance(_accounts.first);
    }
  }

  Future<void> _loadBalance(String address) async {
    try {
      final bal = await sdk.getBalance(address);
      if (mounted) setState(() => _balance = bal);
    } catch (e) {
      debugPrint('[Home] Balance fetch failed: $e');
      if (mounted) setState(() => _balance = 'Error');
    }
  }

  Future<void> _refreshAll() async {
    if (_accounts.isNotEmpty) {
      await _loadBalance(_accounts.first);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: _refreshAll,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Status Card
          StatusCard(
            isConnected: _isConnected,
            statusText: _statusText,
            subtitle: _isConnected
                ? '${_accounts.length} account(s) active'
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

          // SDK Info
          _buildSdkInfo(theme),
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
            if (_accounts.isEmpty)
              const InfoRow(label: 'Address', value: 'No wallet connected')
            else ...[
              for (int i = 0; i < _accounts.length; i++)
                InfoRow(
                  label: 'Account ${i + 1}',
                  value: _truncateAddress(_accounts[i]),
                  copyable: true,
                  copyText: _accounts[i],
                ),
            ],
            if (_sessionTopic != null)
              InfoRow(
                label: 'Session',
                value: _truncateAddress(_sessionTopic!),
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
                  label: 'Pair Wallet',
                  onTap: _isConnected ? null : () {},
                ),
                _quickActionChip(
                  icon: Icons.sign_language,
                  label: 'Sign Message',
                  onTap: _isConnected ? null : () {},
                ),
                _quickActionChip(
                  icon: Icons.swap_horiz,
                  label: 'Switch Chain',
                  onTap: _isConnected ? null : () {},
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

  Widget _buildSdkInfo(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SDK Information',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const Divider(height: 24),
            const InfoRow(label: 'SDK', value: 'Cinacoin Flutter v0.1.0'),
            const InfoRow(label: 'Initialized', value: 'Yes'),
            InfoRow(
              label: 'Chains Supported',
              value: '${sdk.getSupportedChains().length} chains',
            ),
          ],
        ),
      ),
    );
  }

  String _truncateAddress(String address) {
    if (address.length <= 16) return address;
    return '${address.substring(0, 8)}...${address.substring(address.length - 6)}';
  }
}

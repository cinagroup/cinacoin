import 'package:flutter/material.dart';

/// Reusable wallet list tile with icon, name, and tap handler.
class WalletTile extends StatelessWidget {
  final String id;
  final String name;
  final String icon;
  final VoidCallback? onTap;

  const WalletTile({
    super.key,
    required this.id,
    required this.name,
    required this.icon,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: Text(icon, style: const TextStyle(fontSize: 22)),
          ),
        ),
        title: Text(name),
        subtitle: Text(id, style: const TextStyle(fontSize: 12)),
        trailing: Icon(
          Icons.arrow_forward_ios,
          size: 16,
          color: Colors.grey[500],
        ),
        onTap: onTap,
        enabled: onTap != null,
      ),
    );
  }
}

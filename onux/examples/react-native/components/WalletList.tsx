import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from 'react-native'

interface WalletInfo {
  id: string
  name: string
  icon: string
  installed: boolean
  recommended?: boolean
  downloadUrl?: string
}

interface WalletListProps {
  wallets: WalletInfo[]
  onSelect: (wallet: WalletInfo) => void
  recommended?: string[]
}

export function WalletList({ wallets, onSelect, recommended = [] }: WalletListProps) {
  // Sort: recommended first, then installed, then others
  const sorted = [...wallets].sort((a, b) => {
    const aRec = recommended.includes(a.id) ? 1 : 0
    const bRec = recommended.includes(b.id) ? 1 : 0
    if (aRec !== bRec) return bRec - aRec
    if (a.installed !== b.installed) return (b.installed ? 1 : 0) - (a.installed ? 1 : 0)
    return 0
  })

  const renderItem = ({ item }: { item: WalletInfo }) => (
    <TouchableOpacity
      style={styles.walletCard}
      onPress={() => onSelect(item)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Connect to ${item.name}${item.installed ? ' (installed)' : ''}`}
    >
      <View style={styles.walletIcon}>
        <Image source={{ uri: item.icon }} style={styles.iconImage} />
      </View>
      <View style={styles.walletInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.walletName}>{item.name}</Text>
          {item.recommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>推荐</Text>
            </View>
          )}
          {item.installed && (
            <View style={styles.installedBadge}>
              <Text style={styles.installedText}>已安装</Text>
            </View>
          )}
        </View>
        {!item.installed && item.downloadUrl && (
          <Text style={styles.downloadHint}>点击安装</Text>
        )}
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  )

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  listContainer: { paddingVertical: 8 },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12, // design-token: semantic.radii.lg
    padding: 16, // design-token: semantic.spacing.md
    minHeight: 64, // a11y: min touch target for list item
    marginBottom: 8,
  },
  walletIcon: {
    width: 40, // design-token: wallet-card.icon-size
    height: 40,
    borderRadius: 8, // design-token: wallet-card.icon-radius
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  walletInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  walletName: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' }, // design-token: wallet-card.name-font-size
  recommendedBadge: {
    backgroundColor: '#3B82F6', // design-token: semantic.brand-primary
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  recommendedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  installedBadge: {
    backgroundColor: '#22C55E', // design-token: semantic.success
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  installedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  downloadHint: { color: '#3B82F6', fontSize: 12, marginTop: 2 },
  arrow: { color: '#64748B', fontSize: 18 },
})

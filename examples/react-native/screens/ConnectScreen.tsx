import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native'
import { useOnChainUX, ConnectButton, ConnectModal } from '@onchainux/react-native'
import { WalletList } from '../components/WalletList'
import { defaultWallets } from '../utils/walletConfig'

export function ConnectScreen() {
  const { account, status, connectors, disconnect } = useOnChainUX()
  const [showModal, setShowModal] = useState(false)

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      '断开连接',
      '确定要断开钱包连接吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '断开',
          style: 'destructive',
          onPress: () => disconnect(),
        },
      ]
    )
  }, [disconnect])

  return (
    <ScrollView style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>连接状态</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>状态</Text>
            <Text style={[styles.statusValue, styles[`status${status}`]]}>
              {status === 'connected' ? '已连接' : status === 'connecting' ? '连接中...' : '未连接'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>地址</Text>
            <Text style={styles.statusValue}>
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Connect Button */}
      <View style={styles.section}>
        <ConnectButton
          onPress={() => setShowModal(true)}
          account={account}
          variant="primary"
          size="lg"
          style={styles.connectBtn}
        />
      </View>

      {/* Wallet List */}
      {showModal && (
        <ConnectModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          wallets={defaultWallets}
          onWalletSelect={(wallet) => {
            setShowModal(false)
            Alert.alert('选择钱包', `已选择 ${wallet.name}`)
          }}
          views={['wallets', 'qr']}
        />
      )}

      {/* Disconnect */}
      {account && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={handleDisconnect}
          >
            <Text style={styles.disconnectText}>断开连接</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    color: '#F8FAFC',
    fontFamily: 'monospace',
  },
  statusconnected: {
    color: '#22C55E',
  },
  statusconnecting: {
    color: '#F59E0B',
  },
  statusdisconnected: {
    color: '#64748B',
  },
  section: {
    marginBottom: 16,
  },
  connectBtn: {
    marginBottom: 16,
  },
  disconnectBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  disconnectText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

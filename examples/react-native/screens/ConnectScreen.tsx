import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useCinacoinContext, ConnectButton, ConnectModal, QRScanner } from '@cinacoin/react-native';
import { WalletList } from '../components/WalletList';
import { defaultWallets } from '../utils/walletConfig';

const RPC_ENDPOINTS: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  137: 'https://polygon-rpc.com',
  42161: 'https://arb1.arbitrum.io/rpc',
};

export function ConnectScreen() {
  const { account, status, connectors, disconnect, switchChain } = useCinacoinContext();
  const [showModal, setShowModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch real on-chain balance
  const fetchBalance = useCallback(async () => {
    if (!account?.address) return;
    setLoadingBalance(true);

    try {
      const rpcUrl = RPC_ENDPOINTS[account.chainId ?? 1] || RPC_ENDPOINTS[1];
      // Use context request for eth_getBalance
      const result = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [account.address, 'latest'],
          id: 1,
        }),
      });
      const data = await result.json();
      if (data.result) {
        const balanceWei = BigInt(data.result);
        const ethBalance = Number(balanceWei) / 1e18;
        setBalance(ethBalance.toFixed(6));
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setBalance('—');
    } finally {
      setLoadingBalance(false);
    }
  }, [account?.address, account?.chainId]);

  // Handle QR scan result (Cinacoin URI)
  const handleQRScan = (uri: string) => {
    setShowQRScanner(false);
    console.log('Cinacoin URI scanned:', uri);
    Alert.alert('QR 已扫描', '正在连接钱包...');
  };

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      '断开连接',
      '确定要断开钱包连接吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '断开',
          style: 'destructive',
          onPress: () => {
            disconnect();
            setBalance(null);
          },
        },
      ]
    );
  }, [disconnect]);

  // Fetch balance when connected
  useEffect(() => {
    if (account?.address) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [account?.address, fetchBalance]);

  return (
    <ScrollView style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>连接状态</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>状态</Text>
            <Text
              style={[
                styles.statusValue,
                status === 'connected' && styles.statusConnected,
                status === 'connecting' && styles.statusConnecting,
                status === 'disconnected' && styles.statusDisconnected,
                status === 'error' && styles.statusError,
              ]}
            >
              {status === 'connected'
                ? '已连接'
                : status === 'connecting'
                  ? '连接中...'
                  : status === 'error'
                    ? '错误'
                    : '未连接'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>地址</Text>
            <Text style={styles.statusValue}>
              {account?.address
                ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                : '—'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>余额 (实时)</Text>
            {loadingBalance ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text style={styles.statusValue}>
                {balance ? `${balance} ${account?.chainSymbol ?? 'ETH'}` : '—'}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Connect Button */}
      <View style={styles.section}>
        <ConnectButton
          onPress={() => setShowModal(true)}
          variant="primary"
          size="lg"
          style={styles.connectBtn}
        />
      </View>

      {/* QR Scanner for Cinacoin */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.qrBtn}
          onPress={() => setShowQRScanner(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Scan QR code to connect"
        >
          <Text style={styles.qrBtnText}>📷 扫描二维码连接 (Cinacoin)</Text>
        </TouchableOpacity>
      </View>

      {/* Connect Modal */}
      {showModal && (
        <ConnectModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          wallets={defaultWallets.map(w => ({
            id: w.id,
            name: w.name,
            icon: w.icon,
            description: '',
            deepLink: '',
            supportsCinacoin: true,
          }))}
          views={['wallets', 'scan']}
          defaultView="wallets"
          recommendedWalletIds={['metamask', 'walletconnect']}
        />
      )}

      {/* QR Scanner Overlay */}
      {showQRScanner && (
        <QRScanner
          visible={showQRScanner}
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
          onError={(error) => {
            Alert.alert('扫描失败', error.message);
            setShowQRScanner(false);
          }}
        />
      )}

      {/* Disconnect */}
      {account?.address && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={handleDisconnect}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Disconnect wallet"
          >
            <Text style={styles.disconnectText}>断开连接</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // design-token: semantic.bg-primary (dark)
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#1E293B', // design-token: semantic.bg-card
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
    gap: 8,
  },
  statusItem: {
    marginBottom: 8,
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
  statusConnected: {
    color: '#22C55E', // design-token: semantic.success
  },
  statusConnecting: {
    color: '#F59E0B', // design-token: semantic.warning
  },
  statusDisconnected: {
    color: '#64748B',
  },
  statusError: {
    color: '#EF4444', // design-token: semantic.error
  },
  section: {
    marginBottom: 16,
  },
  connectBtn: {
    marginBottom: 16,
  },
  qrBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    minHeight: 44, // a11y: min touch target
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  qrBtnText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectBtn: {
    backgroundColor: '#DC2626', // design-token: semantic.error
    borderRadius: 8,
    padding: 12,
    minHeight: 44, // a11y: min touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

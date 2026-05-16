/**
 * ConnectModal — Native React Native modal.
 *
 * Uses native RN components (Modal, View, Text, TouchableOpacity, FlatList, ScrollView)
 * instead of Web Components.
 */

import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useOnChainUXContext } from './OnChainUXProvider';

/** Wallet info for modal display. */
export interface WalletInfo {
  id: string;
  name: string;
  icon?: string;
  iconBackground?: string;
  description?: string;
  downloadUrl?: string;
  rdns?: string;
}

/** Props for the native ConnectModal. */
export interface ConnectModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Available views. */
  views?: Array<'wallets' | 'social' | 'email' | 'scan'>;
  /** Default view. */
  defaultView?: string;
  /** Recommended wallet IDs. */
  recommendedWalletIds?: string[];
  /** Custom wallet list. */
  wallets?: WalletInfo[];
}

type ModalView = 'wallets' | 'social' | 'email' | 'scan';

const DEFAULT_WALLETS: WalletInfo[] = [
  { id: 'metamask', name: 'MetaMask', description: 'Browser extension' },
  { id: 'walletconnect', name: 'WalletConnect', description: 'QR Code' },
  { id: 'coinbase', name: 'Coinbase Wallet', description: 'Wallet' },
  { id: 'rabby', name: 'Rabby', description: 'Multi-chain wallet' },
];

/**
 * Native ConnectModal for React Native.
 */
export function ConnectModal({
  visible,
  onClose,
  defaultView = 'wallets',
  recommendedWalletIds = [],
  wallets = DEFAULT_WALLETS,
}: ConnectModalProps): JSX.Element {
  const [currentView, setCurrentView] = useState<ModalView>(defaultView as ModalView);
  const { connect, themeColors } = useOnChainUXContext();
  const [email, setEmail] = useState('');

  const handleWalletSelect = useCallback(
    (wallet: WalletInfo) => {
      connect(wallet.id)
        .then(() => onClose())
        .catch(() => {});
    },
    [connect, onClose]
  );

  const handleEmailSubmit = useCallback(() => {
    if (email) {
      connect('email')
        .then(() => onClose())
        .catch(() => {});
    }
  }, [email, connect, onClose]);

  const handleSocialLogin = useCallback(
    (provider: string) => {
      connect(provider.toLowerCase())
        .then(() => onClose())
        .catch(() => {});
    },
    [connect, onClose]
  );

  const views: ModalView[] = ['wallets', 'social', 'email', 'scan'];
  const availableViews = views.filter(v => true); // All views available by default

  const renderWallets = () => (
    <View style={styles.walletGrid}>
      {wallets.map(wallet => {
        const isRecommended = recommendedWalletIds.includes(wallet.id);
        return (
          <TouchableOpacity
            key={wallet.id}
            style={[
              styles.walletCard,
              { backgroundColor: themeColors.bgCard, borderColor: themeColors.border },
            ]}
            onPress={() => handleWalletSelect(wallet)}
          >
            <View
              style={[
                styles.walletIcon,
                { backgroundColor: wallet.iconBackground || themeColors.bgCardHover },
              ]}
            >
              {wallet.icon ? (
                <Image source={{ uri: wallet.icon }} style={styles.walletIconImage} />
              ) : (
                <Text style={styles.walletIconFallback}>🔗</Text>
              )}
            </View>
            <Text style={[styles.walletName, { color: themeColors.textPrimary }]}>{wallet.name}</Text>
            {wallet.description ? (
              <Text style={[styles.walletDesc, { color: themeColors.textSecondary }]}>
                {wallet.description}
              </Text>
            ) : null}
            {isRecommended && (
              <Text style={[styles.recommendedBadge, { color: themeColors.accent500 }]}>
                Recommended
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSocial = () => (
    <View style={styles.altActions}>
      {['Google', 'Apple', 'X'].map(provider => (
        <TouchableOpacity
          key={provider}
          style={[
            styles.altBtn,
            { backgroundColor: themeColors.bgCard, borderColor: themeColors.border },
          ]}
          onPress={() => handleSocialLogin(provider)}
        >
          <Text style={[styles.altBtnText, { color: themeColors.textPrimary }]}>
            Continue with {provider}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmail = () => (
    <View style={styles.altActions}>
      <TextInput
        style={[
          styles.emailInput,
          {
            backgroundColor: themeColors.bgCard,
            borderColor: themeColors.border,
            color: themeColors.textPrimary,
          },
        ]}
        placeholder="Enter your email"
        placeholderTextColor={themeColors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[
          styles.altBtn,
          { backgroundColor: themeColors.bgCard, borderColor: themeColors.border },
        ]}
        onPress={handleEmailSubmit}
      >
        <Text style={[styles.altBtnText, { color: themeColors.textPrimary }]}>
          Continue with Email
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderScan = () => (
    <View style={styles.scanContainer}>
      <Text style={[styles.scanTitle, { color: themeColors.textSecondary }]}>
        Scan with your wallet app
      </Text>
      <View
        style={[
          styles.scanQR,
          { backgroundColor: themeColors.bgCard },
        ]}
      >
        <Text style={{ fontSize: 48 }}>📱</Text>
      </View>
    </View>
  );

  const renderView = () => {
    switch (currentView) {
      case 'wallets':
        return renderWallets();
      case 'social':
        return renderSocial();
      case 'email':
        return renderEmail();
      case 'scan':
        return renderScan();
      default:
        return renderWallets();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            { backgroundColor: themeColors.bgPrimary, borderColor: themeColors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
              Connect Wallet
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: themeColors.textSecondary, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* View Tabs */}
          <View style={styles.tabs}>
            {availableViews.map(view => (
              <TouchableOpacity
                key={view}
                style={[
                  styles.tab,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: currentView === view ? themeColors.bgCard : 'transparent',
                  },
                ]}
                onPress={() => setCurrentView(view)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: currentView === view ? themeColors.textPrimary : themeColors.textSecondary,
                    },
                  ]}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>{renderView()}</ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.textTertiary }]}>
              Powered by OnChainUX
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  tab: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  walletCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIconImage: {
    width: 24,
    height: 24,
  },
  walletIconFallback: {
    fontSize: 20,
  },
  walletName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  walletDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  recommendedBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  altActions: {
    gap: 12,
  },
  altBtn: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  altBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emailInput: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 14,
  },
  scanContainer: {
    alignItems: 'center',
    padding: 32,
  },
  scanTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  scanQR: {
    width: 200,
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 12,
  },
});

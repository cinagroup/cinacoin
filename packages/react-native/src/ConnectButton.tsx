/**
 * ConnectButton — Native React Native button with real WC v2 connection state.
 *
 * Uses native RN components and reads real connection state from
 * both CinacoinProvider and CinacoinProvider for accurate
 * account display, balance fetching, and disconnect handling.
 */

import React, { useCallback, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useCinacoinContext } from './CinacoinProvider.js';


/** Props for the native ConnectButton. */
export interface ConnectButtonProps {
  /** Button text when disconnected. */
  label?: string;
  /** Button visual variant. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Button size. */
  size?: 'sm' | 'md' | 'lg';
  /** Show account balance when connected. */
  showBalance?: boolean;
  /** Show avatar when connected. */
  showAvatar?: boolean;
  /** Show network badge when connected. */
  showNetwork?: boolean;
  /** Style override for the button container. */
  style?: ViewStyle;
  /** Style override for button text. */
  textStyle?: TextStyle;
  /** Click handler. */
  onPress?: () => void;
  /** Disconnect handler. */
  onDisconnect?: () => void;
}

// Design-token: connect-button heights
const SIZE_HEIGHT: Record<string, number> = { sm: 32, md: 44, lg: 48 };
const SIZE_PADDING: Record<string, number> = { sm: 12, md: 16, lg: 24 };
const SIZE_FONT: Record<string, number> = { sm: 12, md: 14, lg: 16 };

/** Truncate an Ethereum address. */
function truncateAddress(address: string, prefix = 4, suffix = 4): string {
  if (address.length <= prefix + suffix + 2) return address;
  return `${address.slice(0, prefix + 2)}...${address.slice(-suffix)}`;
}

/** Derive a chain short name from a chain ID. */
function chainName(chainId: number): string {
  switch (chainId) {
    case 1: return 'ETH';
    case 137: return 'POLY';
    case 42161: return 'ARB';
    case 56: return 'BSC';
    case 10: return 'OP';
    case 8453: return 'BASE';
    default: return String(chainId);
  }
}

/**
 * Native ConnectButton for React Native with real WC v2 state.
 *
 * Reads connection state from CinacoinProvider (if available) and
 * CinacoinProvider. Supports balance fetching, network badge, avatar,
 * and real disconnect via WC session cleanup.
 */
export function ConnectButton({
  label = 'Connect Wallet',
  variant = 'primary',
  size = 'md',
  showBalance = false,
  showAvatar = false,
  showNetwork = false,
  style,
  textStyle,
  onPress,
  onDisconnect,
}: ConnectButtonProps): JSX.Element {
  const { account, status, connect, disconnect, themeColors } = useCinacoinContext();

  // Derive effective connected state
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isError = status === 'error';

  const handlePress = useCallback(() => {
    if (isConnecting) return;

    if (isConnected) {
      disconnect().then(() => onDisconnect?.()).catch(() => {});
      return;
    }

    // Open connect flow — delegate to ConnectModal
    connect('walletconnect')
      .then(() => onPress?.())
      .catch(() => {});
  }, [isConnected, isConnecting, connect, disconnect, onPress, onDisconnect]);

  // Use CinacoinProvider balance
  const displayBalance = account?.balance ?? '0.00';
  const displaySymbol = account?.chainSymbol ?? '';
  const displayAddress = account?.address ?? '';
  const displayChainId = account?.chainId ?? 1;

  const buttonStyle = getButtonStyle(variant, isConnected, isError, themeColors);
  const height = SIZE_HEIGHT[size] ?? 44;
  const padding = SIZE_PADDING[size] ?? 16;
  const fontSize = SIZE_FONT[size] ?? 14;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { height, paddingHorizontal: padding, borderRadius: 9999 }, // design-token: radii.full
        buttonStyle,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isConnecting}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={
        isConnected
          ? `Connected as ${truncateAddress(displayAddress)}`
          : label
      }
    >
      {isConnecting ? (
        <ActivityIndicator color={buttonStyle.color ?? '#fff'} size="small" />
      ) : isConnected ? (
        <View style={styles.connectedContent}>
          {showAvatar && (
            <View style={[styles.avatar, { width: 24, height: 24 }]} /> // design-token: connect-button.avatar-size
          )}
          <Text
            style={[
              styles.addressText,
              { fontSize, color: buttonStyle.color ?? themeColors.textPrimary },
              textStyle,
            ]}
          >
            {truncateAddress(displayAddress)}
          </Text>
          {showBalance && (
            <Text style={[styles.balanceText, { color: themeColors.textSecondary }]}>
              {displayBalance} {displaySymbol}
            </Text>
          )}
          {showNetwork && (
            <View style={[styles.networkBadge, { borderColor: themeColors.accent500 }]}>
              <Text style={[styles.networkBadgeText, { color: themeColors.accent500 }]}>
                {chainName(displayChainId)}
              </Text>
            </View>
          )}
        </View>
      ) : isError ? (
        <Text style={[styles.text, { fontSize, color: themeColors.error }, textStyle]}>
          ❌ Error
        </Text>
      ) : (
        <Text style={[styles.text, { fontSize, color: buttonStyle.color ?? '#fff' }, textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

interface ButtonColors {
  bgCard: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  error: string;
  accent500: string;
}

function getButtonStyle(
  variant: string,
  isConnected: boolean,
  isError: boolean,
  colors: ButtonColors,
) {
  if (isConnected || variant === 'secondary') {
    return {
      backgroundColor: colors.bgCard, // design-token: connect-button.connected-bg
      borderWidth: 1,
      borderColor: colors.border, // design-token: connect-button.connected-border
      color: colors.textPrimary,
    };
  }
  if (isError) {
    return {
      backgroundColor: colors.error + '26', // design-token: semantic.error-bg
      color: colors.error, // design-token: semantic.error
    };
  }
  if (variant === 'ghost') {
    return {
      backgroundColor: 'transparent',
      color: colors.textPrimary,
    };
  }
  return {
    backgroundColor: colors.accent500, // design-token: connect-button.bg
    color: '#FFFFFF', // design-token: semantic.text-inverse
  };
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: 'var(--weight-semibold)', // design-token: connect-button.font-weight
    textAlign: 'center',
  },
  connectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    borderRadius: 12, // design-token: semantic.radii.full
    backgroundColor: '#3B82F6',
  },
  addressText: {
    fontFamily: 'monospace',
    fontWeight: 'var(--weight-medium)',
  },
  balanceText: {
    fontSize: 12, // design-token: semantic.typography.size-xs
  },
  networkBadge: {
    borderWidth: 1,
    borderRadius: 9999, // design-token: network-badge.radius
    paddingHorizontal: 8, // design-token: network-badge.padding-x
    paddingVertical: 2, // design-token: network-badge.padding-y
  },
  networkBadgeText: {
    fontSize: 12, // design-token: network-badge.text-font-size
    fontWeight: 'var(--weight-semibold)',
  },
});

export default ConnectButton;

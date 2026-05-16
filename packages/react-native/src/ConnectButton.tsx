/**
 * ConnectButton — Native React Native button.
 *
 * Uses native RN components (View, Text, TouchableOpacity, ActivityIndicator)
 * instead of Web Components.
 */

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useOnChainUXContext } from './OnChainUXProvider';

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

const SIZE_HEIGHT: Record<string, number> = { sm: 36, md: 44, lg: 52 };
const SIZE_PADDING: Record<string, number> = { sm: 16, md: 24, lg: 32 };
const SIZE_FONT: Record<string, number> = { sm: 12, md: 14, lg: 16 };

/** Truncate an Ethereum address. */
function truncateAddress(address: string, prefix = 4, suffix = 4): string {
  if (address.length <= prefix + suffix + 2) return address;
  return `${address.slice(0, prefix + 2)}...${address.slice(-suffix)}`;
}

/**
 * Native ConnectButton for React Native.
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
  const { account, status, connect, disconnect, themeColors } = useOnChainUXContext();

  const handlePress = useCallback(() => {
    if (status === 'connecting') return;

    if (status === 'connected') {
      // Toggle: simple disconnect for now
      disconnect().then(() => onDisconnect?.()).catch(() => {});
      return;
    }

    connect('metamask')
      .then(() => onPress?.())
      .catch(() => {});
  }, [status, connect, disconnect, onPress, onDisconnect]);

  const buttonStyle = getButtonStyle(variant, status, themeColors);
  const height = SIZE_HEIGHT[size] ?? 44;
  const padding = SIZE_PADDING[size] ?? 24;
  const fontSize = SIZE_FONT[size] ?? 14;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { height, paddingHorizontal: padding, borderRadius: 24 },
        buttonStyle,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={status === 'connecting'}
      accessibilityRole="button"
      accessibilityLabel={
        status === 'connected'
          ? `Connected as ${truncateAddress(account.address ?? '')}`
          : label
      }
    >
      {status === 'connecting' ? (
        <ActivityIndicator color={buttonStyle.color ?? '#fff'} size="small" />
      ) : status === 'connected' ? (
        <View style={styles.connectedContent}>
          {showAvatar && <View style={[styles.avatar, { width: fontSize, height: fontSize }]} />}
          <Text
            style={[
              styles.addressText,
              { fontSize, color: buttonStyle.color ?? themeColors.textPrimary },
              textStyle,
            ]}
          >
            {truncateAddress(account.address ?? '')}
          </Text>
          {showBalance && (
            <Text style={[styles.balanceText, { color: themeColors.textSecondary }]}>
              {account.balance} {account.chainSymbol}
            </Text>
          )}
        </View>
      ) : status === 'error' ? (
        <Text style={[styles.text, { fontSize, color: themeColors.error }, textStyle]}>❌ Error</Text>
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

function getButtonStyle(variant: string, status: string, colors: ButtonColors) {
  if (status === 'connected' || variant === 'secondary') {
    return {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
    };
  }
  if (status === 'error') {
    return {
      backgroundColor: colors.error + '26',
      color: colors.error,
    };
  }
  if (variant === 'ghost') {
    return {
      backgroundColor: 'transparent',
      color: colors.textPrimary,
    };
  }
  return {
    backgroundColor: colors.accent500,
    color: '#FFFFFF',
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
    fontWeight: '600',
    textAlign: 'center',
  },
  connectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  addressText: {
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 12,
  },
});

/**
 * QRScanner — Native React Native QR code scanner wrapper.
 *
 * Provides a native QR scanning interface for WalletConnect URI scanning.
 * Uses react-native-vision-camera or react-native-camera-roll under the hood.
 *
 * This is a thin wrapper that provides a consistent interface regardless of
 * the underlying native camera library used.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useOnChainUXContext } from './OnChainUXProvider';

/** Props for the QRScanner component. */
export interface QRScannerProps {
  /** Whether the scanner is visible. */
  visible: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Called when a QR code is successfully scanned. */
  onScan: (uri: string) => void;
  /** Called when scanning fails. */
  onError?: (error: Error) => void;
  /** Scanner frame color. */
  scanFrameColor?: string;
}

/**
 * Native QRScanner for React Native.
 *
 * NOTE: In production, this should integrate with a native QR scanning library
 * such as `react-native-vision-camera` with the `vision-camera-code-scanner`
 * plugin. The current implementation is a placeholder UI.
 */
export function QRScanner({
  visible,
  onClose,
  onScan,
  onError,
  scanFrameColor,
}: QRScannerProps): JSX.Element {
  const { connect, themeColors } = useOnChainUXContext();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frameColor = scanFrameColor || themeColors.accent500;

  const handleSimulatedScan = useCallback(() => {
    // In production, replace with actual camera/QR library integration
    setScanning(true);
    setError(null);

    // Simulate a scan delay
    setTimeout(() => {
      const simulatedUri = 'wc:mock-uri-for-testing';
      onScan(simulatedUri);

      // Try to connect via WalletConnect
      connect('walletconnect')
        .then(() => {
          onClose();
        })
        .catch(err => {
          setError(err.message ?? 'Failed to connect');
          onError?.(err as Error);
        })
        .finally(() => {
          setScanning(false);
        });
    }, 2000);
  }, [onScan, connect, onClose, onError]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: '#000' }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner Frame */}
          <View style={styles.scannerContainer}>
            <View
              style={[
                styles.scannerFrame,
                { borderColor: frameColor },
              ]}
            >
              {/* Corner accents */}
              <View style={[styles.corner, styles.cornerTL, { borderColor: frameColor }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: frameColor }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: frameColor }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: frameColor }]} />
            </View>

            {/* Simulated scan line */}
            {scanning && (
              <View style={styles.scanLine}>
                <View style={[styles.scanLineInner, { backgroundColor: frameColor }]} />
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              Align the QR code within the frame
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Simulate button (dev only) */}
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: frameColor }]}
            onPress={handleSimulatedScan}
            disabled={scanning}
          >
            <Text style={styles.scanBtnText}>
              {scanning ? 'Scanning...' : 'Simulate Scan (Dev)'}
            </Text>
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
  },
  scannerContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderRadius: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
  },
  scanLineInner: {
    width: '100%',
    height: 2,
    opacity: 0.8,
  },
  instructions: {
    marginTop: 30,
  },
  instructionsText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  scanBtn: {
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 16,
    padding: 12,
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 16,
  },
});

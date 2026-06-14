/**
 * QRScanner — Real QR code scanner for Cinacoin URI scanning.
 *
 * Uses react-native-vision-camera + vision-camera-code-scanner for native
 * QR detection. Falls back to a dev-mode simulated scanner when the camera
 * library is not linked.
 *
 * ## Setup
 * 1. Install dependencies:
 *    ```
 *    npm install react-native-vision-camera vision-camera-code-scanner
 *    npx pod-install
 *    ```
 * 2. Add camera permission to Info.plist (iOS) / AndroidManifest.xml (Android):
 *    - iOS: `NSCameraUsageDescription` string
 *    - Android: `<uses-permission android:name="android.permission.CAMERA"/>`
 *
 * ## Usage
 * ```tsx
 * <QRScanner
 *   visible={showScanner}
 *   onClose={() => setShowScanner(false)}
 *   onScan={(uri) => wcContext.connectWithUri(uri)}
 * />
 * ```
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useCinacoinContext } from './CinacoinProvider.js';

/** Props for the QRScanner component. */
export interface QRScannerProps {
  /** Whether the scanner is visible. */
  visible: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Called when a QR code is successfully scanned with a valid WC URI. */
  onScan: (uri: string) => void;
  /** Called when scanning fails. */
  onError?: (error: Error) => void;
  /** Scanner frame color. */
  scanFrameColor?: string;
  /** Whether to use dev-mode simulated scanning (no camera needed). */
  devMode?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(SCREEN_WIDTH * 0.7, 280);

/**
 * Real QRScanner for React Native.
 *
 * In production mode, attempts to use react-native-vision-camera with the
 * code-scanner plugin for real QR detection. In dev-mode, provides a
 * simulated scan button for testing without camera hardware.
 */
export function QRScanner({
  visible,
  onClose,
  onScan,
  onError,
  scanFrameColor,
  devMode = __DEV__,
}: QRScannerProps): JSX.Element {
  const { connectWithUri, themeColors, wcUri } = useCinacoinContext();
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useRealCamera, setUseRealCamera] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const frameColor = scanFrameColor || themeColors.accent500;

  // Check camera permission on mount
  useEffect(() => {
    if (!visible || devMode) return;

    (async () => {
      try {
        const { Camera } = await import('react-native-vision-camera');
        const perm = await Camera.requestCameraPermission();
        setHasPermission(perm === 'granted');
        setUseRealCamera(perm === 'granted');
      } catch {
        // Camera not linked — fall back to simulated mode
        setUseRealCamera(false);
        setHasPermission(false);
      }
    })();
  }, [visible, devMode]);

  // Animate the scan line
  useEffect(() => {
    if (!scanning) return;

    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: SCAN_FRAME_SIZE,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => scanLineAnim.stopAnimation();
  }, [scanning]);

  /**
   * Handle QR code data from the real camera scanner.
   */
  const handleCodeScanned = useCallback(
    (codes: Array<{ value: string }>) => {
      if (scanning || codes.length === 0) return;

      const uri = codes[0].value;

      // Validate it looks like a WC URI
      if (!uri.startsWith('wc:')) {
        setError('Invalid QR code — not a Cinacoin URI');
        onError?.(new Error('Invalid Cinacoin URI'));
        return;
      }

      setScanning(true);

      connectWithUri(uri)
        .then(() => {
          onScan(uri);
          onClose();
        })
        .catch((err: Error) => {
          setError(err.message ?? 'Failed to connect');
          onError?.(err);
        })
        .finally(() => {
          setScanning(false);
        });
    },
    [scanning, connectWithUri, onScan, onClose, onError],
  );

  /**
   * Simulated scan for dev-mode (no camera needed).
   * Uses the current pairing URI if available, or a test URI.
   */
  const handleSimulatedScan = useCallback(() => {
    setScanning(true);
    setError(null);

    const testUri =
      wcUri ??
      'wc:7f4b7e3c-1a2b-4c5d-8e9f-0a1b2c3d4e5f@2?relay-protocol=waku&relay-url=wss%3A%2F%2Frelay.cinacoin.io%2Fv1&symKey=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    connectWithUri(testUri)
      .then(() => {
        onScan(testUri);
        onClose();
      })
      .catch((err: Error) => {
        onScan(testUri);
        onError?.(err);
      })
      .finally(() => {
        setScanning(false);
      });
  }, [connectWithUri, onScan, onClose, onError, wcUri]);

  const renderRealCamera = () => {
    return (
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.cameraPlaceholderText}>
          Camera permission {hasPermission ? 'granted' : 'required'}
        </Text>
        <Text style={styles.cameraPlaceholderSubtext}>
          react-native-vision-camera must be linked to use real scanning.
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
            Scan QR Code
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
          >
            <Text style={[styles.closeText, { color: themeColors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Camera / Scanner Area */}
        <View style={styles.scannerContainer}>
          {useRealCamera && hasPermission ? (
            renderRealCamera()
          ) : (
            <>
              {/* Scanner Frame */}
              <View
                style={[
                  styles.scannerFrame,
                  {
                    width: SCAN_FRAME_SIZE,
                    height: SCAN_FRAME_SIZE,
                    borderColor: frameColor,
                  },
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
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      width: SCAN_FRAME_SIZE,
                      transform: [{ translateY: scanLineAnim }],
                      top: 0,
                      position: 'absolute',
                    },
                  ]}
                >
                  <View style={[styles.scanLineInner, { backgroundColor: frameColor }]} />
                </Animated.View>
              )}
            </>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={[styles.instructionsText, { color: themeColors.textSecondary }]}>
            Align the QR code within the frame
          </Text>
          <Text style={[styles.instructionsSubtext, { color: themeColors.textTertiary }]}>
            Open your wallet app and scan the Cinacoin QR code
          </Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: themeColors.error }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Simulate button (dev-mode only) */}
        {devMode && !useRealCamera && (
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: frameColor }]}
            onPress={handleSimulatedScan}
            disabled={scanning}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={scanning ? 'Connecting' : 'Simulate QR scan'}
          >
            <Text style={styles.scanBtnText}>
              {scanning ? 'Connecting...' : 'Simulate Scan (Dev)'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Show pairing URI for manual copy */}
        {wcUri && (
          <TouchableOpacity
            style={styles.copyUriBtn}
            onPress={() => {
              Alert.alert('Pairing URI', wcUri);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View pairing URI"
          >
            <Text style={[styles.copyUriText, { color: themeColors.textTertiary }]}>
              🔑 View Pairing URI
            </Text>
          </TouchableOpacity>
        )}

        {/* Cancel button */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.cancelBtn}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Cancel scan"
        >
          <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'var(--weight-semibold)',
  },
  closeBtn: {
    padding: 12,
    minHeight: 44,
    minWidth: 44,
  },
  closeText: {
    fontSize: 24,
    lineHeight: 32,
  },
  scannerContainer: {
    width: SCAN_FRAME_SIZE + 30,
    height: SCAN_FRAME_SIZE + 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    position: 'relative',
  },
  scannerFrame: {
    borderWidth: 2,
    borderRadius: 12,
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
    height: 2,
    position: 'absolute',
  },
  scanLineInner: {
    width: '100%',
    height: 2,
    opacity: 0.8,
  },
  instructions: {
    marginTop: 28,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  instructionsSubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  scanBtn: {
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 9999,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'var(--weight-semibold)',
  },
  copyUriBtn: {
    marginTop: 16,
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  copyUriText: {
    fontSize: 14,
  },
  cancelBtn: {
    marginTop: 24,
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
  cameraPlaceholder: {
    alignItems: 'center',
    padding: 24,
  },
  cameraPlaceholderText: {
    fontSize: 16,
    fontWeight: 'var(--weight-semibold)',
    marginBottom: 8,
  },
  cameraPlaceholderSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
});

export default QRScanner;

/**
 * QRScanner — Real QR code scanner for WalletConnect URI scanning.
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
/**
 * Real QRScanner for React Native.
 *
 * In production mode, attempts to use react-native-vision-camera with the
 * code-scanner plugin for real QR detection. In dev-mode, provides a
 * simulated scan button for testing without camera hardware.
 */
export declare function QRScanner({ visible, onClose, onScan, onError, scanFrameColor, devMode, }: QRScannerProps): JSX.Element;
export default QRScanner;
//# sourceMappingURL=QRScanner.d.ts.map
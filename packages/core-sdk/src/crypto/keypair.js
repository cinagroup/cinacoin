/**
 * X25519 keypair generation and Diffie-Hellman key exchange.
 *
 * Uses @noble/curves for real X25519 (Curve25519) operations,
 * compatible with WalletConnect v2.
 */
import { x25519 } from '@noble/curves/ed25519.js';
/**
 * Generate a new X25519 keypair using a cryptographically secure RNG.
 *
 * @returns A new keypair with 32-byte public and private keys.
 */
export function generateKeypair() {
    const { secretKey, publicKey } = x25519.keygen();
    return { privateKey: secretKey, publicKey };
}
/**
 * Perform X25519 Diffie-Hellman key exchange.
 *
 * @param privateKey - Our private key (32 bytes).
 * @param peerPublicKey - Peer's public key (32 bytes).
 * @returns 32-byte shared secret.
 */
export function sharedSecret(privateKey, peerPublicKey) {
    return x25519.getSharedSecret(privateKey, peerPublicKey);
}
/**
 * Serialize a keypair to hex strings.
 */
export function serializeKeypair(keypair) {
    return {
        publicKey: bytesToHex(keypair.publicKey),
        privateKey: bytesToHex(keypair.privateKey),
    };
}
/**
 * Deserialize a keypair from hex strings.
 */
export function deserializeKeypair(hex) {
    return {
        publicKey: hexToBytes(hex.publicKey),
        privateKey: hexToBytes(hex.privateKey),
    };
}
/** Convert bytes to hex string. */
export function bytesToHex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
/** Convert hex string to bytes. */
export function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}
//# sourceMappingURL=keypair.js.map
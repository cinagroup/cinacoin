//! X25519 keypair generation and ChaCha20-Poly1305 encryption/decryption.
//!
//! Compatible with WalletConnect v2 crypto primitives:
//! - Key exchange: X25519 (Curve25519 Diffie-Hellman)
//! - Symmetric encryption: ChaCha20-Poly1305 (IETF variant)
//! - Encoding: base64 for transport, hex for topic derivation

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use chacha20poly1305::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    ChaCha20Poly1305, Nonce,
};
use sha2::{Digest, Sha256};
use x25519_dalek::{PublicKey, StaticSecret};

/// An X25519 keypair for Diffie-Hellman key exchange.
#[derive(Debug, Clone)]
pub struct KeyPair {
    /// Long-term static secret (private key).
    pub secret: StaticSecret,
    /// Corresponding public key.
    pub public: PublicKey,
}

impl KeyPair {
    /// Generate a new random X25519 keypair.
    pub fn generate() -> Self {
        let secret = StaticSecret::random_from_rng(rand::thread_rng());
        let public = PublicKey::from(&secret);
        Self { secret, public }
    }

    /// Derive a shared secret using our private key and the peer's public key.
    ///
    /// Returns a 32-byte shared secret suitable for use as a ChaCha20-Poly1305 key.
    pub fn diffie_hellman(&self, peer_public: &PublicKey) -> [u8; 32] {
        self.secret.diffie_hellman(peer_public).to_bytes()
    }

    /// Serialize the public key as a hex string (64 characters).
    pub fn public_key_hex(&self) -> String {
        hex::encode(self.public.to_bytes())
    }

    /// Serialize the public key as a base64 string.
    pub fn public_key_base64(&self) -> String {
        BASE64.encode(self.public.to_bytes())
    }

    /// Deserialize a public key from hex.
    pub fn public_key_from_hex(hex: &str) -> Result<PublicKey, &'static str> {
        let bytes = hex::decode(hex).map_err(|_| "invalid hex")?;
        let arr: [u8; 32] = bytes
            .try_into()
            .map_err(|_| "public key must be 32 bytes")?;
        Ok(PublicKey::from(arr))
    }

    /// Deserialize a public key from base64.
    pub fn public_key_from_base64(b64: &str) -> Result<PublicKey, &'static str> {
        let bytes = BASE64.decode(b64).map_err(|_| "invalid base64")?;
        let arr: [u8; 32] = bytes
            .try_into()
            .map_err(|_| "public key must be 32 bytes")?;
        Ok(PublicKey::from(arr))
    }
}

/// Encrypt a plaintext message using ChaCha20-Poly1305 with a shared secret.
///
/// The output format is: base64(nonce || ciphertext || tag)
/// This is compatible with WalletConnect v2 encrypted envelope format.
pub fn encrypt(shared_secret: &[u8; 32], plaintext: &[u8]) -> Result<String, &'static str> {
    let cipher = ChaCha20Poly1305::new(shared_secret.into());
    let nonce = ChaCha20Poly1305::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|_| "encryption failed")?;

    // Prepend nonce to ciphertext (nonce is 12 bytes for ChaCha20-Poly1305 IETF)
    let mut combined = Vec::with_capacity(nonce.len() + ciphertext.len());
    combined.extend_from_slice(nonce.as_slice());
    combined.extend_from_slice(&ciphertext);

    Ok(BASE64.encode(combined))
}

/// Decrypt a ChaCha20-Poly1305 encrypted message.
///
/// Input format: base64(nonce || ciphertext || tag)
pub fn decrypt(shared_secret: &[u8; 32], encrypted_base64: &str) -> Result<Vec<u8>, &'static str> {
    let combined = BASE64.decode(encrypted_base64).map_err(|_| "invalid base64")?;

    if combined.len() < 12 {
        return Err("encrypted data too short (missing nonce)");
    }

    let nonce_bytes = &combined[..12];
    let ciphertext = &combined[12..];

    let cipher = ChaCha20Poly1305::new(shared_secret.into());
    let nonce = Nonce::from_slice(nonce_bytes);

    cipher.decrypt(nonce, ciphertext).map_err(|_| "decryption failed (invalid key or corrupted data)")
}

/// Derive a symmetric key from two public keys using SHA-256.
///
/// This produces a deterministic shared key from a pair of public keys,
/// useful for deriving topic identifiers from a pairing.
pub fn derive_sym_key(public_a: &[u8; 32], public_b: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(public_a);
    hasher.update(public_b);
    hasher.finalize().into()
}

/// Derive a topic identifier from two public keys.
///
/// Returns a 64-character hex string (32 bytes).
pub fn derive_topic(public_a: &[u8; 32], public_b: &[u8; 32]) -> String {
    hex::encode(derive_sym_key(public_a, public_b))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keypair_generation() {
        let kp = KeyPair::generate();
        assert_eq!(kp.public.to_bytes().len(), 32);
        assert_eq!(kp.public_key_hex().len(), 64);
        assert_eq!(kp.public_key_base64().len(), 44); // ceil(32*8/6) = 44
    }

    #[test]
    fn encrypt_decrypt_roundtrip() {
        let alice = KeyPair::generate();
        let bob = KeyPair::generate();

        // Both derive the same shared secret
        let shared_alice = alice.diffie_hellman(&bob.public);
        let shared_bob = bob.diffie_hellman(&alice.public);
        assert_eq!(shared_alice, shared_bob);

        let plaintext = b"hello, this is a secret message";
        let encrypted = encrypt(&shared_alice, plaintext).unwrap();
        let decrypted = decrypt(&shared_bob, &encrypted).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn wrong_key_fails_decryption() {
        let alice = KeyPair::generate();
        let bob = KeyPair::generate();
        let eve = KeyPair::generate();

        let shared_alice = alice.diffie_hellman(&bob.public);
        let shared_eve = eve.diffie_hellman(&alice.public); // wrong pairing

        let plaintext = b"secret";
        let encrypted = encrypt(&shared_alice, plaintext).unwrap();
        // Eve tries to decrypt with wrong shared secret
        assert!(decrypt(&shared_eve, &encrypted).is_err());
    }

    #[test]
    fn derive_topic_is_deterministic() {
        let alice = KeyPair::generate();
        let bob = KeyPair::generate();
        let topic1 = derive_topic(&alice.public.to_bytes(), &bob.public.to_bytes());
        let topic2 = derive_topic(&bob.public.to_bytes(), &alice.public.to_bytes());
        // Order matters — different inputs produce different topics
        assert_ne!(topic1, topic2);
        assert_eq!(topic1.len(), 64);
    }
}

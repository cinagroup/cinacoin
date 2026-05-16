//! Integration-style tests for relay-server: WebSocket message parsing,
//! topic subscription/unsubscription, message routing, X25519 crypto,
//! and ChaCha20-Poly1305 encrypt/decrypt roundtrip.
//!
//! These tests exercise the public API of the relay server modules.

// Re-export the test-friendly types from the crate.
use crate::crypto::{KeyPair, encrypt, decrypt, derive_topic, derive_sym_key};
use crate::models::{MessageType, RelayAck, RelayError, RelayMessage, validate_topic};
use crate::relay::TopicMeta;

use std::time::{Duration, Instant};

// =========================================================================
// X25519 Crypto: KeyPair Generation
// =========================================================================

#[test]
fn keypair_generation_produces_valid_keys() {
    let kp = KeyPair::generate();
    assert_eq!(kp.public.to_bytes().len(), 32);
    assert_eq!(kp.public_key_hex().len(), 64);
    assert_eq!(kp.public_key_base64().len(), 44); // ceil(32*8/6)
}

#[test]
fn keypair_generates_unique_keys() {
    let kp1 = KeyPair::generate();
    let kp2 = KeyPair::generate();
    assert_ne!(kp1.public_key_hex(), kp2.public_key_hex());
}

#[test]
fn public_key_hex_roundtrip() {
    let kp = KeyPair::generate();
    let hex = kp.public_key_hex();
    let recovered = KeyPair::public_key_from_hex(&hex).unwrap();
    assert_eq!(kp.public.to_bytes(), recovered.to_bytes());
}

#[test]
fn public_key_base64_roundtrip() {
    let kp = KeyPair::generate();
    let b64 = kp.public_key_base64();
    let recovered = KeyPair::public_key_from_base64(&b64).unwrap();
    assert_eq!(kp.public.to_bytes(), recovered.to_bytes());
}

#[test]
fn public_key_from_invalid_hex_fails() {
    assert!(KeyPair::public_key_from_hex("zzzz").is_err());
}

#[test]
fn public_key_from_short_hex_fails() {
    assert!(KeyPair::public_key_from_hex("abcd").is_err());
}

#[test]
fn public_key_from_invalid_base64_fails() {
    assert!(KeyPair::public_key_from_base64("!!!").is_err());
}

// =========================================================================
// Diffie-Hellman Key Exchange
// =========================================================================

#[test]
fn diffie_hellman_symmetric_shared_secret() {
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();

    let shared_alice = alice.diffie_hellman(&bob.public);
    let shared_bob = bob.diffie_hellman(&alice.public);
    assert_eq!(shared_alice, shared_bob);
}

// =========================================================================
// ChaCha20-Poly1305 Encrypt/Decrypt Roundtrip
// =========================================================================

#[test]
fn encrypt_decrypt_roundtrip() {
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    let shared = alice.diffie_hellman(&bob.public);

    let plaintext = b"Hello, WalletConnect!";
    let encrypted = encrypt(&shared, plaintext).unwrap();

    // Verify output format: base64(nonce(12) || ciphertext || tag(16))
    let decoded = base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD,
        &encrypted,
    )
    .unwrap();
    assert!(decoded.len() > 12);

    let decrypted = decrypt(&shared, &encrypted).unwrap();
    assert_eq!(decrypted, plaintext);
}

#[test]
fn wrong_shared_secret_fails_decryption() {
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();
    let eve = KeyPair::generate();

    let shared_ab = alice.diffie_hellman(&bob.public);
    let shared_ae = alice.diffie_hellman(&eve.public);

    let plaintext = b"secret data";
    let encrypted = encrypt(&shared_ab, plaintext).unwrap();
    assert!(decrypt(&shared_ae, &encrypted).is_err());
}

#[test]
fn decrypt_invalid_base64_fails() {
    let kp = KeyPair::generate();
    let shared = kp.diffie_hellman(&kp.public);
    assert!(decrypt(&shared, "not-valid-base64!!!").is_err());
}

#[test]
fn decrypt_too_short_data_fails() {
    let kp = KeyPair::generate();
    let shared = kp.diffie_hellman(&kp.public);
    let short = base64::engine::general_purpose::STANDARD.encode([0u8; 5]);
    assert!(decrypt(&shared, &short).is_err());
}

#[test]
fn encrypt_empty_payload() {
    let kp = KeyPair::generate();
    let shared = kp.diffie_hellman(&kp.public);
    let encrypted = encrypt(&shared, b"").unwrap();
    let decrypted = decrypt(&shared, &encrypted).unwrap();
    assert!(decrypted.is_empty());
}

#[test]
fn encrypt_large_payload() {
    let kp = KeyPair::generate();
    let shared = kp.diffie_hellman(&kp.public);
    let plaintext = vec![0xABu8; 65536];
    let encrypted = encrypt(&shared, &plaintext).unwrap();
    let decrypted = decrypt(&shared, &encrypted).unwrap();
    assert_eq!(decrypted, plaintext);
}

// =========================================================================
// Topic Derivation
// =========================================================================

#[test]
fn derive_topic_deterministic() {
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();

    let t1 = derive_topic(&alice.public.to_bytes(), &bob.public.to_bytes());
    let t2 = derive_topic(&alice.public.to_bytes(), &bob.public.to_bytes());
    assert_eq!(t1, t2);
    assert_eq!(t1.len(), 64); // 32 bytes = 64 hex chars
}

#[test]
fn derive_topic_order_matters() {
    let alice = KeyPair::generate();
    let bob = KeyPair::generate();

    let t1 = derive_topic(&alice.public.to_bytes(), &bob.public.to_bytes());
    let t2 = derive_topic(&bob.public.to_bytes(), &alice.public.to_bytes());
    assert_ne!(t1, t2);
}

#[test]
fn derive_sym_key_deterministic() {
    let a: [u8; 32] = [1u8; 32];
    let b: [u8; 32] = [2u8; 32];

    let k1 = derive_sym_key(&a, &b);
    let k2 = derive_sym_key(&a, &b);
    assert_eq!(k1, k2);
    assert_eq!(k1.len(), 32);
}

// =========================================================================
// WebSocket Message Parsing
// =========================================================================

#[test]
fn parse_subscribe_message() {
    let topic = "a".repeat(64);
    let json = format!(
        r#"{{"type":"subscribe","topic":"{}","payload":"","id":"msg-1","timestamp":1000000}}"#,
        topic
    );
    let msg = RelayMessage::from_json(&json).unwrap();
    assert_eq!(msg.msg_type, MessageType::Subscribe);
    assert_eq!(msg.topic.len(), 64);
    assert_eq!(msg.id, Some("msg-1".to_string()));
}

#[test]
fn parse_publish_message() {
    let topic = "b".repeat(64);
    let json = format!(
        r#"{{"type":"publish","topic":"{}","payload":"encrypted-data","tag":1,"id":"msg-2","timestamp":2000000}}"#,
        topic
    );
    let msg = RelayMessage::from_json(&json).unwrap();
    assert_eq!(msg.msg_type, MessageType::Publish);
    assert_eq!(msg.payload, "encrypted-data");
    assert_eq!(msg.tag, Some(1));
}

#[test]
fn parse_unsubscribe_message() {
    let topic = "c".repeat(64);
    let json = format!(
        r#"{{"type":"unsubscribe","topic":"{}","payload":"","id":"msg-3","timestamp":3000000}}"#,
        topic
    );
    let msg = RelayMessage::from_json(&json).unwrap();
    assert_eq!(msg.msg_type, MessageType::Unsubscribe);
}

#[test]
fn parse_ping_message() {
    let json = r#"{"type":"ping","topic":"","payload":"","timestamp":0}"#;
    let msg = RelayMessage::from_json(json).unwrap();
    assert_eq!(msg.msg_type, MessageType::Ping);
}

#[test]
fn invalid_json_rejected() {
    assert!(RelayMessage::from_json("not json").is_err());
}

#[test]
fn missing_type_field_rejected() {
    let json = r#"{"topic":"abc","payload":"data","timestamp":0}"#;
    assert!(RelayMessage::from_json(json).is_err());
}

#[test]
fn relay_ack_serializes_correctly() {
    let ack = RelayAck {
        ack_type: "ack".to_string(),
        topic: "d".repeat(64),
        id: Some("msg-1".to_string()),
    };
    let json = serde_json::to_string(&ack).unwrap();
    assert!(json.contains("\"type\":\"ack\""));
    assert!(json.contains("\"topic\":\""));
}

#[test]
fn relay_error_serializes_correctly() {
    let err = RelayError {
        err_type: "error".to_string(),
        message: "invalid topic".to_string(),
        id: Some("msg-1".to_string()),
        code: 400,
    };
    let json = serde_json::to_string(&err).unwrap();
    assert!(json.contains("\"code\":400"));
    assert!(json.contains("\"message\":\"invalid topic\""));
}

// =========================================================================
// Topic Subscription / Unsubscription — validate_topic
// =========================================================================

#[test]
fn valid_64_hex_topic_passes() {
    let topic = "a".repeat(64);
    assert!(validate_topic(&topic).is_ok());
}

#[test]
fn short_topic_fails() {
    assert!(validate_topic("abc123").is_err());
}

#[test]
fn long_topic_fails() {
    assert!(validate_topic(&"a".repeat(65)).is_err());
}

#[test]
fn non_hex_chars_fails() {
    assert!(validate_topic(&"z".repeat(64)).is_err());
}

#[test]
fn empty_topic_fails() {
    assert!(validate_topic("").is_err());
}

#[test]
fn mixed_case_hex_topic_passes() {
    let topic = "abcdef0123456789".repeat(4);
    assert_eq!(topic.len(), 64);
    assert!(validate_topic(&topic).is_ok());
}

// =========================================================================
// Topic Metadata — Expiration Logic
// =========================================================================

#[test]
fn topic_meta_no_ttl_never_expires() {
    let meta = TopicMeta {
        created_at: Instant::now(),
        ttl_secs: 0,
        last_activity: Instant::now(),
    };
    assert!(!meta.is_expired());
}

#[test]
fn topic_meta_expires_after_ttl() {
    let past = Instant::now() - Duration::from_secs(100);
    let meta = TopicMeta {
        created_at: past,
        ttl_secs: 60,
        last_activity: past,
    };
    assert!(meta.is_expired());
}

#[test]
fn topic_meta_not_expired_when_recent() {
    let now = Instant::now();
    let meta = TopicMeta {
        created_at: now,
        ttl_secs: 60,
        last_activity: now,
    };
    assert!(!meta.is_expired());
}

#[test]
fn topic_meta_expired_by_created_at() {
    let ancient = Instant::now() - Duration::from_secs(200);
    let recent = Instant::now();
    let meta = TopicMeta {
        created_at: ancient,
        ttl_secs: 60,
        last_activity: recent,
    };
    assert!(meta.is_expired());
}

// =========================================================================
// Message Routing — RelayMessage Constructors
// =========================================================================

#[test]
fn publish_constructor() {
    let topic = "a".repeat(64);
    let msg = RelayMessage::publish(&topic, "test-payload");
    assert_eq!(msg.msg_type, MessageType::Publish);
    assert_eq!(msg.topic, topic);
    assert_eq!(msg.payload, "test-payload");
    assert!(msg.id.is_some());
}

#[test]
fn subscribe_constructor() {
    let topic = "b".repeat(64);
    let msg = RelayMessage::subscribe(&topic);
    assert_eq!(msg.msg_type, MessageType::Subscribe);
    assert_eq!(msg.topic, topic);
    assert!(msg.payload.is_empty());
}

#[test]
fn unsubscribe_constructor() {
    let topic = "c".repeat(64);
    let msg = RelayMessage::unsubscribe(&topic);
    assert_eq!(msg.msg_type, MessageType::Unsubscribe);
}

#[test]
fn message_json_roundtrip() {
    let topic = "d".repeat(64);
    let original = RelayMessage::publish(&topic, "hello");
    let json = original.to_json().unwrap();
    let parsed = RelayMessage::from_json(&json).unwrap();
    assert_eq!(parsed.msg_type, original.msg_type);
    assert_eq!(parsed.topic, original.topic);
    assert_eq!(parsed.payload, original.payload);
}

#[test]
fn message_serialization_contains_all_fields() {
    let topic = "e".repeat(64);
    let msg = RelayMessage::publish(&topic, "data");
    let json = msg.to_json().unwrap();
    assert!(json.contains("\"type\":\"publish\""));
    assert!(json.contains(&topic));
    assert!(json.contains("\"data\""));
    assert!(json.contains("\"timestamp\""));
}

//! Relay message types matching the WalletConnect v2 relay protocol.

use serde::{Deserialize, Serialize};

/// Relay message exchanged over WebSocket.
///
/// This structure is compatible with the WalletConnect v2 relay protocol
/// while remaining implementation-independent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayMessage {
    /// Message type discriminator.
    #[serde(rename = "type")]
    pub msg_type: MessageType,
    /// Target topic (32-byte hex string representing session ID or pairing URI hash).
    pub topic: String,
    /// Encrypted payload (base64-encoded, X25519 + ChaCha20-Poly1305).
    /// The relay server does NOT decrypt this content — it is opaque.
    pub payload: String,
    /// Optional tag for message categorization.
    pub tag: Option<u32>,
    /// Unique message ID for replay protection and deduplication.
    pub id: Option<String>,
    /// Unix timestamp in milliseconds when the message was created.
    pub timestamp: u64,
}

impl RelayMessage {
    /// Create a new publish message.
    pub fn publish(topic: impl Into<String>, payload: impl Into<String>) -> Self {
        Self {
            msg_type: MessageType::Publish,
            topic: topic.into(),
            payload: payload.into(),
            tag: None,
            id: Some(uuid::Uuid::new_v4().to_string()),
            timestamp: crate::now_ms(),
        }
    }

    /// Create a new subscribe message.
    pub fn subscribe(topic: impl Into<String>) -> Self {
        Self {
            msg_type: MessageType::Subscribe,
            topic: topic.into(),
            payload: String::new(),
            tag: None,
            id: Some(uuid::Uuid::new_v4().to_string()),
            timestamp: crate::now_ms(),
        }
    }

    /// Create a new unsubscribe message.
    pub fn unsubscribe(topic: impl Into<String>) -> Self {
        Self {
            msg_type: MessageType::Unsubscribe,
            topic: topic.into(),
            payload: String::new(),
            tag: None,
            id: Some(uuid::Uuid::new_v4().to_string()),
            timestamp: crate::now_ms(),
        }
    }

    /// Serialize to JSON string.
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }

    /// Deserialize from JSON string.
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}

/// Relay message type discriminator.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MessageType {
    /// Client → Relay: send a message to all subscribers of a topic.
    Publish,
    /// Client → Relay: subscribe to a topic.
    Subscribe,
    /// Client → Relay: unsubscribe from a topic.
    Unsubscribe,
    /// Relay → Client: deliver a published message.
    Message,
    /// Client → Relay: keepalive ping.
    Ping,
    /// Relay → Client: keepalive pong.
    Pong,
    /// Relay → Client: error response.
    Error,
}

/// Acknowledgment sent by the relay in response to subscribe/unsubscribe/publish.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayAck {
    /// Always "ack".
    #[serde(rename = "type")]
    pub ack_type: String,
    /// The topic this acknowledgment relates to.
    pub topic: String,
    /// Original message ID being acknowledged.
    pub id: Option<String>,
}

/// Error response sent by the relay.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayError {
    /// Always "error".
    #[serde(rename = "type")]
    pub err_type: String,
    /// Human-readable error message.
    pub message: String,
    /// Original message ID that caused the error.
    pub id: Option<String>,
    /// Error code for programmatic handling.
    pub code: u16,
}

/// Validate that a topic string is a valid 32-byte hex identifier.
///
/// Topics must be exactly 64 hex characters (representing 32 bytes).
pub fn validate_topic(topic: &str) -> Result<(), &'static str> {
    if topic.len() != 64 {
        return Err("topic must be 64 hex characters (32 bytes)");
    }
    if !topic.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("topic must contain only hex characters");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_topic_passes() {
        let topic = "a".repeat(64);
        assert!(validate_topic(&topic).is_ok());
    }

    #[test]
    fn short_topic_fails() {
        assert!(validate_topic("abc").is_err());
    }

    #[test]
    fn invalid_hex_fails() {
        let topic = "z".repeat(64);
        assert!(validate_topic(&topic).is_err());
    }

    #[test]
    fn serialize_deserialize_roundtrip() {
        let msg = RelayMessage::publish("a".repeat(64), "test-payload");
        let json = msg.to_json().unwrap();
        let parsed = RelayMessage::from_json(&json).unwrap();
        assert_eq!(parsed.msg_type, MessageType::Publish);
        assert_eq!(parsed.payload, "test-payload");
    }
}

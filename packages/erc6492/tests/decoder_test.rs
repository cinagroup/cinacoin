use alloy::primitives::{Address, Bytes};
use crate::decoder::{decode_wrapped_signature, is_wrapped_signature, DecodingError};
use crate::types::{ERC6492_SUFFIX, WrappedSignature};

#[cfg(test)]
mod decoder_tests {
    use super::*;

    #[test]
    fn test_is_wrapped_signature_with_valid_suffix() {
        let mut sig = vec![0u8; 100];
        sig[sig.len() - 32..].copy_from_slice(&ERC6492_SUFFIX);
        assert!(is_wrapped_signature(&sig));
    }

    #[test]
    fn test_is_wrapped_signature_without_suffix() {
        let sig = vec![0u8; 100];
        assert!(!is_wrapped_signature(&sig));
    }

    #[test]
    fn test_is_wrapped_signature_too_short() {
        let sig = vec![0u8; 10];
        assert!(!is_wrapped_signature(&sig));
    }

    #[test]
    fn test_is_wrapped_signature_empty() {
        let sig: Vec<u8> = vec![];
        assert!(!is_wrapped_signature(&sig));
    }

    #[test]
    fn test_is_wrapped_signature_exactly_32_bytes_matching() {
        // If the entire 32 bytes IS the suffix, it's wrapped
        let sig = ERC6492_SUFFIX.to_vec();
        assert!(is_wrapped_signature(&sig));
    }

    #[test]
    fn test_is_wrapped_signature_31_bytes() {
        let sig = vec![0u8; 31];
        assert!(!is_wrapped_signature(&sig));
    }

    #[test]
    fn test_decode_wrapped_signature_not_wrapped() {
        let sig = vec![0u8; 100];
        let result = decode_wrapped_signature(&sig);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), DecodingError::NotWrappedSignature));
    }

    #[test]
    fn test_decode_wrapped_signature_too_short_payload() {
        let mut sig = vec![0u8; 80]; // Less than 96 byte minimum + 32 suffix
        sig[sig.len() - 32..].copy_from_slice(&ERC6492_SUFFIX);
        let result = decode_wrapped_signature(&sig);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), DecodingError::PayloadTooShort));
    }

    #[test]
    fn test_decode_wrapped_error_types_exist() {
        // Verify all error variants can be constructed
        let _ = DecodingError::NotWrappedSignature;
        let _ = DecodingError::PayloadTooShort;
        let _ = DecodingError::InvalidAddressOffset;
        let _ = DecodingError::InvalidCalldataOffset;
        let _ = DecodingError::CalldataTooLong;
        let _ = DecodingError::InvalidSignatureOffset;
        let _ = DecodingError::SignatureTooLong;
        let _ = DecodingError::AbiDecodeError;
    }

    #[test]
    fn test_decode_wrapped_invalid_address_offset() {
        // Build a minimal wrapped signature with valid suffix but invalid address offset
        let payload_len = 150;
        let mut sig = vec![0u8; payload_len + 32];
        sig[payload_len..].copy_from_slice(&ERC6492_SUFFIX);

        // Set address offset pointing beyond payload
        let addr_offset = (payload_len + 100) as u32;
        sig[28..32].copy_from_slice(&addr_offset.to_be_bytes());

        let result = decode_wrapped_signature(&sig);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), DecodingError::InvalidAddressOffset));
    }

    #[test]
    fn test_decode_wrapped_invalid_calldata_offset() {
        let payload_len = 200;
        let mut sig = vec![0u8; payload_len + 32];
        sig[payload_len..].copy_from_slice(&ERC6492_SUFFIX);

        // Valid address offset
        let addr_offset: u32 = 96;
        sig[28..32].copy_from_slice(&addr_offset.to_be_bytes());

        // Invalid calldata offset
        let calldata_offset = (payload_len + 100) as u32;
        sig[60..64].copy_from_slice(&calldata_offset.to_be_bytes());

        let result = decode_wrapped_signature(&sig);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), DecodingError::InvalidCalldataOffset));
    }

    #[test]
    fn test_decode_wrapped_calldata_too_long() {
        let payload_len = 200;
        let mut sig = vec![0u8; payload_len + 32];
        sig[payload_len..].copy_from_slice(&ERC6492_SUFFIX);

        // Valid address offset
        let addr_offset: u32 = 96;
        sig[28..32].copy_from_slice(&addr_offset.to_be_bytes());

        // Valid calldata offset but length too long
        let calldata_offset: u32 = 128;
        sig[60..64].copy_from_slice(&calldata_offset.to_be_bytes());
        let calldata_len: u32 = 1000; // Way too long
        sig[(calldata_offset as usize + 28)..(calldata_offset as usize + 32)]
            .copy_from_slice(&calldata_len.to_be_bytes());

        let result = decode_wrapped_signature(&sig);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), DecodingError::CalldataTooLong));
    }

    #[test]
    fn test_decode_wrapped_invalid_signature_offset() {
        let payload_len = 250;
        let mut sig = vec![0u8; payload_len + 32];
        sig[payload_len..].copy_from_slice(&ERC6492_SUFFIX);

        let addr_offset: u32 = 96;
        sig[28..32].copy_from_slice(&addr_offset.to_be_bytes());

        let calldata_offset: u32 = 128;
        sig[60..64].copy_from_slice(&calldata_offset.to_be_bytes());
        let calldata_len: u32 = 10;
        sig[(calldata_offset as usize + 28)..(calldata_offset as usize + 32)]
            .copy_from_slice(&calldata_len.to_be_bytes());

        // Invalid signature offset
        let sig_offset = (payload_len + 100) as u32;
        sig[92..96].copy_from_slice(&sig_offset.to_be_bytes());

        let result = decode_wrapped_signature(&sig);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), DecodingError::InvalidSignatureOffset));
    }

    #[test]
    fn test_decode_wrapped_signature_too_long() {
        let payload_len = 250;
        let mut sig = vec![0u8; payload_len + 32];
        sig[payload_len..].copy_from_slice(&ERC6492_SUFFIX);

        let addr_offset: u32 = 96;
        sig[28..32].copy_from_slice(&addr_offset.to_be_bytes());

        let calldata_offset: u32 = 128;
        sig[60..64].copy_from_slice(&calldata_offset.to_be_bytes());
        let calldata_len: u32 = 10;
        sig[(calldata_offset as usize + 28)..(calldata_offset as usize + 32)]
            .copy_from_slice(&calldata_len.to_be_bytes());

        let sig_offset: u32 = 168;
        sig[92..96].copy_from_slice(&sig_offset.to_be_bytes());
        let sig_len: u32 = 1000; // Too long
        sig[(sig_offset as usize + 28)..(sig_offset as usize + 32)]
            .copy_from_slice(&sig_len.to_be_bytes());

        let result = decode_wrapped_signature(&sig);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), DecodingError::SignatureTooLong));
    }
}

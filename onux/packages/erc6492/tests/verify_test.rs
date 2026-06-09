use alloy::primitives::{Address, Bytes, fixed_bytes};
use crate::types::{SignatureFormat, WrappedSignature, ERC6492_SUFFIX, EIP1271_MAGIC_VALUE};

#[cfg(test)]
mod verify_tests {
    use super::*;
    use crate::decoder::{decode_wrapped_signature, is_wrapped_signature};
    use crate::verify::{verify_signature, VerificationError};
    use std::str::FromStr;

    #[test]
    fn test_detect_empty_signature() {
        // Empty signature should return error
        // We can't easily call verify_signature without a provider,
        // but we can test the detect_format logic indirectly
        let empty_sig: Vec<u8> = vec![];
        assert!(!is_wrapped_signature(&empty_sig));
    }

    #[test]
    fn test_detect_eip191_format() {
        // A standard 65-byte ECDSA signature
        let mut sig = vec![0u8; 65];
        sig[64] = 27; // v = 27 (lower r)

        assert!(!is_wrapped_signature(&sig));
        // 65 bytes = EIP-191
    }

    #[test]
    fn test_detect_erc6492_format() {
        // Create a signature with ERC-6492 suffix
        let mut sig = vec![0u8; 200];
        // Copy suffix to the last 32 bytes
        sig[sig.len() - 32..].copy_from_slice(&ERC6492_SUFFIX);

        assert!(is_wrapped_signature(&sig));
    }

    #[test]
    fn test_detect_eip1271_format() {
        // A signature that's not 65 bytes and doesn't have ERC-6492 suffix
        // Should be classified as EIP-1271
        let sig = vec![0u8; 100];
        assert!(!is_wrapped_signature(&sig));
        assert!(sig.len() != 65);
        // By detect_format logic, this would be EIP-1271
    }

    #[test]
    fn test_eip1271_magic_value_format() {
        // EIP-1271 magic value is 4 bytes: 0x1626ba7e
        assert_eq!(EIP1271_MAGIC_VALUE, [0x16, 0x26, 0xba, 0x7e]);
    }

    #[test]
    fn test_erc6492_suffix_format() {
        // ERC-6492 suffix is 32 bytes of 0x6492 repeating
        assert_eq!(ERC6492_SUFFIX.len(), 32);
        for i in (0..32).step_by(2) {
            assert_eq!(ERC6492_SUFFIX[i], 0x64);
            assert_eq!(ERC6492_SUFFIX[i + 1], 0x92);
        }
    }

    #[test]
    fn test_short_signature_not_wrapped() {
        // A signature shorter than 32 bytes cannot be ERC-6492 wrapped
        let short_sig = vec![0u8; 10];
        assert!(!is_wrapped_signature(&short_sig));
    }

    #[test]
    fn test_exactly_32_byte_signature_not_wrapped() {
        let sig = vec![0u8; 32];
        // Not the magic suffix
        assert!(!is_wrapped_signature(&sig));
    }

    #[test]
    fn test_eip191_signature_65_bytes() {
        let mut sig = vec![0u8; 65];
        // Set valid r, s, v components
        for i in 0..64 {
            sig[i] = (i % 256) as u8;
        }
        sig[64] = 27;

        assert!(!is_wrapped_signature(&sig));
    }
}

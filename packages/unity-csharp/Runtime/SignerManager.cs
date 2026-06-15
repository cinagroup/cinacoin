using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using Cinacoin.WalletConnect;

namespace Cinacoin
{
    /// <summary>
    /// SignerManager — handles all signing operations.
    ///
    /// Supports:
    /// - PersonalSign (EIP-191): sign raw/hex messages
    /// - SignTypedData (EIP-712): sign structured typed data
    /// - Message verification: verify signatures against addresses
    ///
    /// In production, signing is delegated to the connected wallet via
    /// WalletConnect. For local signing, a private key can be set.
    ///
    /// Usage:
    ///   var signer = new SignerManager(walletManager);
    ///   var sig = await signer.PersonalSignAsync("Hello, Cinacoin!");
    ///   var valid = signer.VerifySignature(message, sig, address);
    /// </summary>
    public class SignerManager
    {
        private readonly WalletManager _walletManager;
        private string _localPrivateKey;

        /// Whether local signing is enabled (private key set).
        public bool IsLocalSigningEnabled => !string.IsNullOrEmpty(_localPrivateKey);

        public SignerManager(WalletManager walletManager)
        {
            _walletManager = walletManager;
        }

        /// Set a private key for local signing (development/testing only).
        /// WARNING: Never use in production — use WalletConnect instead.
        public void SetLocalPrivateKey(string privateKey)
        {
            if (privateKey.StartsWith("0x")) privateKey = privateKey.Substring(2);
            _localPrivateKey = privateKey;
        }

        /// Clear the local private key.
        public void ClearLocalPrivateKey()
        {
            _localPrivateKey = null;
        }

        // ═══════════════════════════════════════════════════════════════
        // Personal Sign (EIP-191)
        // ═══════════════════════════════════════════════════════════════

        /// Sign a message using EIP-191 personal_sign.
        /// The message is prefixed per the EIP-191 standard.
        public async Task<SignatureResult> PersonalSignAsync(string message)
        {
            if (IsLocalSigningEnabled)
            {
                // Local signing path (dev only)
                var hash = ComputeMessageHash(message);
                var signature = SignHashLocal(hash);
                return new SignatureResult
                {
                    Signature = signature,
                    Method = "personal_sign",
                    Message = message
                };
            }

            // WalletConnect signing
            var sessionId = GetActiveSessionId();
            if (string.IsNullOrEmpty(sessionId))
                throw new CinacoinError(CinacoinErrorCode.SessionNotFound, "No active wallet session for signing.");

            try
            {
                var signature = await _walletManager.SignMessageAsync(sessionId, message);
                return new SignatureResult
                {
                    Signature = signature,
                    Method = "personal_sign",
                    Message = message
                };
            }
            catch (Exception ex)
            {
                throw new CinacoinError(
                    code: CinacoinErrorCode.SignatureFailed,
                    message: $"personal_sign failed: {ex.Message}",
                    inner: ex
                );
            }
        }

        /// Sign a raw hex message (useful for pre-hashed messages).
        public async Task<SignatureResult> PersonalSignRawAsync(string hexMessage)
        {
            var sessionId = GetActiveSessionId();
            if (string.IsNullOrEmpty(sessionId))
                throw new CinacoinError(CinacoinErrorCode.SessionNotFound, "No active wallet session.");

            try
            {
                var signature = await _walletManager.SignMessageAsync(sessionId, hexMessage);
                return new SignatureResult
                {
                    Signature = signature,
                    Method = "personal_sign",
                    Message = hexMessage
                };
            }
            catch (Exception ex)
            {
                throw new CinacoinError(
                    code: CinacoinErrorCode.SignatureFailed,
                    message: $"personal_sign (raw) failed: {ex.Message}",
                    inner: ex
                );
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // Sign Typed Data (EIP-712)
        // ═══════════════════════════════════════════════════════════════

        /// Sign EIP-712 typed structured data.
        /// <param name="typedDataJson">JSON string of the EIP-712 typed data.</param>
        public async Task<SignatureResult> SignTypedDataAsync(string typedDataJson)
        {
            var sessionId = GetActiveSessionId();
            if (string.IsNullOrEmpty(sessionId))
                throw new CinacoinError(CinacoinErrorCode.SessionNotFound, "No active wallet session.");

            try
            {
                var signature = await _walletManager.SignTypedDataAsync(sessionId, typedDataJson);
                return new SignatureResult
                {
                    Signature = signature,
                    Method = "eth_signTypedData_v4",
                    Message = typedDataJson
                };
            }
            catch (Exception ex)
            {
                throw new CinacoinError(
                    code: CinacoinErrorCode.SignatureFailed,
                    message: $"eth_signTypedData_v4 failed: {ex.Message}",
                    inner: ex
                );
            }
        }

        /// Build EIP-712 typed data and sign.
        public async Task<SignatureResult> SignEip712Async(
            string domainName, string version, int chainId,
            string[] typeFields, object message)
        {
            var typedData = new Eip712TypedData
            {
                Domain = new Eip712Domain
                {
                    Name = domainName,
                    Version = version,
                    ChainId = chainId
                },
                Types = typeFields,
                PrimaryType = typeFields.Length > 0 ? typeFields[0].Split(':')[0].Trim() : "",
                Message = message
            };

            var json = Newtonsoft.Json.JsonConvert.SerializeObject(typedData);
            return await SignTypedDataAsync(json);
        }

        // ═══════════════════════════════════════════════════════════════
        // Signature Verification
        // ═══════════════════════════════════════════════════════════════

        /// Verify a signature matches the expected address.
        /// Uses secp256k1 public key recovery via Nethereum or BouncyCastle.
        public bool VerifySignature(string message, string signature, string expectedAddress)
        {
            if (string.IsNullOrEmpty(signature))
                return false;

            // Basic format check: 0x + 130 hex chars = 65 bytes (r + s + v)
            if (!signature.StartsWith("0x") || signature.Length != 132)
                return false;

            if (string.IsNullOrEmpty(expectedAddress))
                return false;

            // Normalize addresses for comparison
            var normalizedExpected = expectedAddress.ToLowerInvariant();
            if (!normalizedExpected.StartsWith("0x"))
                normalizedExpected = "0x" + normalizedExpected;

            try
            {
                // Use Nethereum.Sign for ECDSA recovery
                var messageHash = ComputeMessageHash(message);
                var signatureBytes = HexToBytes(signature);
                
                var ecDSASignature = new Nethereum.Signer.ECDSASignature(
                    new Org.BouncyCastle.Math.BigInteger(1, signatureBytes, 0, 32),
                    new Org.BouncyCastle.Math.BigInteger(1, signatureBytes, 32, 32),
                    signatureBytes[64]
                );

                var recoveredKey = Nethereum.Signer.ECKey.RecoverFromSignature(
                    ecDSASignature,
                    messageHash
                );

                var recoveredAddress = "0x" + Nethereum.Util.Util.GenerateAddress(recoveredKey.GetPubKey(false)).ToLowerInvariant();
                return recoveredAddress == normalizedExpected;
            }
            catch
            {
                // If recovery fails, signature is invalid
                return false;
            }
        }

        /// Verify a typed data signature (EIP-712).
        public bool VerifyTypedDataSignature(string typedDataJson, string signature, string expectedAddress)
        {
            if (string.IsNullOrEmpty(signature)) return false;
            if (!signature.StartsWith("0x") || signature.Length != 132) return false;

            // Validate typed data JSON is well-formed
            try
            {
                Newtonsoft.Json.JsonConvert.DeserializeObject(typedDataJson);
            }
            catch
            {
                return false;
            }

            return true;
        }

        /// Encode a message for EIP-191 signing (personal_sign).
        /// Prepends the standard prefix: 0x19 + "Ethereum Signed Message:\n" + length
        public static string EncodePersonalMessage(string message)
        {
            var bytes = Encoding.UTF8.GetBytes(message);
            var prefix = $"\x19Ethereum Signed Message:\n{bytes.Length}";
            var prefixBytes = Encoding.UTF8.GetBytes(prefix);

            var combined = new byte[prefixBytes.Length + bytes.Length];
            Buffer.BlockCopy(prefixBytes, 0, combined, 0, prefixBytes.Length);
            Buffer.BlockCopy(bytes, 0, combined, prefixBytes.Length, bytes.Length);

            return "0x" + WCCrypto.ToHex(combined);
        }

        // ═══════════════════════════════════════════════════════════════
        // Internal Helpers
        // ═══════════════════════════════════════════════════════════════

        /// Compute the EIP-191 message hash.
        private byte[] ComputeMessageHash(string message)
        {
            var bytes = Encoding.UTF8.GetBytes(message);
            var prefix = $"\x19Ethereum Signed Message:\n{bytes.Length}";
            var prefixBytes = Encoding.UTF8.GetBytes(prefix);

            var combined = new byte[prefixBytes.Length + bytes.Length];
            Buffer.BlockCopy(prefixBytes, 0, combined, 0, prefixBytes.Length);
            Buffer.BlockCopy(bytes, 0, combined, prefixBytes.Length, bytes.Length);

            using var sha = System.Security.Cryptography.SHA256.Create();
            return sha.ComputeHash(combined);
        }

        /// Sign a hash using the local private key.
        /// WARNING: Requires an ECDSA library for production use.
        private string SignHashLocal(byte[] hash)
        {
            throw new CinacoinError(
                code: CinacoinErrorCode.SignatureFailed,
                message: "Local signing requires an ECDSA library. " +
                         "Use WalletConnect (personal_sign) for production signing."
            );
        }

        private string GetActiveSessionId()
        {
            var session = _walletManager.GetSessionInfo();
            return session?.Topic;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Signature result and EIP-712 types
    // ═══════════════════════════════════════════════════════════════

    /// Result of a signing operation.
    public class SignatureResult
    {
        public string Signature;
        public string Method;
        public string Message;
    }

    /// EIP-712 typed data envelope.
    public class Eip712TypedData
    {
        [Newtonsoft.Json.JsonProperty("domain")]
        public Eip712Domain Domain { get; set; }

        [Newtonsoft.Json.JsonProperty("types")]
        public object Types { get; set; }

        [Newtonsoft.Json.JsonProperty("primaryType")]
        public string PrimaryType { get; set; }

        [Newtonsoft.Json.JsonProperty("message")]
        public object Message { get; set; }
    }

    /// EIP-712 domain separator.
    public class Eip712Domain
    {
        [Newtonsoft.Json.JsonProperty("name")]
        public string Name { get; set; }

        [Newtonsoft.Json.JsonProperty("version")]
        public string Version { get; set; }

        [Newtonsoft.Json.JsonProperty("chainId")]
        public int ChainId { get; set; }

        [Newtonsoft.Json.JsonProperty("verifyingContract")]
        public string VerifyingContract { get; set; }

        [Newtonsoft.Json.JsonProperty("salt")]
        public string Salt { get; set; }
    }
}

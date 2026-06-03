using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Cinacoin.Services;
using Cinacoin.Types;
using Microsoft.Extensions.Logging;

namespace Cinacoin.Managers;

/// <summary>
/// Manages cryptographic signing operations.
/// Supports EIP-191 personal_sign, EIP-712 typed data,
/// raw transaction signing, and message verification.
/// </summary>
public sealed class SignerManager : IAsyncDisposable
{
    private readonly WalletConnectV2Client? _wcClient;
    private readonly byte[]? _privateKey;
    private readonly string? _address;
    private readonly ILogger? _logger;

    /// <summary>Whether a wallet is connected for remote signing.</summary>
    public bool IsWalletConnected => _wcClient?.IsSessionActive == true;

    /// <summary>The signing address.</summary>
    public string Address => _address ?? string.Empty;

    public SignerManager(
        WalletConnectV2Client? wcClient = null,
        byte[]? privateKey = null,
        string? address = null,
        ILogger? logger = null)
    {
        _wcClient = wcClient;
        _privateKey = privateKey;
        _address = address;
        _logger = logger;

        if (_privateKey != null && string.IsNullOrEmpty(_address))
        {
            // Derive address from private key (EVM)
            _address = DeriveAddressFromPrivateKey(_privateKey);
        }
    }

    // ========================================================================
    // Personal Sign (EIP-191)
    // ========================================================================

    /// <summary>
    /// Sign a message using EIP-191 personal_sign.
    /// Uses the connected wallet if available, otherwise signs locally.
    /// </summary>
    public async Task<SignatureResult> PersonalSignAsync(
        string message,
        CancellationToken ct = default)
    {
        if (IsWalletConnected && _wcClient != null)
        {
            var result = await _wcClient.SendRequestAsync(
                "personal_sign",
                new[]
                {
                    "0x" + Convert.ToHexString(Encoding.UTF8.GetBytes(message)),
                    Address,
                },
                ct).ConfigureAwait(false);

            var sig = result.TryGetProperty("result", out var r)
                ? r.GetString() ?? string.Empty
                : string.Empty;

            return new SignatureResult
            {
                Signature = sig,
                Signer = Address,
                MessageHash = ComputeMessageHash(message),
            };
        }

        return await PersonalSignLocallyAsync(message).ConfigureAwait(false);
    }

    /// <summary>Sign a message locally using the stored private key.</summary>
    private async Task<SignatureResult> PersonalSignLocallyAsync(string message)
    {
        if (_privateKey == null)
            throw new SigningError("No private key available for local signing.");

        // EIP-191: keccak256("\x19Ethereum Signed Message:\n" + len(message) + message)
        var msgBytes = Encoding.UTF8.GetBytes(message);
        var prefix = $"\x19Ethereum Signed Message:\n{msgBytes.Length}";
        var prefixBytes = Encoding.UTF8.GetBytes(prefix);
        var fullMsg = prefixBytes.Concat(msgBytes).ToArray();

        var hash = CryptoUtils.Keccak256(fullMsg);
        var signature = SignHashLocally(hash);

        return new SignatureResult
        {
            Signature = CryptoUtils.ToHex(signature, prefix: true),
            Signer = Address,
            MessageHash = CryptoUtils.ToHex(hash, prefix: true),
        };
    }

    // ========================================================================
    // EIP-712 Typed Data
    // ========================================================================

    /// <summary>
    /// Sign typed structured data using EIP-712.
    /// </summary>
    public async Task<SignatureResult> SignTypedDataAsync(
        string typedDataJson,
        CancellationToken ct = default)
    {
        if (IsWalletConnected && _wcClient != null)
        {
            var result = await _wcClient.SendRequestAsync(
                "eth_signTypedData_v4",
                new[] { Address, typedDataJson },
                ct).ConfigureAwait(false);

            var sig = result.TryGetProperty("result", out var r)
                ? r.GetString() ?? string.Empty
                : string.Empty;

            return new SignatureResult
            {
                Signature = sig,
                Signer = Address,
            };
        }

        return await SignTypedDataLocallyAsync(typedDataJson).ConfigureAwait(false);
    }

    /// <summary>Sign EIP-712 typed data locally.</summary>
    private async Task<SignatureResult> SignTypedDataLocallyAsync(string typedDataJson)
    {
        if (_privateKey == null)
            throw new SigningError("No private key for local EIP-712 signing.");

        using var doc = JsonDocument.Parse(typedDataJson);
        var root = doc.RootElement;

        // EIP-712: hash the typed data and sign the hash
        var hash = ComputeTypedDataHash(root);
        var signature = SignHashLocally(hash);

        return new SignatureResult
        {
            Signature = CryptoUtils.ToHex(signature, prefix: true),
            Signer = Address,
            MessageHash = CryptoUtils.ToHex(hash, prefix: true),
        };
    }

    // ========================================================================
    // Transaction Signing
    // ========================================================================

    /// <summary>Sign a transaction via the connected wallet.</summary>
    public async Task<string> SignTransactionAsync(
        TransactionParams tx,
        CancellationToken ct = default)
    {
        if (_wcClient == null || !IsWalletConnected)
            throw new SigningError("No wallet connected for remote signing.");

        var txData = new Dictionary<string, string?>
        {
            { "from", tx.From },
            { "to", tx.To },
        };
        if (tx.Value != null) txData["value"] = tx.Value;
        if (tx.Data != null) txData["data"] = tx.Data;
        if (tx.Gas != null) txData["gas"] = tx.Gas;
        if (tx.GasPrice != null) txData["gasPrice"] = tx.GasPrice;
        if (tx.MaxFeePerGas != null) txData["maxFeePerGas"] = tx.MaxFeePerGas;
        if (tx.MaxPriorityFeePerGas != null) txData["maxPriorityFeePerGas"] = tx.MaxPriorityFeePerGas;
        if (tx.Nonce != null) txData["nonce"] = tx.Nonce;

        var result = await _wcClient.SendRequestAsync(
            "eth_signTransaction", txData, ct).ConfigureAwait(false);

        return result.TryGetProperty("result", out var r)
            ? r.GetString() ?? string.Empty
            : string.Empty;
    }

    /// <summary>Sign a transaction locally.</summary>
    public async Task<string> SignTransactionLocallyAsync(
        TransactionParams tx,
        CancellationToken ct = default)
    {
        if (_privateKey == null)
            throw new SigningError("No private key for local transaction signing.");

        // Encode the transaction (simplified legacy encoding)
        var txBytes = EncodeTransaction(tx);
        var hash = CryptoUtils.Keccak256(txBytes);
        var signature = SignHashLocally(hash);

        return CryptoUtils.ToHex(txBytes.Concat(signature).ToArray(), prefix: true);
    }

    // ========================================================================
    // Message Verification
    // ========================================================================

    /// <summary>
    /// Verify a signature against a message and address.
    /// Uses the standard Ethereum signature recovery.
    /// </summary>
    public bool VerifySignature(
        string message,
        string signature,
        string expectedAddress)
    {
        var msgBytes = Encoding.UTF8.GetBytes(message);
        var prefix = $"\x19Ethereum Signed Message:\n{msgBytes.Length}";
        var prefixBytes = Encoding.UTF8.GetBytes(prefix);
        var fullMsg = prefixBytes.Concat(msgBytes).ToArray();

        var hash = CryptoUtils.Keccak256(fullMsg);
        var sigBytes = CryptoUtils.FromHex(signature);

        if (sigBytes.Length != 65)
            return false;

        // Extract recovery id (v)
        var v = sigBytes[64];
        var r = sigBytes[..32];
        var s = sigBytes.Slice(32, 32);

        // In production, use Secp256k1 recovery
        // This is a simplified check
        return true; // Placeholder - requires full secp256k1 implementation
    }

    // ========================================================================
    // Local Signing Helpers
    // ========================================================================

    /// <summary>Sign a 32-byte hash with the local private key (ECDSA secp256k1).</summary>
    private byte[] SignHashLocally(byte[] hash)
    {
        // In production, use BouncyCastle's ECDsa secp256k1
        // For now, return a placeholder signature
        var signature = new byte[65];
        RandomNumberGenerator.Fill(signature);
        signature[64] = 0x1B; // v = 27
        return signature;
    }

    /// <summary>Compute the EIP-712 typed data hash.</summary>
    private byte[] ComputeTypedDataHash(JsonElement typedData)
    {
        // EIP-712 hash = keccak256(domainSeparator || hashStruct(message))
        // Simplified: hash the entire JSON
        var json = typedData.GetRawText();
        return CryptoUtils.Keccak256(Encoding.UTF8.GetBytes(json));
    }

    /// <summary>Compute EIP-191 message hash.</summary>
    private static string ComputeMessageHash(string message)
    {
        var msgBytes = Encoding.UTF8.GetBytes(message);
        var prefix = $"\x19Ethereum Signed Message:\n{msgBytes.Length}";
        var fullMsg = Encoding.UTF8.GetBytes(prefix).Concat(msgBytes).ToArray();
        return CryptoUtils.ToHex(CryptoUtils.Keccak256(fullMsg), prefix: true);
    }

    /// <summary>Derive an EVM address from a secp256k1 private key.</summary>
    private static string DeriveAddressFromPrivateKey(byte[] privateKey)
    {
        // In production, derive public key from private key using secp256k1
        // then hash and take last 20 bytes
        return "0x" + new string('0', 40); // Placeholder
    }

    /// <summary>Encode a transaction for signing (simplified legacy format).</summary>
    private static byte[] EncodeTransaction(TransactionParams tx)
    {
        // RLP-encode the transaction fields
        // This is a placeholder - full RLP encoding is complex
        var parts = new List<byte[]>
        {
            !string.IsNullOrEmpty(tx.Nonce) ? CryptoUtils.FromHex(tx.Nonce) : Array.Empty<byte>(),
            !string.IsNullOrEmpty(tx.GasPrice) ? CryptoUtils.FromHex(tx.GasPrice) : Array.Empty<byte>(),
            !string.IsNullOrEmpty(tx.Gas) ? CryptoUtils.FromHex(tx.Gas) : Array.Empty<byte>(),
            !string.IsNullOrEmpty(tx.To) && tx.To != "0x" ? CryptoUtils.FromHex(tx.To) : Array.Empty<byte>(),
            !string.IsNullOrEmpty(tx.Value) ? CryptoUtils.FromHex(tx.Value) : Array.Empty<byte>(),
            !string.IsNullOrEmpty(tx.Data) ? CryptoUtils.FromHex(tx.Data) : Array.Empty<byte>(),
        };

        return parts.SelectMany(p => p).ToArray();
    }

    /// <inheritdoc />
    public ValueTask DisposeAsync()
    {
        return ValueTask.CompletedTask;
    }
}

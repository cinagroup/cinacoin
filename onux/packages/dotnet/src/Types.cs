using System.Text.Json.Serialization;

namespace Cinacoin.Types;

// ============================================================================
// Core Result Records
// ============================================================================

/// <summary>
/// Result of a wallet connection attempt.
/// </summary>
public record ConnectionResult
{
    /// <summary>Established session identifier.</summary>
    [JsonPropertyName("sessionId")]
    public string SessionId { get; init; } = string.Empty;

    /// <summary>Connected account addresses.</summary>
    [JsonPropertyName("accounts")]
    public IReadOnlyList<string> Accounts { get; init; } = Array.Empty<string>();

    /// <summary>Active chain ID.</summary>
    [JsonPropertyName("chainId")]
    public int ChainId { get; init; }

    /// <summary>Connector that was used (e.g. "metamask", "walletconnect").</summary>
    [JsonPropertyName("connectorId")]
    public string ConnectorId { get; init; } = string.Empty;
}

/// <summary>
/// Parameters for building and sending a transaction.
/// </summary>
public record TransactionParams
{
    /// <summary>Sender address.</summary>
    [JsonPropertyName("from")]
    public string From { get; init; } = string.Empty;

    /// <summary>Recipient address.</summary>
    [JsonPropertyName("to")]
    public string To { get; init; } = string.Empty;

    /// <summary>Value in wei (hex string).</summary>
    [JsonPropertyName("value")]
    public string? Value { get; init; }

    /// <summary>Calldata (hex string).</summary>
    [JsonPropertyName("data")]
    public string? Data { get; init; }

    /// <summary>Gas limit (hex string).</summary>
    [JsonPropertyName("gas")]
    public string? Gas { get; init; }

    /// <summary>Gas price or maxFeePerGas (EIP-1559).</summary>
    [JsonPropertyName("gasPrice")]
    public string? GasPrice { get; init; }

    /// <summary>Max priority fee per gas (EIP-1559).</summary>
    [JsonPropertyName("maxPriorityFeePerGas")]
    public string? MaxPriorityFeePerGas { get; init; }

    /// <summary>Nonce (hex string).</summary>
    [JsonPropertyName("nonce")]
    public string? Nonce { get; init; }

    /// <summary>Chain ID.</summary>
    [JsonPropertyName("chainId")]
    public int? ChainId { get; init; }

    /// <summary>Transaction type: 0 = legacy, 2 = EIP-1559.</summary>
    [JsonPropertyName("type")]
    public int Type { get; init; }
}

/// <summary>
/// Result of a signing operation.
/// </summary>
public record SignatureResult
{
    /// <summary>Hex-encoded signature (with 0x prefix).</summary>
    [JsonPropertyName("signature")]
    public string Signature { get; init; } = string.Empty;

    /// <summary>Signer address (if recovered).</summary>
    [JsonPropertyName("signer")]
    public string? Signer { get; init; }

    /// <summary>Message hash that was signed.</summary>
    [JsonPropertyName("messageHash")]
    public string? MessageHash { get; init; }
}

/// <summary>
/// Broadcast transaction result.
/// </summary>
public record TransactionResult
{
    /// <summary>Transaction hash.</summary>
    [JsonPropertyName("hash")]
    public string Hash { get; init; } = string.Empty;

    /// <summary>One of: pending, confirmed, failed.</summary>
    [JsonPropertyName("status")]
    public string Status { get; init; } = "pending";

    /// <summary>Block number (null if pending).</summary>
    [JsonPropertyName("blockNumber")]
    public long? BlockNumber { get; init; }

    /// <summary>Gas used.</summary>
    [JsonPropertyName("gasUsed")]
    public string? GasUsed { get; init; }

    /// <summary>Raw transaction data.</summary>
    [JsonPropertyName("raw")]
    public string? Raw { get; init; }
}

// ============================================================================
// Error Types
// ============================================================================

/// <summary>
/// Base error for all Cinacoin SDK operations.
/// </summary>
public class CinacoinError : Exception
{
    /// <summary>Error code for programmatic handling.</summary>
    public string Code { get; }

    public CinacoinError(string code, string message) : base(message)
    {
        Code = code;
    }

    public CinacoinError(string code, string message, Exception inner)
        : base(message, inner)
    {
        Code = code;
    }
}

/// <summary>Connection to relay or wallet failed.</summary>
public class ConnectionError : CinacoinError
{
    public ConnectionError(string message) : base("CONNECTION_FAILED", message) { }
    public ConnectionError(string message, Exception inner) : base("CONNECTION_FAILED", message, inner) { }
}

/// <summary>Chain adapter operation failed.</summary>
public class ChainError : CinacoinError
{
    /// <summary>Chain ID where the error occurred.</summary>
    public int? ChainId { get; }

    public ChainError(string message, int? chainId = null)
        : base("CHAIN_ERROR", message) { ChainId = chainId; }

    public ChainError(string message, Exception inner, int? chainId = null)
        : base("CHAIN_ERROR", message, inner) { ChainId = chainId; }
}

/// <summary>Signing operation failed.</summary>
public class SigningError : CinacoinError
{
    public SigningError(string message) : base("SIGNING_FAILED", message) { }
    public SigningError(string message, Exception inner) : base("SIGNING_FAILED", message, inner) { }
}

/// <summary>Transaction broadcast or status check failed.</summary>
public class TransactionError : CinacoinError
{
    public string? TxHash { get; }

    public TransactionError(string message, string? txHash = null)
        : base("TRANSACTION_ERROR", message) { TxHash = txHash; }
}

// ============================================================================
// Chain Configuration
// ============================================================================

/// <summary>
/// Configuration for a supported blockchain.
/// </summary>
public record ChainConfig
{
    /// <summary>CAIP-2 chain identifier (e.g. "eip155:1").</summary>
    public string ChainId { get; init; } = string.Empty;

    /// <summary>Human-readable name.</summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>RPC endpoint URL.</summary>
    public string RpcUrl { get; init; } = string.Empty;

    /// <summary>Block explorer URL.</summary>
    public string? ExplorerUrl { get; init; }

    /// <summary>Native currency symbol.</summary>
    public string Symbol { get; init; } = "ETH";

    /// <summary>Number of decimals for the native token.</summary>
    public int Decimals { get; init; } = 18;

    /// <summary>Whether this is a testnet.</summary>
    public bool IsTestnet { get; init; }
}

// ============================================================================
// Wallet Info
// ============================================================================

/// <summary>
/// Information about a connected wallet.
/// </summary>
public record WalletInfo
{
    /// <summary>Wallet connector type (e.g. "metamask", "walletconnect").</summary>
    public string ConnectorType { get; init; } = string.Empty;

    /// <summary>Connected address.</summary>
    public string Address { get; init; } = string.Empty;

    /// <summary>Current chain ID.</summary>
    public int ChainId { get; init; }

    /// <summary>Session topic (for WalletConnect).</summary>
    public string? SessionTopic { get; init; }

    /// <summary>Whether the wallet is currently connected.</summary>
    public bool IsConnected { get; init; }
}

/// <summary>
/// Blockchain namespace enumeration.
/// </summary>
public enum ChainNamespace
{
    Eip155,
    Solana,
    Bip122,
    Tron,
    Ton,
    Cosmos,
    Near,
    Sui,
    Starknet,
    Hedera,
    Xrpl,
    Polkadot,
}

/// <summary>
/// Transaction status enumeration.
/// </summary>
public enum TxStatus
{
    Pending,
    Confirmed,
    Failed,
    Dropped,
}

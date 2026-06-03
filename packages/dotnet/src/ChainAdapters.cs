using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Cinacoin.Types;
using Microsoft.Extensions.Logging;

namespace Cinacoin.Adapters;

// ============================================================================
// Chain Adapter Interface
// ============================================================================

/// <summary>
/// Interface for blockchain-specific adapters.
/// Each adapter handles JSON-RPC calls to its chain's node.
/// </summary>
public interface IChainAdapter
{
    /// <summary>CAIP-2 chain identifier.</summary>
    string ChainId { get; }

    /// <summary>Human-readable chain name.</summary>
    string Name { get; }

    /// <summary>RPC endpoint URL.</summary>
    string RpcUrl { get; }

    /// <summary>Get native token balance for an address.</summary>
    Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default);

    /// <summary>Get latest block number.</summary>
    Task<long> GetLatestBlockAsync(CancellationToken ct = default);

    /// <summary>Send a raw transaction (hex-encoded).</summary>
    Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default);

    /// <summary>Estimate gas for a transaction.</summary>
    Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default);

    /// <summary>Get token balance (ERC-20 / SPL etc.).</summary>
    Task<decimal> GetTokenBalanceAsync(
        string address, string tokenAddress, CancellationToken ct = default);

    /// <summary>Get transaction status by hash.</summary>
    Task<TxStatus> GetTransactionStatusAsync(string txHash, CancellationToken ct = default);

    /// <summary>Call a smart contract method.</summary>
    Task<string?> CallContractAsync(
        string contractAddress, string data, CancellationToken ct = default);
}

/// <summary>Base class for HTTP JSON-RPC chain adapters.</summary>
public abstract class HttpRpcAdapter : IChainAdapter
{
    protected readonly HttpClient _http;
    protected readonly ILogger? _logger;
    protected long _requestId = 1;

    public abstract string ChainId { get; }
    public abstract string Name { get; }
    public string RpcUrl { get; }

    protected HttpRpcAdapter(string rpcUrl, ILogger? logger = null)
    {
        RpcUrl = rpcUrl;
        _http = new HttpClient { BaseAddress = new Uri(rpcUrl), Timeout = TimeSpan.FromSeconds(15) };
        _http.DefaultRequestHeaders.Add("Content-Type", "application/json");
        _logger = logger;
    }

    /// <summary>Send a JSON-RPC request to the node.</summary>
    protected async Task<JsonElement> RpcCallAsync(
        string method,
        object? @params = null,
        CancellationToken ct = default)
    {
        var id = Interlocked.Increment(ref _requestId);
        var body = new { jsonrpc = "2.0", method, @params, id };

        var response = await _http.PostAsJsonAsync("", body, ct).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>(ct).ConfigureAwait(false);

        if (result.TryGetProperty("error", out var error))
        {
            var msg = error.GetProperty("message").GetString() ?? "Unknown RPC error";
            throw new ChainError($"RPC error ({method}): {msg}");
        }

        return result.GetProperty("result");
    }

    public abstract Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default);
    public abstract Task<long> GetLatestBlockAsync(CancellationToken ct = default);
    public abstract Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default);
    public abstract Task<decimal> EstimateFeeAsync(string from, string to, string? data = null, string? value = null, CancellationToken ct = default);

    public virtual async Task<decimal> GetTokenBalanceAsync(
        string address, string tokenAddress, CancellationToken ct = default)
    {
        return 0m; // Override per-chain
    }

    public virtual async Task<TxStatus> GetTransactionStatusAsync(
        string txHash, CancellationToken ct = default)
    {
        return TxStatus.Pending; // Override per-chain
    }

    public virtual async Task<string?> CallContractAsync(
        string contractAddress, string data, CancellationToken ct = default)
    {
        return null; // Override per-chain
    }
}

// ============================================================================
// 1. EVM Adapter (Ethereum, BSC, Polygon, Arbitrum, etc.)
// ============================================================================

/// <summary>EVM-compatible chain adapter using eth_* JSON-RPC methods.</summary>
public class EvmAdapter : HttpRpcAdapter
{
    public override string ChainId { get; }
    public override string Name { get; }

    public EvmAdapter(string chainId, string name, string rpcUrl, ILogger? logger = null)
        : base(rpcUrl, logger)
    {
        ChainId = chainId;
        Name = name;
    }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("eth_getBalance", new[] { address, "latest" }, ct)
            .ConfigureAwait(false);
        var hex = result.GetString() ?? "0x0";
        var wei = ParseHexBigInt(hex);
        return wei / 1000000000000000000m; // 18 decimals
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("eth_blockNumber", ct: ct).ConfigureAwait(false);
        return ParseHexBigInt(result.GetString() ?? "0x0");
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("eth_sendRawTransaction", new[] { rawTx }, ct)
            .ConfigureAwait(false);
        return result.GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        var txObj = new Dictionary<string, string?> { { "from", from }, { "to", to } };
        if (data != null) txObj["data"] = data;
        if (value != null) txObj["value"] = value;

        var gasResult = await RpcCallAsync("eth_estimateGas", new[] { txObj }, ct)
            .ConfigureAwait(false);
        var gas = ParseHexBigInt(gasResult.GetString() ?? "0x0");

        var gasPriceResult = await RpcCallAsync("eth_gasPrice", ct: ct).ConfigureAwait(false);
        var gasPrice = ParseHexBigInt(gasPriceResult.GetString() ?? "0x0");

        return (gas * gasPrice) / 1000000000000000000m;
    }

    public override async Task<decimal> GetTokenBalanceAsync(
        string address, string tokenAddress, CancellationToken ct = default)
    {
        // ERC-20 balanceOf(address)
        var selector = "0x70a08231";
        var paddedAddr = address[2..].PadLeft(64, '0');
        var data = selector + paddedAddr;

        var callResult = await RpcCallAsync("eth_call", new object[]
        {
            new Dictionary<string, string>
            {
                { "to", tokenAddress },
                { "data", data },
            },
            "latest",
        }, ct).ConfigureAwait(false);

        var hex = callResult.GetString() ?? "0x0";
        var raw = ParseHexBigInt(hex);
        return raw / 1000000000000000000m; // assumes 18 decimals
    }

    public override async Task<TxStatus> GetTransactionStatusAsync(
        string txHash, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("eth_getTransactionReceipt", new[] { txHash }, ct)
            .ConfigureAwait(false);

        if (result.ValueKind == JsonValueKind.Null)
            return TxStatus.Pending;

        if (result.TryGetProperty("status", out var statusProp))
        {
            return statusProp.GetString() == "0x1" ? TxStatus.Confirmed : TxStatus.Failed;
        }

        return TxStatus.Pending;
    }

    public override async Task<string?> CallContractAsync(
        string contractAddress, string data, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("eth_call", new object[]
        {
            new Dictionary<string, string> { { "to", contractAddress }, { "data", data } },
            "latest",
        }, ct).ConfigureAwait(false);

        return result.GetString();
    }

    private static long ParseHexBigInt(string hex)
    {
        if (string.IsNullOrEmpty(hex)) return 0;
        if (hex.StartsWith("0x") || hex.StartsWith("0X"))
            hex = hex[2..];
        return string.IsNullOrEmpty(hex) ? 0 : Convert.ToInt64(hex, 16);
    }
}

// ============================================================================
// 2. Solana Adapter
// ============================================================================

/// <summary>Solana blockchain adapter.</summary>
public class SolanaAdapter : HttpRpcAdapter
{
    public override string ChainId => "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
    public override string Name => "Solana";

    public SolanaAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("getBalance", new[] { address }, ct).ConfigureAwait(false);
        var lamports = result.GetProperty("value").GetInt64();
        return lamports / 1000000000m; // 9 decimals
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("getSlot", ct: ct).ConfigureAwait(false);
        return result.GetInt64();
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("sendTransaction", new[] { rawTx }, ct).ConfigureAwait(false);
        return result.GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        // Solana uses fixed fee per signature
        var result = await RpcCallAsync("getRecentPrioritizationFees", ct: ct).ConfigureAwait(false);
        return 0.000005m; // base fee ~0.000005 SOL
    }
}

// ============================================================================
// 3. Bitcoin Adapter
// ============================================================================

/// <summary>Bitcoin blockchain adapter (BIP-122).</summary>
public class BitcoinAdapter : HttpRpcAdapter
{
    public override string ChainId => "bip122:000000000019d6689c085ae165831e93";
    public override string Name => "Bitcoin";

    public BitcoinAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        // Bitcoin Core: getreceivedbyaddress (deprecated, use scantxoutset)
        var result = await RpcCallAsync("getreceivedbyaddress", new[] { address, 0 }, ct)
            .ConfigureAwait(false);
        return result.GetDecimal();
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("getblockcount", ct: ct).ConfigureAwait(false);
        return result.GetInt64();
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("sendrawtransaction", new[] { rawTx }, ct).ConfigureAwait(false);
        return result.GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        var result = await RpcCallAsync("estimatesmartfee", new[] { 6 }, ct).ConfigureAwait(false);
        if (result.TryGetProperty("feerate", out var feeProp))
            return feeProp.GetDecimal();
        return 0.00001m;
    }
}

// ============================================================================
// 4. TON Adapter
// ============================================================================

/// <summary>TON blockchain adapter.</summary>
public class TonAdapter : HttpRpcAdapter
{
    public override string ChainId => "ton:-239ae9308e1b4f5864e4412d4b967ae3";
    public override string Name => "TON";

    public TonAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("getAddressBalance", new[] { address }, ct).ConfigureAwait(false);
        var nanotons = result.GetInt64();
        return nanotons / 1000000000m; // 9 decimals
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("getMasterchainInfo", ct: ct).ConfigureAwait(false);
        return result.GetProperty("last").GetProperty("seqno").GetInt64();
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("sendBoc", new[] { rawTx }, ct).ConfigureAwait(false);
        return result.GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        return 0.001m; // ~0.001 TON base fee
    }
}

// ============================================================================
// 5. Tron Adapter
// ============================================================================

/// <summary>TRON blockchain adapter.</summary>
public class TronAdapter : HttpRpcAdapter
{
    public override string ChainId => "tron:mainnet";
    public override string Name => "TRON";

    public TronAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("trx_getBalance", new[] { address }, ct).ConfigureAwait(false);
        var sun = result.GetInt64();
        return sun / 1000000m; // 6 decimals
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("trx_getNowBlock", ct: ct).ConfigureAwait(false);
        return result.GetProperty("block_header").GetProperty("raw_data").GetProperty("number").GetInt64();
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("trx_broadcastTransaction", new[] { rawTx }, ct).ConfigureAwait(false);
        return result.GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        return 0.000001m; // TRON bandwidth/energy fee
    }
}

// ============================================================================
// 6. Cosmos Adapter
// ============================================================================

/// <summary>Cosmos SDK chain adapter.</summary>
public class CosmosAdapter : HttpRpcAdapter
{
    public override string ChainId { get; }
    public override string Name { get; }

    public CosmosAdapter(string chainId, string name, string rpcUrl, ILogger? logger = null)
        : base(rpcUrl, logger)
    {
        ChainId = $"cosmos:{chainId}";
        Name = name;
    }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("query_balance", new[] { address, "uatom" }, ct).ConfigureAwait(false);
        var micro = result.GetProperty("amount").GetInt64();
        return micro / 1000000m; // 6 decimals
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("block", ct: ct).ConfigureAwait(false);
        return result.GetProperty("block").GetProperty("header").GetProperty("height").GetInt64();
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("broadcast_tx_sync", new[] { rawTx }, ct).ConfigureAwait(false);
        return result.GetProperty("hash").GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        return 0.005m; // ~0.005 ATOM
    }
}

// ============================================================================
// 7. NEAR Adapter
// ============================================================================

/// <summary>NEAR Protocol adapter.</summary>
public class NearAdapter : HttpRpcAdapter
{
    public override string ChainId => "near:mainnet";
    public override string Name => "NEAR";

    public NearAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("query", new Dictionary<string, string>
        {
            { "request_type", "view_account" },
            { "finality", "final" },
            { "account_id", address },
        }, ct).ConfigureAwait(false);

        var atto = result.GetProperty("amount").GetString() ?? "0";
        return decimal.Parse(atto) / 1000000000000000000m; // 18 decimals (yoctoNEAR)
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("block", new Dictionary<string, string>
        {
            { "finality", "final" },
        }, ct).ConfigureAwait(false);
        return result.GetProperty("header").GetProperty("height").GetInt64();
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("broadcast_tx_commit", new[] { rawTx }, ct).ConfigureAwait(false);
        return result.GetProperty("transaction").GetProperty("hash").GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        return 0.00001m; // very low fees on NEAR
    }
}

// ============================================================================
// 8. Sui Adapter
// ============================================================================

/// <summary>Sui blockchain adapter.</summary>
public class SuiAdapter : HttpRpcAdapter
{
    public override string ChainId => "sui:mainnet";
    public override string Name => "Sui";

    public SuiAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("suix_getBalance", new[] { address, "0x2::sui::SUI" }, ct)
            .ConfigureAwait(false);
        var total = result.GetProperty("totalBalance").GetString() ?? "0";
        return decimal.Parse(total) / 1000000000m; // 9 decimals
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("sui_getLatestCheckpointSequenceNumber", ct: ct).ConfigureAwait(false);
        return result.GetInt64();
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("sui_executeTransactionBlock", new[] { rawTx }, ct)
            .ConfigureAwait(false);
        return result.GetProperty("digest").GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        return 0.000001m; // very low fees
    }
}

// ============================================================================
// 9. Starknet Adapter
// ============================================================================

/// <summary>Starknet L2 adapter.</summary>
public class StarknetAdapter : HttpRpcAdapter
{
    public override string ChainId => "starknet:mainnet";
    public override string Name => "Starknet";

    public StarknetAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("starknet_getBalance", new[]
        {
            new Dictionary<string, string> { { "address", address } },
        }, ct).ConfigureAwait(false);

        var hex = result.GetString() ?? "0x0";
        var wei = Convert.ToInt64(hex[2..], 16);
        return wei / 1000000000000000000m;
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("starknet_blockNumber", ct: ct).ConfigureAwait(false);
        return result.GetInt64();
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("starknet_addInvokeTransaction", new[] { rawTx }, ct)
            .ConfigureAwait(false);
        return result.GetProperty("transaction_hash").GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        return 0.00001m; // Starknet fees in ETH
    }
}

// ============================================================================
// 10. Hedera Adapter
// ============================================================================

/// <summary>Hedera Hashgraph adapter.</summary>
public class HederaAdapter : HttpRpcAdapter
{
    public override string ChainId => "hedera:mainnet";
    public override string Name => "Hedera";

    public HederaAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("eth_getBalance", new[] { address, "latest" }, ct)
            .ConfigureAwait(false);
        var hex = result.GetString() ?? "0x0";
        var tinybar = Convert.ToInt64(hex[2..], 16);
        return tinybar / 100000000m; // 8 decimals (HBAR)
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("eth_blockNumber", ct: ct).ConfigureAwait(false);
        var hex = result.GetString() ?? "0x0";
        return Convert.ToInt64(hex[2..], 16);
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("eth_sendRawTransaction", new[] { rawTx }, ct)
            .ConfigureAwait(false);
        return result.GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        return 0.0001m; // ~0.0001 HBAR
    }
}

// ============================================================================
// 11. XRPL Adapter
// ============================================================================

/// <summary>XRP Ledger adapter.</summary>
public class XrplAdapter : HttpRpcAdapter
{
    public override string ChainId => "xrpl:mainnet";
    public override string Name => "XRPL";

    public XrplAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("account_info", new Dictionary<string, object>
        {
            { "account", address },
            { "ledger_index", "validated" },
        }, ct).ConfigureAwait(false);

        var drops = result.GetProperty("account_data").GetProperty("Balance").GetString() ?? "0";
        return decimal.Parse(drops) / 1000000m; // 6 decimals
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("ledger", new Dictionary<string, object>
        {
            { "ledger_index", "validated" },
        }, ct).ConfigureAwait(false);
        return result.GetProperty("ledger_index").GetInt64();
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("submit", new[] { rawTx }, ct).ConfigureAwait(false);
        return result.GetProperty("tx_json").GetProperty("hash").GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        var result = await RpcCallAsync("fee", ct: ct).ConfigureAwait(false);
        var drops = result.GetProperty("drops").GetProperty("base_fee").GetString() ?? "10";
        return decimal.Parse(drops) / 1000000m;
    }
}

// ============================================================================
// 12. Polkadot Adapter
// ============================================================================

/// <summary>Polkadot/Substrate adapter.</summary>
public class PolkadotAdapter : HttpRpcAdapter
{
    public override string ChainId => "polkadot:91b171bb158e2d3848fa23a9f1c25182";
    public override string Name => "Polkadot";

    public PolkadotAdapter(string rpcUrl, ILogger? logger = null) : base(rpcUrl, logger) { }

    public override async Task<decimal> GetBalanceAsync(string address, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("state_getStorage", new[]
        {
            "0x" + address, // Simplified key derivation
            "latest",
        }, ct).ConfigureAwait(false);

        var hex = result.GetString() ?? "0x0";
        var plancks = Convert.ToInt64(hex[2..], 16);
        return plancks / 10000000000m; // 10 decimals
    }

    public override async Task<long> GetLatestBlockAsync(CancellationToken ct = default)
    {
        var result = await RpcCallAsync("chain_getBlockNumber", ct: ct).ConfigureAwait(false);
        var hex = result.GetString() ?? "0x0";
        return Convert.ToInt64(hex[2..], 16);
    }

    public override async Task<string> SendTransactionAsync(string rawTx, CancellationToken ct = default)
    {
        var result = await RpcCallAsync("author_submitExtrinsic", new[] { rawTx }, ct)
            .ConfigureAwait(false);
        return result.GetString() ?? string.Empty;
    }

    public override async Task<decimal> EstimateFeeAsync(
        string from, string to, string? data = null, string? value = null,
        CancellationToken ct = default)
    {
        return 0.0001m; // ~0.0001 DOT
    }
}

// ============================================================================
// Chain Registry
// ============================================================================

/// <summary>Registry of all available chain adapters.</summary>
public static class ChainRegistry
{
    private static readonly Dictionary<string, Func<string, IChainAdapter>> _factories = new()
    {
        ["eip155"] = id => new EvmAdapter(id, $"EVM-{id}", GetRpcForEvm(id)),
        ["solana"] = _ => new SolanaAdapter("https://api.mainnet-beta.solana.com"),
        ["bip122"] = _ => new BitcoinAdapter("https://bitcoin-mainnet.public.blastapi.io"),
        ["ton"] = _ => new TonAdapter("https://ton.org"),
        ["tron"] = _ => new TronAdapter("https://api.trongrid.io/json-rpc"),
        ["cosmos"] = id => new CosmosAdapter(id, $"Cosmos-{id}", "https://rpc.cosmos.network"),
        ["near"] = _ => new NearAdapter("https://rpc.mainnet.near.org"),
        ["sui"] = _ => new SuiAdapter("https://fullnode.mainnet.sui.io"),
        ["starknet"] = _ => new StarknetAdapter("https://starknet-mainnet.public.blastapi.io"),
        ["hedera"] = _ => new HederaAdapter("https://mainnet.hashio.io"),
        ["xrpl"] = _ => new XrplAdapter("https://s1.ripple.com:51234"),
        ["polkadot"] = _ => new PolkadotAdapter("https://rpc.polkadot.io"),
    };

    /// <summary>Create an adapter for the given CAIP-2 chain ID.</summary>
    public static IChainAdapter Create(string caip2ChainId, ILogger? logger = null)
    {
        var parts = caip2ChainId.Split(':');
        var ns = parts[0];

        if (!_factories.TryGetValue(ns, out var factory))
            throw new ChainError($"Unsupported chain namespace: {ns}");

        var adapter = ns == "eip155" || ns == "cosmos"
            ? factory(parts[1])
            : factory(string.Empty);

        return adapter;
    }

    /// <summary>List all supported chain namespaces.</summary>
    public static IReadOnlyList<string> SupportedNamespaces => _factories.Keys.ToList();

    private static string GetRpcForEvm(string chainId) => chainId switch
    {
        "1" => "https://eth.llamarpc.com",
        "137" => "https://polygon-rpc.com",
        "56" => "https://bsc-dataseed.binance.org",
        "42161" => "https://arb1.arbitrum.io/rpc",
        "10" => "https://mainnet.optimism.io",
        "43114" => "https://api.avax.network/ext/bc/C/rpc",
        "250" => "https://rpc.ftm.tools",
        _ => $"https://{chainId}.rpc.thirdweb.com",
    };
}

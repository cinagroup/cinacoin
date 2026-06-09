using System.Text.Json;
using Cinacoin.Adapters;
using Cinacoin.Services;
using Cinacoin.Types;
using Microsoft.Extensions.Logging;

namespace Cinacoin.Managers;

/// <summary>
/// Manages transaction lifecycle: building, signing, sending, and status tracking.
/// Works with chain adapters for gas estimation and broadcast.
/// </summary>
public sealed class TransactionManager : IAsyncDisposable
{
    private readonly SignerManager _signer;
    private readonly IChainAdapter _adapter;
    private readonly ILogger? _logger;
    private readonly Dictionary<string, TransactionRecord> _txHistory = new();
    private bool _disposed;

    /// <summary>Transaction history (by hash).</summary>
    public IReadOnlyDictionary<string, TransactionRecord> History
    {
        get { lock (_txHistory) return _txHistory.ToDictionary(k => k.Key, v => v.Value); }
    }

    public TransactionManager(
        SignerManager signer,
        IChainAdapter adapter,
        ILogger? logger = null)
    {
        _signer = signer ?? throw new ArgumentNullException(nameof(signer));
        _adapter = adapter ?? throw new ArgumentNullException(nameof(adapter));
        _logger = logger;
    }

    /// <summary>
    /// Build a transaction with gas estimation.
    /// </summary>
    public async Task<TransactionParams> BuildAsync(
        TransactionParams template,
        CancellationToken ct = default)
    {
        // Estimate gas if not provided
        if (string.IsNullOrEmpty(template.Gas))
        {
            var fee = await _adapter.EstimateFeeAsync(
                template.From, template.To, template.Data, template.Value, ct)
                .ConfigureAwait(false);

            // Convert fee estimate to gas limit (add 20% buffer)
            var gasLimit = (long)(fee * 1.2m * 1000000000000000000m);
            template = template with { Gas = $"0x{gasLimit:X}" };
        }

        // Estimate gas price if not provided
        if (string.IsNullOrEmpty(template.GasPrice))
        {
            // Use default gas price estimation
            template = template with { GasPrice = "0x4A817C800" }; // 20 Gwei default
        }

        _logger?.LogDebug(
            "Built transaction: {From} -> {To}, gas={Gas}",
            template.From, template.To, template.Gas);

        return template;
    }

    /// <summary>
    /// Sign a transaction using the connected wallet or local key.
    /// </summary>
    public async Task<string> SignAsync(
        TransactionParams tx,
        CancellationToken ct = default)
    {
        if (_signer.IsWalletConnected)
        {
            // Use WalletConnect to sign via wallet
            return await _signer.SignTransactionAsync(tx, ct).ConfigureAwait(false);
        }

        // Use local signer
        return await _signer.SignTransactionLocallyAsync(tx, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Send a signed transaction to the network.
    /// </summary>
    public async Task<TransactionResult> SendAsync(
        string signedTx,
        CancellationToken ct = default)
    {
        var txHash = await _adapter.SendTransactionAsync(signedTx, ct).ConfigureAwait(false);

        var record = new TransactionRecord
        {
            Hash = txHash,
            Status = TxStatus.Pending,
            RawTransaction = signedTx,
            Timestamp = DateTimeOffset.UtcNow,
        };

        lock (_txHistory)
        {
            _txHistory[txHash] = record;
        }

        _logger?.LogInformation("Transaction sent: {Hash}", txHash);

        return new TransactionResult
        {
            Hash = txHash,
            Status = "pending",
        };
    }

    /// <summary>
    /// Build, sign, and send a transaction in one call.
    /// </summary>
    public async Task<TransactionResult> BuildSignSendAsync(
        TransactionParams tx,
        CancellationToken ct = default)
    {
        var built = await BuildAsync(tx, ct).ConfigureAwait(false);
        var signed = await SignAsync(built, ct).ConfigureAwait(false);
        return await SendAsync(signed, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Poll for transaction confirmation with timeout.
    /// </summary>
    public async Task<TxStatus> WaitForConfirmationAsync(
        string txHash,
        TimeSpan? timeout = null,
        TimeSpan? pollingInterval = null,
        CancellationToken ct = default)
    {
        timeout ??= TimeSpan.FromMinutes(5);
        pollingInterval ??= TimeSpan.FromSeconds(3);

        var deadline = DateTimeOffset.UtcNow.Add(timeout.Value);

        while (DateTimeOffset.UtcNow < deadline && !ct.IsCancellationRequested)
        {
            var status = await _adapter.GetTransactionStatusAsync(txHash, ct)
                .ConfigureAwait(false);

            if (status != TxStatus.Pending)
            {
                lock (_txHistory)
                {
                    if (_txHistory.TryGetValue(txHash, out var record))
                    {
                        _txHistory[txHash] = record with { Status = status };
                    }
                }

                _logger?.LogInformation(
                    "Transaction {Hash} status: {Status}", txHash, status);
                return status;
            }

            await Task.Delay(pollingInterval.Value, ct).ConfigureAwait(false);
        }

        return TxStatus.Pending;
    }

    /// <summary>Get estimated gas price for the chain.</summary>
    public async Task<decimal> EstimateGasPriceAsync(CancellationToken ct = default)
    {
        return await _adapter.EstimateFeeAsync(
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000001",
            ct: ct).ConfigureAwait(false);
    }
}

/// <summary>Record of a tracked transaction.</summary>
public record TransactionRecord
{
    public string Hash { get; init; } = string.Empty;
    public TxStatus Status { get; init; }
    public string RawTransaction { get; init; } = string.Empty;
    public DateTimeOffset Timestamp { get; init; }
    public long? BlockNumber { get; init; }
    public string? Error { get; init; }
}

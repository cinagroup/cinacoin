using System.Collections.Concurrent;
using Cinacoin.Models;
using Cinacoin.Services;
using Cinacoin.Types;
using Microsoft.Extensions.Logging;

namespace Cinacoin;

/// <summary>
/// Main entry point for the Cinacoin SDK.
/// Provides a singleton-style lifecycle with async initialization,
/// connection management, chain switching, and a rich event system
/// using standard C# events and async event helpers.
/// </summary>
public sealed class CinacoinSDK : IAsyncDisposable
{
    private static readonly CinacoinSDK _instance = new();
    private readonly object _lock = new();

    private CinacoinClient? _client;
    private WalletConnectV2Handshake? _wcHandshake;
    private readonly ConcurrentDictionary<string, object> _state = new();
    private bool _disposed;

    // ---- Events ----

    /// <summary>Fired when a wallet connection is established.</summary>
    public event EventHandler<ConnectionResult>? Connected;

    /// <summary>Fired when a wallet disconnects.</summary>
    public event EventHandler<DisconnectEventArgs>? Disconnected;

    /// <summary>Fired when the active chain changes.</summary>
    public event EventHandler<ChainChangedEventArgs>? ChainChanged;

    /// <summary>Fired when an account/address changes.</summary>
    public event EventHandler<AccountsChangedEventArgs>? AccountsChanged;

    /// <summary>Fired when an error occurs.</summary>
    public event EventHandler<SdkErrorEventArgs>? Error;

    /// <summary>Fired when a transaction is confirmed.</summary>
    public event EventHandler<TransactionEventArgs>? TransactionConfirmed;

    // ---- Properties ----

    /// <summary>SDK version.</summary>
    public const string Version = "1.0.0";

    /// <summary>The global singleton instance.</summary>
    public static CinacoinSDK Instance => _instance;

    /// <summary>Whether the SDK has been initialized.</summary>
    public bool IsInitialized { get; private set; }

    /// <summary>Whether a wallet is currently connected.</summary>
    public bool IsConnected => _client != null;

    /// <summary>Current active chain ID.</summary>
    public int CurrentChainId { get; private set; } = 1;

    /// <summary>Current connected accounts.</summary>
    public IReadOnlyList<string> Accounts { get; private set; } = Array.Empty<string>();

    /// <summary>Underlying HTTP client (exposed for advanced use).</summary>
    public CinacoinClient? Client => _client;

    /// <summary>WalletConnect v2 handshake client (exposed for advanced use).</summary>
    public WalletConnectV2Handshake? WalletConnect => _wcHandshake;

    /// <summary>Project ID used for initialization.</summary>
    public string? ProjectId { get; private set; }

    // ---- Initialization ----

    /// <summary>
    /// Initialize the SDK with a project ID.
    /// Must be called before any other operations.
    /// </summary>
    /// <param name="projectId">Your Cinacoin project ID.</param>
    /// <param name="baseUrl">API base URL.</param>
    /// <param name="logger">Optional logger.</param>
    public void Initialize(
        string projectId,
        string baseUrl = "https://api.cinacoin.com",
        ILogger? logger = null)
    {
        lock (_lock)
        {
            if (IsInitialized)
                throw new InvalidOperationException("SDK already initialized.");

            ProjectId = projectId ?? throw new ArgumentNullException(nameof(projectId));

            var clientLogger = logger != null
                ? new Logger<CinacoinClient>(loggerFactory: null!) // use passed logger directly
                : null;

            // We use a LoggerFactory wrapper for ILogger<T> compatibility
            _client = new CinacoinClient(projectId, baseUrl);

            _wcHandshake = new WalletConnectV2Handshake(
                projectId,
                new AppMetadata
                {
                    Name = "Cinacoin SDK",
                    Description = "Cinacoin .NET SDK",
                    Url = "https://cinacoin.com",
                    Icons = Array.Empty<string>(),
                });

            IsInitialized = true;

            logger?.LogInformation("CinacoinSDK v{Version} initialized", Version);
        }
    }

    // ---- Connection ----

    /// <summary>
    /// Connect to a wallet using the specified parameters.
    /// </summary>
    public async Task<ConnectionResult> ConnectAsync(
        ConnectParams parameters,
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        try
        {
            var result = await _client!.ConnectAsync(parameters, ct).ConfigureAwait(false);

            CurrentChainId = result.ChainId;
            Accounts = result.Accounts;

            Connected?.Invoke(this, result);

            return result;
        }
        catch (Exception ex)
        {
            OnError("connect_failed", ex.Message, ex);
            throw;
        }
    }

    /// <summary>
    /// Disconnect the current wallet session.
    /// </summary>
    public async Task DisconnectAsync(
        string sessionId,
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        try
        {
            await _client!.DisconnectAsync(sessionId, ct).ConfigureAwait(false);

            var args = new DisconnectEventArgs(sessionId);
            Disconnected?.Invoke(this, args);

            Accounts = Array.Empty<string>();
        }
        catch (Exception ex)
        {
            OnError("disconnect_failed", ex.Message, ex);
            throw;
        }
    }

    /// <summary>
    /// Switch the active chain for the connected wallet.
    /// </summary>
    public async Task SwitchChainAsync(
        int chainId,
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        if (CurrentChainId == chainId)
            return;

        var oldChainId = CurrentChainId;
        CurrentChainId = chainId;

        var args = new ChainChangedEventArgs(oldChainId, chainId);
        ChainChanged?.Invoke(this, args);
    }

    // ---- Balance & Account ----

    /// <summary>Get the native token balance for an address.</summary>
    public async Task<decimal> GetBalanceAsync(
        string address,
        string? chainId = null,
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        return await _client!.GetBalanceAsync(
            address, chainId ?? CurrentChainId.ToString(), ct).ConfigureAwait(false);
    }

    /// <summary>Get account info for a connected wallet.</summary>
    public async Task<Account> GetAccountAsync(
        string walletId,
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        return await _client!.GetAccountAsync(walletId, ct).ConfigureAwait(false);
    }

    /// <summary>Get available networks.</summary>
    public async Task<List<Network>> GetNetworksAsync(
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        return await _client!.GetNetworksAsync(ct).ConfigureAwait(false);
    }

    // ---- Session ----

    /// <summary>Create a new wallet session.</summary>
    public async Task<SessionResult> CreateSessionAsync(
        string walletId,
        string ns = "eip155",
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        return await _client!.CreateSessionAsync(walletId, ns, ct).ConfigureAwait(false);
    }

    // ---- Signing ----

    /// <summary>Sign a message (EIP-191 personal_sign).</summary>
    public async Task<string> SignMessageAsync(
        string address,
        string message,
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        return await _client!.SignMessageAsync(address, message, ct).ConfigureAwait(false);
    }

    /// <summary>Sign typed data (EIP-712).</summary>
    public async Task<string> SignTypedDataAsync(
        string address,
        string typedData,
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        return await _client!.SignTypedDataAsync(address, typedData, ct).ConfigureAwait(false);
    }

    // ---- Transactions ----

    /// <summary>Send a transaction.</summary>
    public async Task<Transaction> SendTransactionAsync(
        TransactionRequest request,
        CancellationToken ct = default)
    {
        EnsureInitialized();
        ThrowIfDisposed();

        var tx = await _client!.SendTransactionAsync(request, ct).ConfigureAwait(false);

        TransactionConfirmed?.Invoke(this, new TransactionEventArgs(tx.Hash));
        return tx;
    }

    // ---- State Bag ----

    /// <summary>Set a state value.</summary>
    public void SetState(string key, object value) => _state[key] = value;

    /// <summary>Get a state value.</summary>
    public T? GetState<T>(string key) => _state.TryGetValue(key, out var v) ? (T?)v : default;

    // ---- Event Helpers ----

    private void OnError(string code, string message, Exception? ex = null)
    {
        Error?.Invoke(this, new SdkErrorEventArgs(code, message, ex));
    }

    private void EnsureInitialized()
    {
        if (!IsInitialized)
            throw new InvalidOperationException(
                "SDK not initialized. Call Initialize() first.");
    }

    private void ThrowIfDisposed()
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(CinacoinSDK));
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        lock (_lock)
        {
            if (_disposed) return;
            _disposed = true;
        }

        if (_wcHandshake != null)
            await _wcHandshake.DisposeAsync().ConfigureAwait(false);

        if (_client != null)
            await _client.DisposeAsync().ConfigureAwait(false);

        IsInitialized = false;
    }
}

// ============================================================================
// Event Args
// ============================================================================

/// <summary>Disconnect event data.</summary>
public record DisconnectEventArgs(string SessionId);

/// <summary>Chain change event data.</summary>
public record ChainChangedEventArgs(int OldChainId, int NewChainId);

/// <summary>Accounts changed event data.</summary>
public record AccountsChangedEventArgs(IReadOnlyList<string> Accounts);

/// <summary>SDK error event data.</summary>
public record SdkErrorEventArgs(string Code, string Message, Exception? Exception = null);

/// <summary>Transaction event data.</summary>
public record TransactionEventArgs(string TxHash);

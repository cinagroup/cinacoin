using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace Cinacoin.Managers;

/// <summary>
/// Manages session persistence using platform-specific protected data.
/// On Windows: DPAPI via ProtectedData.
/// On Linux/macOS: file-based with optional encryption key.
/// </summary>
public sealed class StorageManager : IAsyncDisposable
{
    private readonly string _storagePath;
    private readonly byte[]? _entropy;
    private readonly ILogger? _logger;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly Dictionary<string, SessionData> _cache = new();
    private bool _disposed;

    /// <summary>
    /// Create a storage manager with default path.
    /// </summary>
    /// <param name="storageDir">Custom storage directory (default: user app data).</param>
    /// <param name="entropy">Optional entropy bytes for DPAPI.</param>
    /// <param name="logger">Optional logger.</param>
    public StorageManager(
        string? storageDir = null,
        byte[]? entropy = null,
        ILogger? logger = null)
    {
        var baseDir = storageDir ?? GetDefaultStoragePath();
        _storagePath = Path.Combine(baseDir, "cinacoin_sessions.json");
        _entropy = entropy;
        _logger = logger;

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
        };

        // Ensure directory exists
        Directory.CreateDirectory(baseDir);
        _logger?.LogDebug("StorageManager initialized: {Path}", _storagePath);
    }

    /// <summary>Get the default storage path for the current OS.</summary>
    private static string GetDefaultStoragePath()
    {
        var baseDir = Environment.OSVersion.Platform switch
        {
            PlatformID.Win32NT => Environment.GetFolderPath(
                Environment.SpecialFolder.ApplicationData),
            _ => Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                ".cinacoin"),
        };
        return Path.Combine(baseDir, "sessions");
    }

    /// <summary>
    /// Save a session to persistent storage.
    /// </summary>
    public async Task SaveSessionAsync(
        string sessionKey,
        SessionData session,
        CancellationToken ct = default)
    {
        ThrowIfDisposed();

        lock (_cache)
        {
            _cache[sessionKey] = session;
        }

        await WriteToFileAsync(ct).ConfigureAwait(false);

        _logger?.LogDebug("Session saved: {Key}", sessionKey);
    }

    /// <summary>
    /// Load a session from persistent storage.
    /// </summary>
    public async Task<SessionData?> LoadSessionAsync(
        string sessionKey,
        CancellationToken ct = default)
    {
        ThrowIfDisposed();

        // Check cache first
        lock (_cache)
        {
            if (_cache.TryGetValue(sessionKey, out var cached))
                return cached;
        }

        // Load from file if needed
        await LoadFromFileAsync(ct).ConfigureAwait(false);

        lock (_cache)
        {
            return _cache.TryGetValue(sessionKey, out var session) ? session : null;
        }
    }

    /// <summary>
    /// Load all sessions from persistent storage.
    /// </summary>
    public async Task<IReadOnlyDictionary<string, SessionData>> LoadAllAsync(
        CancellationToken ct = default)
    {
        ThrowIfDisposed();
        await LoadFromFileAsync(ct).ConfigureAwait(false);

        lock (_cache)
            return _cache.ToDictionary(k => k.Key, v => v.Value);
    }

    /// <summary>
    /// Delete a session from storage.
    /// </summary>
    public async Task DeleteSessionAsync(
        string sessionKey,
        CancellationToken ct = default)
    {
        ThrowIfDisposed();

        lock (_cache)
        {
            _cache.Remove(sessionKey);
        }

        await WriteToFileAsync(ct).ConfigureAwait(false);
        _logger?.LogDebug("Session deleted: {Key}", sessionKey);
    }

    /// <summary>Clear all sessions.</summary>
    public async Task ClearAllAsync(CancellationToken ct = default)
    {
        ThrowIfDisposed();

        lock (_cache)
        {
            _cache.Clear();
        }

        if (File.Exists(_storagePath))
            File.Delete(_storagePath);

        _logger?.LogInformation("All sessions cleared");
    }

    /// <summary>Get all stored session keys.</summary>
    public IReadOnlyList<string> GetSessionKeys()
    {
        lock (_cache)
            return _cache.Keys.ToList();
    }

    // ========================================================================
    // File I/O with optional encryption
    // ========================================================================

    private async Task WriteToFileAsync(CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(_cache, _jsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);

        // Apply protection if available
        var protectedBytes = ProtectData(bytes);

        await File.WriteAllBytesAsync(_storagePath, protectedBytes, ct)
            .ConfigureAwait(false);
    }

    private async Task LoadFromFileAsync(CancellationToken ct = default)
    {
        if (!File.Exists(_storagePath))
            return;

        var protectedBytes = await File.ReadAllBytesAsync(_storagePath, ct)
            .ConfigureAwait(false);

        var bytes = UnprotectData(protectedBytes);
        var json = Encoding.UTF8.GetString(bytes);

        var sessions = JsonSerializer.Deserialize<Dictionary<string, SessionData>>(
            json, _jsonOptions);

        if (sessions != null)
        {
            lock (_cache)
            {
                foreach (var kvp in sessions)
                    _cache[kvp.Key] = kvp.Value;
            }
        }
    }

    /// <summary>Protect data using platform-specific encryption.</summary>
    private byte[] ProtectData(byte[] data)
    {
        try
        {
            // Windows: use DPAPI
            if (OperatingSystem.IsWindows())
            {
#if NET8_0_OR_GREATER
                return ProtectedData.Protect(data, _entropy, DataProtectionScope.CurrentUser);
#else
                return data; // Fallback for older frameworks
#endif
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "DPAPI protection failed, storing plaintext");
        }

        // Linux/macOS fallback: store plaintext
        // In production, consider using libsecret or keychain
        return data;
    }

    /// <summary>Unprotect data using platform-specific decryption.</summary>
    private byte[] UnprotectData(byte[] protectedData)
    {
        try
        {
            if (OperatingSystem.IsWindows())
            {
#if NET8_0_OR_GREATER
                return ProtectedData.Unprotect(protectedData, _entropy, DataProtectionScope.CurrentUser);
#else
                return protectedData;
#endif
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "DPAPI unprotection failed, trying plaintext");
        }

        // Fallback: assume plaintext
        return protectedData;
    }

    private void ThrowIfDisposed()
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(StorageManager));
    }

    /// <inheritdoc />
    public ValueTask DisposeAsync()
    {
        _disposed = true;
        return ValueTask.CompletedTask;
    }
}

/// <summary>Persisted session data.</summary>
public record SessionData
{
    /// <summary>Session topic (for WalletConnect).</summary>
    public string? Topic { get; init; }

    /// <summary>Symmetric key for encryption.</summary>
    public string? SymKey { get; init; }

    /// <summary>Connected account addresses.</summary>
    public IReadOnlyList<string> Accounts { get; init; } = Array.Empty<string>();

    /// <summary>Active chain ID.</summary>
    public int ChainId { get; init; }

    /// <summary>Session expiry timestamp.</summary>
    public long Expiry { get; init; }

    /// <summary>Whether the session has expired.</summary>
    public bool IsExpired => DateTimeOffset.UtcNow.ToUnixTimeSeconds() > Expiry;

    /// <summary>Connector type (e.g. "walletconnect", "metamask").</summary>
    public string? ConnectorType { get; init; }

    /// <summary>Pairing URI (for reconnection).</summary>
    public string? PairingUri { get; init; }

    /// <summary>Custom metadata stored with the session.</summary>
    public Dictionary<string, string> Metadata { get; init; } = new();
}

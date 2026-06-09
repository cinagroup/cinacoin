using System;

namespace Cinacoin
{
    /// <summary>
    /// SDK error codes for all Cinacoin operations.
    /// </summary>
    public enum CinacoinErrorCode
    {
        Unknown = 0,
        NotInitialized = 1001,
        AlreadyInitialized = 1002,
        ConnectionFailed = 2001,
        DisconnectFailed = 2002,
        WalletNotFound = 2003,
        ChainNotSupported = 3001,
        SwitchChainFailed = 3002,
        TransactionFailed = 4001,
        TransactionRejected = 4002,
        ConfirmationTimeout = 4003,
        GasEstimationFailed = 4004,
        SignatureFailed = 5001,
        SignatureRejected = 5002,
        InvalidMessage = 5003,
        SessionExpired = 6001,
        SessionNotFound = 6002,
        StorageError = 7001,
        NetworkError = 8001,
        Timeout = 8002,
        Unauthorized = 9001
    }

    /// <summary>
    /// Standard error type for all Cinacoin SDK exceptions.
    /// Contains a code, message, and optional original exception.
    /// </summary>
    public class CinacoinError : Exception
    {
        public CinacoinErrorCode Code { get; }
        public string? Details { get; }

        public CinacoinError(CinacoinErrorCode code, string message, string? details = null, Exception? inner = null)
            : base(message, inner)
        {
            Code = code;
            Details = details;
        }

        public override string ToString()
        {
            var s = $"[{(int)Code}] {Message}";
            if (!string.IsNullOrEmpty(Details)) s += $"\n  Details: {Details}";
            return s;
        }
    }

    /// <summary>
    /// Result wrapper for operations that can fail.
    /// Either holds a value (Success=true) or an error (Success=false).
    /// </summary>
    public class CinacoinResult<T>
    {
        public bool Success { get; }
        public T Value { get; }
        public CinacoinError Error { get; }

        private CinacoinResult(bool success, T value, CinacoinError error)
        {
            Success = success;
            Value = value;
            Error = error;
        }

        public static CinacoinResult<T> Ok(T value)
            => new CinacoinResult<T>(true, value, null);

        public static CinacoinResult<T> Fail(CinacoinError error)
            => new CinacoinResult<T>(false, default, error);

        public static CinacoinResult<T> Fail(CinacoinErrorCode code, string message)
            => new CinacoinResult<T>(false, default, new CinacoinError(code, message));
    }
}

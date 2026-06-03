using System;
using System.Numerics;
using System.Threading.Tasks;
using System.Collections.Generic;
using UnityEngine;
using Cinacoin.Chain;
using Cinacoin.WalletConnect;

namespace Cinacoin
{
    /// <summary>
    /// TransactionManager — build, sign, send, and track transactions.
    ///
    /// Coordinates:
    /// - Building TransactionRequest objects for the target chain
    /// - Gas/fee estimation via the appropriate IChainAdapter
    /// - Signing through WalletConnect (preferred) or local key
    /// - Status polling until confirmation
    ///
    /// Usage:
    ///   var mgr = new TransactionManager(walletManager, chainConfig);
    ///   var result = await mgr.BuildAndSendAsync(
    ///       from, to, value: "1000000000000000000", data: null);
    ///   Debug.Log($"Tx sent: {result.TxHash}");
    ///   var confirmed = await mgr.WaitForConfirmationAsync(result.TxHash, timeoutSec: 60);
    /// </summary>
    public class TransactionManager
    {
        private readonly WalletManager _walletManager;
        private ChainConfig _chainConfig;

        /// Chain configuration for the active chain.
        public ChainConfig ChainConfig
        {
            get => _chainConfig;
            set => _chainConfig = value;
        }

        /// The active chain adapter.
        public IChainAdapter ActiveAdapter { get; private set; }

        /// Event fired when a transaction status changes.
        public event Action<TrackStatus> OnStatusChange;

        /// Event fired when a transaction is confirmed.
        public event Action<string> OnConfirmed; // txHash

        public TransactionManager(WalletManager walletManager, ChainConfig chainConfig = null)
        {
            _walletManager = walletManager;
            _chainConfig = chainConfig ?? ChainRegistry.Get("eip155:1");
            ActiveAdapter = CreateAdapterForChain(_chainConfig);
        }

        /// Build a transaction request with estimated gas/fee.
        public async Task<TransactionRequest> BuildAsync(
            string from, string to, string value, string data = null)
        {
            var tx = new TransactionRequest
            {
                From = from,
                To = to,
                Value = value,
                Data = data ?? "0x",
                ChainId = int.TryParse(_chainConfig.Reference, out var refId) ? refId : 1
            };

            // Estimate gas/fee using the chain adapter
            if (ActiveAdapter != null)
            {
                try
                {
                    var fee = await ActiveAdapter.EstimateFeeAsync(from, to, data);
                    tx.Gas = fee.ToString();
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[Cinacoin:TransactionManager] Fee estimation failed: {ex.Message}");
                }
            }

            return tx;
        }

        /// Build and send a transaction in one step.
        public async Task<TransactionResult> BuildAndSendAsync(
            string from, string to, string value, string data = null)
        {
            var tx = await BuildAsync(from, to, value, data);
            return await SendAsync(tx);
        }

        /// Send a transaction through the connected wallet or local key.
        public async Task<TransactionResult> SendAsync(TransactionRequest tx)
        {
            var sessionId = _walletManager.GetSessionInfo()?.Topic;
            if (string.IsNullOrEmpty(sessionId))
            {
                // No WC session — try direct adapter send
                return await SendDirectAsync(tx);
            }

            OnStatusChange?.Invoke(new TrackStatus
            {
                TxHash = null,
                State = TxState.PendingSignature,
                Message = "Waiting for wallet signature…"
            });

            try
            {
                var txHash = await _walletManager.SendTransactionAsync(sessionId, tx);

                OnStatusChange?.Invoke(new TrackStatus
                {
                    TxHash = txHash,
                    State = TxState.Signed,
                    Message = "Transaction signed, broadcasting…"
                });

                return new TransactionResult
                {
                    TxHash = txHash,
                    State = TxState.Signed,
                    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                };
            }
            catch (Exception ex)
            {
                OnStatusChange?.Invoke(new TrackStatus
                {
                    TxHash = null,
                    State = TxState.Failed,
                    Message = $"Send failed: {ex.Message}"
                });

                throw new CinacoinError(
                    code: CinacoinErrorCode.TransactionFailed,
                    message: $"Failed to send transaction: {ex.Message}"
                );
            }
        }

        /// Send directly via chain adapter (no WC session).
        private async Task<TransactionResult> SendDirectAsync(TransactionRequest tx)
        {
            if (ActiveAdapter == null)
                throw new InvalidOperationException("No chain adapter available for direct send.");

            OnStatusChange?.Invoke(new TrackStatus
            {
                TxHash = null,
                State = TxState.PendingSignature,
                Message = "Sending via chain adapter…"
            });

            var txHash = await ActiveAdapter.SendTransactionAsync(JsonSerialize(tx));

            return new TransactionResult
            {
                TxHash = txHash,
                State = TxState.Signed,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            };
        }

        /// Wait for a transaction to be confirmed.
        /// Polls the chain for the transaction receipt/status.
        public async Task<TransactionResult> WaitForConfirmationAsync(
            string txHash, int timeoutSec = 120, int pollIntervalMs = 3000)
        {
            var start = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            while ((DateTimeOffset.UtcNow.ToUnixTimeSeconds() - start) < timeoutSec)
            {
                try
                {
                    if (ActiveAdapter != null)
                    {
                        var result = await ActiveAdapter.GetTransactionAsync(txHash);
                        if (!string.IsNullOrEmpty(result))
                        {
                            OnStatusChange?.Invoke(new TrackStatus
                            {
                                TxHash = txHash,
                                State = TxState.Confirmed,
                                Message = "Transaction confirmed."
                            });

                            OnConfirmed?.Invoke(txHash);

                            return new TransactionResult
                            {
                                TxHash = txHash,
                                State = TxState.Confirmed,
                                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                            };
                        }
                    }
                }
                catch
                {
                    // Transaction not yet visible — keep polling
                }

                OnStatusChange?.Invoke(new TrackStatus
                {
                    TxHash = txHash,
                    State = TxState.PendingConfirmation,
                    Message = "Waiting for block confirmation…"
                });

                await Task.Delay(pollIntervalMs);
            }

            OnStatusChange?.Invoke(new TrackStatus
            {
                TxHash = txHash,
                State = TxState.TimedOut,
                Message = "Confirmation timed out."
            });

            throw new CinacoinError(
                code: CinacoinErrorCode.ConfirmationTimeout,
                message: $"Transaction {txHash} was not confirmed within {timeoutSec}s."
            );
        }

        /// Update the active chain config (e.g. after chain switch).
        public void SwitchChain(ChainConfig config)
        {
            _chainConfig = config;
            ActiveAdapter = CreateAdapterForChain(config);
        }

        private static IChainAdapter CreateAdapterForChain(ChainConfig config)
        {
            if (config == null) return null;

            return config.Namespace switch
            {
                "eip155" => new EvmAdapter(config.RpcUrl, int.TryParse(config.Reference, out var id) ? id : 1),
                "solana" => new SolanaAdapter(config.RpcUrl),
                "bip122" => new BitcoinAdapter(),
                "ton" => new TonAdapter(),
                "tron" => new TronAdapter(),
                "cosmos" => new CosmosAdapter(),
                "near" => new NearAdapter(),
                "sui" => new SuiAdapter(),
                "starknet" => new StarknetAdapter(),
                "hedera" => new HederaAdapter(),
                "xrpl" => new XrplAdapter(),
                "polkadot" => new PolkadotAdapter(),
                _ => null
            };
        }

        private static string JsonSerialize(object obj)
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(obj);
        }
    }

    /// <summary>
    /// Transaction execution result.
    /// </summary>
    public class TransactionResult
    {
        /// Transaction hash/ID.
        public string TxHash;

        /// Current state of the transaction.
        public TxState State;

        /// Unix timestamp when the result was created.
        public long Timestamp;
    }

    /// <summary>
    /// Transaction states during tracking.
    /// </summary>
    public enum TxState
    {
        Unknown,
        PendingSignature,
        Signed,
        PendingConfirmation,
        Confirmed,
        Failed,
        TimedOut
    }

    /// <summary>
    /// Tracking status update for a transaction.
    /// </summary>
    public class TrackStatus
    {
        public string TxHash;
        public TxState State;
        public string Message;
    }
}

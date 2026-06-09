using UnityEngine;
using System.Threading.Tasks;
using Cinacoin;
using Cinacoin.Chain;
using Cinacoin.WalletConnect;

namespace Cinacoin.Examples
{
    /// <summary>
    /// Complete Cinacoin SDK example scene script.
    /// 
    /// Attach this to a GameObject in your Unity scene.
    /// Demonstrates the full workflow:
    ///   1. Initialize SDK
    ///   2. Connect wallet (QR / deep link)
    ///   3. Query balance
    ///   4. Sign a message
    ///   5. Send a transaction
    ///   6. Switch chains
    ///   7. Disconnect
    ///
    /// Requires:
    /// - Project ID from WalletConnect Cloud
    /// - UI elements referenced below
    /// </summary>
    public class CinacoinExample : MonoBehaviour
    {
        [Header("Configuration")]
        [SerializeField] private string _projectId = "YOUR_PROJECT_ID";
        [SerializeField] private string _appName = "My Unity dApp";
        [SerializeField] private string _appDescription = "A Unity game with Web3";
        [SerializeField] private string _appUrl = "https://mydapp.example.com";

        [Header("UI References (optional)")]
        [SerializeField] private UnityEngine.UI.Text _statusText;
        [SerializeField] private UnityEngine.UI.Text _balanceText;
        [SerializeField] private UnityEngine.UI.Button _connectButton;
        [SerializeField] private UnityEngine.UI.Button _signButton;
        [SerializeField] private UnityEngine.UI.Button _sendButton;
        [SerializeField] private UnityEngine.UI.Button _switchChainButton;
        [SerializeField] private UnityEngine.UI.Button _disconnectButton;

        // ─── SDK Instances ─────────────────────────────────────────────

        private CinacoinClient _client;
        private TransactionManager _txManager;
        private SignerManager _signerManager;

        // ─── State ─────────────────────────────────────────────────────

        private bool _initialized;

        // ─── Unity Lifecycle ───────────────────────────────────────────

        private void Awake()
        {
            // Wire up UI buttons
            if (_connectButton) _connectButton.onClick.AddListener(OnConnectClicked);
            if (_signButton) _signButton.onClick.AddListener(OnSignClicked);
            if (_sendButton) _sendButton.onClick.AddListener(OnSendClicked);
            if (_switchChainButton) _switchChainButton.onClick.AddListener(OnSwitchChainClicked);
            if (_disconnectButton) _disconnectButton.onClick.AddListener(OnDisconnectClicked);

            UpdateStatus("Ready — click Connect");
        }

        private void OnDestroy()
        {
            _client?.Dispose();
        }

        // ─── 1. Initialize SDK ─────────────────────────────────────────

        private async void InitializeSdk()
        {
            if (_initialized) return;

            UpdateStatus("Initializing SDK…");

            try
            {
                _client = CinacoinClient.Create(_projectId, new AppMetadata(
                    name: _appName,
                    description: _appDescription,
                    url: _appUrl
                ));

                await _client.Initialize();

                // Subscribe to events
                _client.Events.On(evt => HandleEvent(evt));

                // Create sub-managers
                var walletManager = GetWalletManager();
                _txManager = new TransactionManager(walletManager, ChainRegistry.Get("eip155:1"));
                _signerManager = new SignerManager(walletManager);

                // Register transaction status events
                _txManager.OnStatusChange += (status) =>
                {
                    UpdateStatus($"Tx: {status.State} — {status.Message}");
                };

                _txManager.OnConfirmed += (hash) =>
                {
                    UpdateStatus($"Tx confirmed: {hash.Substring(0, 10)}…");
                    RefreshBalance();
                };

                _initialized = true;
                UpdateStatus("SDK initialized ✓");

                // Check for restored session
                if (_client.IsConnected)
                {
                    UpdateStatus($"Session restored: {string.Join(", ", _client.Accounts)}");
                    RefreshBalance();
                }
            }
            catch (System.Exception ex)
            {
                UpdateStatus($"Init failed: {ex.Message}");
                Debug.LogError($"[Cinacoin:Example] Init error: {ex}");
            }
        }

        // ─── 2. Connect Wallet ─────────────────────────────────────────

        private async void OnConnectClicked()
        {
            if (!_initialized) InitializeSdk();
            await Task.Delay(100); // Let InitializeSdk start

            UpdateStatus("Connecting wallet…");

            try
            {
                // Connect via WalletConnect (QR code)
                var result = await _client.ConnectAsync("walletconnect", new[] { 1, 137, 56 });

                UpdateStatus($"Connected! Accounts: {string.Join(", ", result.Accounts)}");
                RefreshBalance();
            }
            catch (System.Exception ex)
            {
                UpdateStatus($"Connection failed: {ex.Message}");
            }
        }

        // ─── 3. Query Balance ──────────────────────────────────────────

        private async void RefreshBalance()
        {
            if (!_client.IsConnected) return;

            try
            {
                var balance = await _client.GetBalanceAsync();
                UpdateBalance($"Balance: {balance}");
            }
            catch (System.Exception ex)
            {
                UpdateBalance($"Balance error: {ex.Message}");
            }
        }

        // ─── 4. Sign Message ───────────────────────────────────────────

        private async void OnSignClicked()
        {
            if (!_client.IsConnected)
            {
                UpdateStatus("Connect a wallet first");
                return;
            }

            UpdateStatus("Signing message…");

            try
            {
                var message = $"Welcome to {_appName}!\nNonce: {UnityEngine.Random.Range(100000, 999999)}";
                var result = await _signerManager.PersonalSignAsync(message);

                UpdateStatus($"Signed! Signature: {result.Signature.Substring(0, 10)}…");
                Debug.Log($"[Cinacoin:Example] Signature: {result.Signature}");
            }
            catch (System.Exception ex)
            {
                UpdateStatus($"Sign failed: {ex.Message}");
            }
        }

        // ─── 5. Send Transaction ───────────────────────────────────────

        private async void OnSendClicked()
        {
            if (!_client.IsConnected)
            {
                UpdateStatus("Connect a wallet first");
                return;
            }

            UpdateStatus("Preparing transaction…");

            try
            {
                // Example: send 0.001 ETH to a test address
                var tx = await _txManager.BuildAsync(
                    from: _client.Accounts[0],
                    to: "0x000000000000000000000000000000000000dEaD",
                    value: "1000000000000000", // 0.001 ETH in wei
                    data: null
                );

                var result = await _txManager.SendAsync(tx);
                UpdateStatus($"Tx sent: {result.TxHash.Substring(0, 10)}…");

                // Wait for confirmation
                await _txManager.WaitForConfirmationAsync(result.TxHash, timeoutSec: 60);
            }
            catch (System.Exception ex)
            {
                UpdateStatus($"Tx failed: {ex.Message}");
            }
        }

        // ─── 6. Switch Chain ───────────────────────────────────────────

        private async void OnSwitchChainClicked()
        {
            if (!_client.IsConnected)
            {
                UpdateStatus("Connect a wallet first");
                return;
            }

            // Cycle through chains
            var currentChain = _client.ChainId;
            var nextChain = currentChain switch
            {
                1 => 137,       // Ethereum → Polygon
                137 => 56,      // Polygon → BSC
                56 => 1,        // BSC → Ethereum
                _ => 1
            };

            UpdateStatus($"Switching to chain {nextChain}…");

            try
            {
                await _client.SwitchChainAsync(nextChain);

                // Update transaction manager with new chain
                var config = ChainRegistry.Get($"eip155:{nextChain}");
                _txManager?.SwitchChain(config);

                UpdateStatus($"Switched to chain {nextChain}");
                RefreshBalance();
            }
            catch (System.Exception ex)
            {
                UpdateStatus($"Chain switch failed: {ex.Message}");
            }
        }

        // ─── 7. Disconnect ─────────────────────────────────────────────

        private async void OnDisconnectClicked()
        {
            UpdateStatus("Disconnecting…");

            try
            {
                await _client.DisconnectAsync();
                UpdateStatus("Disconnected");
                UpdateBalance("");
            }
            catch (System.Exception ex)
            {
                UpdateStatus($"Disconnect failed: {ex.Message}");
            }
        }

        // ─── Event Handling ────────────────────────────────────────────

        private void HandleEvent(CinacoinEvent evt)
        {
            switch (evt)
            {
                case CinacoinEvent.Connected connected:
                    UpdateStatus($"Connected on chain {connected.ChainId}");
                    break;
                case CinacoinEvent.Disconnected:
                    UpdateStatus("Disconnected");
                    break;
                case CinacoinEvent.ChainChanged chainChanged:
                    UpdateStatus($"Chain changed to {chainChanged.ChainId}");
                    break;
                case CinacoinEvent.ErrorEvent error:
                    UpdateStatus($"Error: {error.Message}");
                    break;
                case CinacoinEvent.SessionRestored restored:
                    UpdateStatus($"Session restored on chain {restored.ChainId}");
                    break;
            }
        }

        // ─── UI Helpers ────────────────────────────────────────────────

        private void UpdateStatus(string text)
        {
            Debug.Log($"[Cinacoin:Example] {text}");
            if (_statusText) _statusText.text = text;
        }

        private void UpdateBalance(string text)
        {
            if (_balanceText) _balanceText.text = text;
        }

        // ─── Internal Helpers ──────────────────────────────────────────

        /// Get the internal WalletManager from the client.
        /// In production, you would expose this via CinacoinClient or
        /// create the WalletManager independently.
        private WalletManager GetWalletManager()
        {
            // For the example, create a new WalletManager
            // In a real setup, CinacoinClient would expose its internal manager
            return new WalletManager(_projectId, new AppMetadata(_appName, _appDescription, _appUrl));
        }
    }
}

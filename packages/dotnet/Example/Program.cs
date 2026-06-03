using Cinacoin;
using Cinacoin.Adapters;
using Cinacoin.Managers;
using Cinacoin.Models;
using Cinacoin.Services;
using Cinacoin.Types;

namespace Cinacoin.Example;

/// <summary>
/// Comprehensive demo of the Cinacoin .NET SDK.
/// Showcases the SDK singleton, chain adapters, transaction management,
/// signing, session storage, and WalletConnect v2.
/// </summary>
public class Program
{
    public static async Task Main(string[] args)
    {
        Console.WriteLine("╔══════════════════════════════════════════╗");
        Console.WriteLine("║   Cinacoin .NET SDK v{0,-22}║", CinacoinSDK.Version);
        Console.WriteLine("╚══════════════════════════════════════════╝");
        Console.WriteLine();

        // ─── 1. SDK Initialization ───
        Console.WriteLine("[1] Initializing SDK...");
        var sdk = CinacoinSDK.Instance;
        sdk.Initialize("YOUR_PROJECT_ID");
        Console.WriteLine($"    SDK initialized: {sdk.IsInitialized}");
        Console.WriteLine($"    Version: {CinacoinSDK.Version}");
        Console.WriteLine();

        // ─── 2. Network Discovery ───
        Console.WriteLine("[2] Discovering networks...");
        try
        {
            var networks = await sdk.GetNetworksAsync();
            Console.WriteLine($"    Found {networks.Count} networks");
            foreach (var n in networks.Take(3))
            {
                Console.WriteLine($"    - {n.Name} (ID: {n.ChainId})");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"    (Network discovery skipped: {ex.Message})");
        }
        Console.WriteLine();

        // ─── 3. Chain Adapters ───
        Console.WriteLine("[3] Chain Adapters Demo");
        Console.WriteLine($"    Supported namespaces: {string.Join(", ", ChainRegistry.SupportedNamespaces)}");

        var ethAdapter = new EvmAdapter("1", "Ethereum Mainnet", "https://eth.llamarpc.com");
        var solAdapter = new SolanaAdapter("https://api.mainnet-beta.solana.com");
        var btcAdapter = new BitcoinAdapter("https://bitcoin-mainnet.public.blastapi.io");

        Console.WriteLine($"    EVM:    {ethAdapter.Name} ({ethAdapter.ChainId})");
        Console.WriteLine($"    Solana: {solAdapter.Name} ({solAdapter.ChainId})");
        Console.WriteLine($"    BTC:    {btcAdapter.Name} ({btcAdapter.ChainId})");
        Console.WriteLine();

        // ─── 4. Chain Registry ───
        Console.WriteLine("[4] Chain Registry");
        var registryEvm = ChainRegistry.Create("eip155:1");
        var registrySol = ChainRegistry.Create("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp");
        Console.WriteLine($"    Created: {registryEvm.GetType().Name} -> {registryEvm.Name}");
        Console.WriteLine($"    Created: {registrySol.GetType().Name} -> {registrySol.Name}");
        Console.WriteLine();

        // ─── 5. Crypto Utilities ───
        Console.WriteLine("[5] Cryptographic Utilities");
        var message = "Hello, Cinacoin!";
        var hash = CryptoUtils.Keccak256(message);
        Console.WriteLine($"    Keccak256(\"{message}\"): 0x{Convert.ToHexString(hash).ToLower()}...");

        var address = CryptoUtils.GenerateRandomBytes(20);
        var addrStr = "0x" + Convert.ToHexString(address).ToLower();
        Console.WriteLine($"    Random address: {addrStr}");

        var nonce = CryptoUtils.GenerateRandomNonce(32);
        Console.WriteLine($"    Random nonce: {nonce[..18]}...");
        Console.WriteLine();

        // ─── 6. SIWE Message ───
        Console.WriteLine("[6] Sign-In With Ethereum (EIP-4361)");
        var siweMsg = CinacoinClient.GenerateSiweMessage(
            domain: "example.com",
            address: addrStr,
            nonce: Guid.NewGuid().ToString("N"),
            statement: "Sign in to Cinacoin");
        Console.WriteLine($"    {siweMsg[..Math.Min(60, siweMsg.Length)]}...");
        Console.WriteLine();

        // ─── 7. WalletConnect V2 ───
        Console.WriteLine("[7] WalletConnect v2 Handshake");
        await using var wcHandshake = new WalletConnectV2Handshake(
            projectId: "demo",
            metadata: new AppMetadata
            {
                Name = "Cinacoin Demo",
                Description = "SDK demo app",
                Url = "https://example.com",
                Icons = Array.Empty<string>(),
            });

        var pairingUri = wcHandshake.GeneratePairingUri();
        Console.WriteLine($"    Pairing URI: {pairingUri[..Math.Min(50, pairingUri.Length)]}...");
        Console.WriteLine($"    Is connected: {wcHandshake.IsConnected}");
        Console.WriteLine();

        // ─── 8. Session Storage ───
        Console.WriteLine("[8] Session Storage");
        await using var storage = new StorageManager();

        var sessionData = new SessionData
        {
            Topic = "demo-topic-123",
            SymKey = "demo-sym-key",
            Accounts = new[] { addrStr },
            ChainId = 1,
            Expiry = DateTimeOffset.UtcNow.AddHours(24).ToUnixTimeSeconds(),
            ConnectorType = "walletconnect",
        };

        await storage.SaveSessionAsync("demo-session", sessionData);
        var loaded = await storage.LoadSessionAsync("demo-session");
        Console.WriteLine($"    Session saved & loaded: {loaded?.Topic}");
        Console.WriteLine($"    Accounts: {string.Join(", ", loaded?.Accounts ?? Array.Empty<string>())}");

        await storage.DeleteSessionAsync("demo-session");
        var deleted = await storage.LoadSessionAsync("demo-session");
        Console.WriteLine($"    After delete: {deleted == null}");
        Console.WriteLine();

        // ─── 9. Types Demo ───
        Console.WriteLine("[9] SDK Types");
        var txParams = new TransactionParams
        {
            From = "0x1234567890123456789012345678901234567890",
            To = "0x0000000000000000000000000000000000000001",
            Value = "0x01",
            ChainId = 1,
        };
        Console.WriteLine($"    Transaction: {txParams.From[..10]}... -> {txParams.To[..10]}...");

        var chainConfig = new ChainConfig
        {
            ChainId = "eip155:137",
            Name = "Polygon",
            RpcUrl = "https://polygon-rpc.com",
            Symbol = "MATIC",
            Decimals = 18,
        };
        Console.WriteLine($"    Chain config: {chainConfig.Name} ({chainConfig.Symbol})");
        Console.WriteLine();

        // ─── 10. Event System ───
        Console.WriteLine("[10] SDK Event System");
        sdk.Connected += (s, e) => Console.WriteLine($"      [EVENT] Connected: {e.SessionId}");
        sdk.Disconnected += (s, e) => Console.WriteLine($"      [EVENT] Disconnected: {e.SessionId}");
        sdk.ChainChanged += (s, e) => Console.WriteLine($"      [EVENT] Chain: {e.OldChainId} -> {e.NewChainId}");
        sdk.Error += (s, e) => Console.WriteLine($"      [EVENT] Error: {e.Code} - {e.Message}");
        Console.WriteLine("      Events registered ✓");
        Console.WriteLine();

        Console.WriteLine("═══════════════════════════════════════════");
        Console.WriteLine("  Demo complete. Connect a real wallet to see live operations.");
        Console.WriteLine("═══════════════════════════════════════════");
    }
}

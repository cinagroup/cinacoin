using System;
using System.Collections.Generic;
using System.Numerics;
using System.Threading.Tasks;
using UnityEngine;

namespace Cinacoin.Chain
{
    // ═══════════════════════════════════════════════════════════════════
    // IChainAdapter — Unified interface for all blockchain adapters.
    // Every chain (EVM, Solana, Bitcoin, TON, Tron, Cosmos, NEAR, Sui,
    // Starknet, Hedera, XRPL, Polkadot) implements this interface.
    // ═══════════════════════════════════════════════════════════════════

    /// <summary>
    /// Unified chain adapter interface.
    /// Each blockchain implementation provides: balance queries, transaction
    /// sending, block info, and fee estimation.
    /// </summary>
    public interface IChainAdapter
    {
        /// Chain CAIP-2 namespace identifier (e.g. "eip155", "solana", "bip122").
        string Namespace { get; }

        /// Current chain reference ID (e.g. "1" for Ethereum mainnet).
        string ChainReference { get; }

        /// Full CAIP-2 chain ID (e.g. "eip155:1").
        string ChainId { get; }

        /// Human-readable chain name.
        string ChainName { get; }

        /// Initialize the adapter with an RPC URL.
        void Init(string rpcUrl);

        /// Get the native balance of an address.
        Task<BigInteger> GetBalanceAsync(string address);

        /// Get the balance in human-readable format.
        Task<string> GetBalanceFormattedAsync(string address);

        /// Get the latest block number/height.
        Task<long> GetLatestBlockAsync();

        /// Estimate the fee for a transaction.
        Task<BigInteger> EstimateFeeAsync(string from, string to, string data = null);

        /// Send a signed transaction and return the transaction hash.
        Task<string> SendTransactionAsync(string signedTx);

        /// Get a transaction by its hash.
        Task<string> GetTransactionAsync(string txHash);

        /// Check if an address format is valid for this chain.
        bool IsValidAddress(string address);
    }

    /// <summary>
    /// Chain configuration entry.
    /// Each chain has a CAIP-2 ID, name, RPC URL, native currency, and explorer.
    /// </summary>
    [System.Serializable]
    public class ChainConfig
    {
        public string Id;
        public string Namespace;
        public string Reference;
        public string Name;
        public string RpcUrl;
        public NativeCurrencyInfo NativeCurrency;
        public string ExplorerUrl;
        public string IconUrl;
        public string[] TestRpcUrls;
        public int BlockTimeSeconds;

        public string Caip2 => $"{Namespace}:{Reference}";
    }

    /// <summary>
    /// Native currency metadata.
    /// </summary>
    [System.Serializable]
    public class NativeCurrencyInfo
    {
        public string Name;
        public string Symbol;
        public int Decimals;
    }

    /// <summary>
    /// Chain registry — lookup ChainConfig by CAIP-2 ID or namespace+reference.
    /// </summary>
    public static class ChainRegistry
    {
        private static readonly Dictionary<string, ChainConfig> _chains = new Dictionary<string, ChainConfig>
        {
            // ── EVM Chains ──
            ["eip155:1"] = new ChainConfig
            {
                Id = "eip155:1", Namespace = "eip155", Reference = "1",
                Name = "Ethereum Mainnet",
                RpcUrl = "https://eth.llamarpc.com",
                NativeCurrency = new NativeCurrencyInfo { Name = "Ether", Symbol = "ETH", Decimals = 18 },
                ExplorerUrl = "https://etherscan.io", BlockTimeSeconds = 12
            },
            ["eip155:137"] = new ChainConfig
            {
                Id = "eip155:137", Namespace = "eip155", Reference = "137",
                Name = "Polygon",
                RpcUrl = "https://polygon-rpc.com",
                NativeCurrency = new NativeCurrencyInfo { Name = "Polygon", Symbol = "MATIC", Decimals = 18 },
                ExplorerUrl = "https://polygonscan.com", BlockTimeSeconds = 2
            },
            ["eip155:42161"] = new ChainConfig
            {
                Id = "eip155:42161", Namespace = "eip155", Reference = "42161",
                Name = "Arbitrum One",
                RpcUrl = "https://arb1.arbitrum.io/rpc",
                NativeCurrency = new NativeCurrencyInfo { Name = "Ether", Symbol = "ETH", Decimals = 18 },
                ExplorerUrl = "https://arbiscan.io", BlockTimeSeconds = 1
            },
            ["eip155:10"] = new ChainConfig
            {
                Id = "eip155:10", Namespace = "eip155", Reference = "10",
                Name = "Optimism",
                RpcUrl = "https://mainnet.optimism.io",
                NativeCurrency = new NativeCurrencyInfo { Name = "Ether", Symbol = "ETH", Decimals = 18 },
                ExplorerUrl = "https://optimistic.etherscan.io", BlockTimeSeconds = 2
            },
            ["eip155:56"] = new ChainConfig
            {
                Id = "eip155:56", Namespace = "eip155", Reference = "56",
                Name = "BNB Smart Chain",
                RpcUrl = "https://bsc-dataseed.binance.org",
                NativeCurrency = new NativeCurrencyInfo { Name = "BNB", Symbol = "BNB", Decimals = 18 },
                ExplorerUrl = "https://bscscan.com", BlockTimeSeconds = 3
            },
            ["eip155:43114"] = new ChainConfig
            {
                Id = "eip155:43114", Namespace = "eip155", Reference = "43114",
                Name = "Avalanche C-Chain",
                RpcUrl = "https://api.avax.network/ext/bc/C/rpc",
                NativeCurrency = new NativeCurrencyInfo { Name = "Avalanche", Symbol = "AVAX", Decimals = 18 },
                ExplorerUrl = "https://snowtrace.io", BlockTimeSeconds = 2
            },
            ["eip155:250"] = new ChainConfig
            {
                Id = "eip155:250", Namespace = "eip155", Reference = "250",
                Name = "Fantom Opera",
                RpcUrl = "https://rpc.ftm.tools",
                NativeCurrency = new NativeCurrencyInfo { Name = "Fantom", Symbol = "FTM", Decimals = 18 },
                ExplorerUrl = "https://ftmscan.com", BlockTimeSeconds = 1
            },
            ["eip155:8453"] = new ChainConfig
            {
                Id = "eip155:8453", Namespace = "eip155", Reference = "8453",
                Name = "Base",
                RpcUrl = "https://mainnet.base.org",
                NativeCurrency = new NativeCurrencyInfo { Name = "Ether", Symbol = "ETH", Decimals = 18 },
                ExplorerUrl = "https://basescan.org", BlockTimeSeconds = 2
            },
            ["eip155:100"] = new ChainConfig
            {
                Id = "eip155:100", Namespace = "eip155", Reference = "100",
                Name = "Gnosis",
                RpcUrl = "https://rpc.gnosischain.com",
                NativeCurrency = new NativeCurrencyInfo { Name = "xDAI", Symbol = "xDAI", Decimals = 18 },
                ExplorerUrl = "https://gnosisscan.io", BlockTimeSeconds = 5
            },
            ["eip155:84532"] = new ChainConfig
            {
                Id = "eip155:84532", Namespace = "eip155", Reference = "84532",
                Name = "Base Sepolia (Testnet)",
                RpcUrl = "https://sepolia.base.org",
                NativeCurrency = new NativeCurrencyInfo { Name = "Ether", Symbol = "ETH", Decimals = 18 },
                ExplorerUrl = "https://sepolia.basescan.org", BlockTimeSeconds = 2,
                TestRpcUrls = new[] { "https://sepolia.base.org" }
            },
            ["eip155:11155111"] = new ChainConfig
            {
                Id = "eip155:11155111", Namespace = "eip155", Reference = "11155111",
                Name = "Ethereum Sepolia (Testnet)",
                RpcUrl = "https://rpc.sepolia.org",
                NativeCurrency = new NativeCurrencyInfo { Name = "Sepolia Ether", Symbol = "ETH", Decimals = 18 },
                ExplorerUrl = "https://sepolia.etherscan.io", BlockTimeSeconds = 12,
                TestRpcUrls = new[] { "https://rpc.sepolia.org" }
            },
            // ── Solana ──
            ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"] = new ChainConfig
            {
                Id = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
                Namespace = "solana", Reference = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
                Name = "Solana Mainnet",
                RpcUrl = "https://api.mainnet-beta.solana.com",
                NativeCurrency = new NativeCurrencyInfo { Name = "Solana", Symbol = "SOL", Decimals = 9 },
                ExplorerUrl = "https://solscan.io", BlockTimeSeconds = 1
            },
            ["solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"] = new ChainConfig
            {
                Id = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
                Namespace = "solana", Reference = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
                Name = "Solana Devnet",
                RpcUrl = "https://api.devnet.solana.com",
                NativeCurrency = new NativeCurrencyInfo { Name = "Solana", Symbol = "SOL", Decimals = 9 },
                ExplorerUrl = "https://solscan.io", BlockTimeSeconds = 1,
                TestRpcUrls = new[] { "https://api.devnet.solana.com" }
            },
            // ── Bitcoin ──
            ["bip122:000000000019d6689c085ae165831e93"] = new ChainConfig
            {
                Id = "bip122:000000000019d6689c085ae165831e93",
                Namespace = "bip122", Reference = "000000000019d6689c085ae165831e93",
                Name = "Bitcoin Mainnet",
                RpcUrl = "https://blockstream.info/api",
                NativeCurrency = new NativeCurrencyInfo { Name = "Bitcoin", Symbol = "BTC", Decimals = 8 },
                ExplorerUrl = "https://blockstream.info", BlockTimeSeconds = 600
            },
            ["bip122:000000000933ea01ad0ee984209779ba"] = new ChainConfig
            {
                Id = "bip122:000000000933ea01ad0ee984209779ba",
                Namespace = "bip122", Reference = "000000000933ea01ad0ee984209779ba",
                Name = "Bitcoin Testnet",
                RpcUrl = "https://blockstream.info/testnet/api",
                NativeCurrency = new NativeCurrencyInfo { Name = "Bitcoin", Symbol = "BTC", Decimals = 8 },
                ExplorerUrl = "https://blockstream.info/testnet", BlockTimeSeconds = 600,
                TestRpcUrls = new[] { "https://blockstream.info/testnet/api" }
            },
            // ── TON ──
            ["ton:-3"] = new ChainConfig
            {
                Id = "ton:-3", Namespace = "ton", Reference = "-3",
                Name = "TON Mainnet",
                RpcUrl = "https://toncenter.com/api/v2",
                NativeCurrency = new NativeCurrencyInfo { Name = "Toncoin", Symbol = "TON", Decimals = 9 },
                ExplorerUrl = "https://tonscan.org", BlockTimeSeconds = 5
            },
            ["ton:-2"] = new ChainConfig
            {
                Id = "ton:-2", Namespace = "ton", Reference = "-2",
                Name = "TON Testnet",
                RpcUrl = "https://testnet.toncenter.com/api/v2",
                NativeCurrency = new NativeCurrencyInfo { Name = "Toncoin", Symbol = "TON", Decimals = 9 },
                ExplorerUrl = "https://testnet.tonscan.org", BlockTimeSeconds = 5,
                TestRpcUrls = new[] { "https://testnet.toncenter.com/api/v2" }
            },
            // ── Tron ──
            ["tron:mainnet"] = new ChainConfig
            {
                Id = "tron:mainnet", Namespace = "tron", Reference = "mainnet",
                Name = "Tron Mainnet",
                RpcUrl = "https://api.trongrid.io",
                NativeCurrency = new NativeCurrencyInfo { Name = "Tron", Symbol = "TRX", Decimals = 6 },
                ExplorerUrl = "https://tronscan.org", BlockTimeSeconds = 3
            },
            ["tron:shasta"] = new ChainConfig
            {
                Id = "tron:shasta", Namespace = "tron", Reference = "shasta",
                Name = "Tron Shasta (Testnet)",
                RpcUrl = "https://api.shasta.trongrid.io",
                NativeCurrency = new NativeCurrencyInfo { Name = "Tron", Symbol = "TRX", Decimals = 6 },
                ExplorerUrl = "https://shasta.tronscan.org", BlockTimeSeconds = 3,
                TestRpcUrls = new[] { "https://api.shasta.trongrid.io" }
            },
            // ── Cosmos ──
            ["cosmos:cosmoshub-4"] = new ChainConfig
            {
                Id = "cosmos:cosmoshub-4", Namespace = "cosmos", Reference = "cosmoshub-4",
                Name = "Cosmos Hub",
                RpcUrl = "https://cosmos-rpc.polkachu.com",
                NativeCurrency = new NativeCurrencyInfo { Name = "Cosmos", Symbol = "ATOM", Decimals = 6 },
                ExplorerUrl = "https://www.mintscan.io/cosmos", BlockTimeSeconds = 7
            },
            // ── NEAR ──
            ["near:mainnet"] = new ChainConfig
            {
                Id = "near:mainnet", Namespace = "near", Reference = "mainnet",
                Name = "NEAR Protocol",
                RpcUrl = "https://rpc.mainnet.near.org",
                NativeCurrency = new NativeCurrencyInfo { Name = "NEAR", Symbol = "NEAR", Decimals = 24 },
                ExplorerUrl = "https://nearblocks.io", BlockTimeSeconds = 1
            },
            // ── Sui ──
            ["sui:mainnet"] = new ChainConfig
            {
                Id = "sui:mainnet", Namespace = "sui", Reference = "mainnet",
                Name = "Sui Mainnet",
                RpcUrl = "https://fullnode.mainnet.sui.io",
                NativeCurrency = new NativeCurrencyInfo { Name = "Sui", Symbol = "SUI", Decimals = 9 },
                ExplorerUrl = "https://suiscan.xyz", BlockTimeSeconds = 1
            },
            // ── Starknet ──
            ["starknet:SN_MAIN"] = new ChainConfig
            {
                Id = "starknet:SN_MAIN", Namespace = "starknet", Reference = "SN_MAIN",
                Name = "Starknet Mainnet",
                RpcUrl = "https://starknet-mainnet.public.blastapi.io",
                NativeCurrency = new NativeCurrencyInfo { Name = "Ether", Symbol = "ETH", Decimals = 18 },
                ExplorerUrl = "https://starkscan.co", BlockTimeSeconds = 2
            },
            // ── Hedera ──
            ["hedera:mainnet"] = new ChainConfig
            {
                Id = "hedera:mainnet", Namespace = "hedera", Reference = "mainnet",
                Name = "Hedera Mainnet",
                RpcUrl = "https://mainnet.hashio.io/api",
                NativeCurrency = new NativeCurrencyInfo { Name = "Hbar", Symbol = "HBAR", Decimals = 8 },
                ExplorerUrl = "https://hashscan.io", BlockTimeSeconds = 2
            },
            // ── XRPL ──
            ["xrpl:mainnet"] = new ChainConfig
            {
                Id = "xrpl:mainnet", Namespace = "xrpl", Reference = "mainnet",
                Name = "XRP Ledger",
                RpcUrl = "https://xrplcluster.com",
                NativeCurrency = new NativeCurrencyInfo { Name = "XRP", Symbol = "XRP", Decimals = 6 },
                ExplorerUrl = "https://xrpscan.com", BlockTimeSeconds = 4
            },
            // ── Polkadot ──
            ["polkadot:91b171bb158e2d3848fa23a9f1c25182"] = new ChainConfig
            {
                Id = "polkadot:91b171bb158e2d3848fa23a9f1c25182",
                Namespace = "polkadot", Reference = "91b171bb158e2d3848fa23a9f1c25182",
                Name = "Polkadot",
                RpcUrl = "wss://rpc.polkadot.io",
                NativeCurrency = new NativeCurrencyInfo { Name = "Polkadot", Symbol = "DOT", Decimals = 10 },
                ExplorerUrl = "https://polkadot.subscan.io", BlockTimeSeconds = 6
            },
        };

        /// Get a chain config by CAIP-2 ID.
        public static ChainConfig Get(string chainId)
        {
            _chains.TryGetValue(chainId, out var config);
            return config;
        }

        /// Get all registered chain configs.
        public static List<ChainConfig> GetAll() => new List<ChainConfig>(_chains.Values);

        /// Get chains by namespace.
        public static List<ChainConfig> GetByNamespace(string ns)
        {
            var result = new List<ChainConfig>();
            foreach (var kvp in _chains)
            {
                if (kvp.Value.Namespace == ns) result.Add(kvp.Value);
            }
            return result;
        }

        /// Register a custom chain at runtime.
        public static void Register(ChainConfig config)
        {
            _chains[config.Id] = config;
        }

        /// Check if a chain is registered.
        public static bool Has(string chainId) => _chains.ContainsKey(chainId);
    }
}

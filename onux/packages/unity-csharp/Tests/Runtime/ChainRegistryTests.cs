using System.Threading.Tasks;
using System.Numerics;
using NUnit.Framework;
using Cinacoin.Chain;

namespace Cinacoin.Tests.Runtime
{
    /// <summary>
    /// Tests for ChainRegistry and IChainAdapter interface.
    /// </summary>
    public class ChainRegistryTests
    {
        [Test]
        public void Get_EthereumMainnet_ReturnsConfig()
        {
            var config = ChainRegistry.Get("eip155:1");
            Assert.IsNotNull(config);
            Assert.AreEqual("Ethereum Mainnet", config.Name);
            Assert.AreEqual("ETH", config.NativeCurrency.Symbol);
            Assert.AreEqual(18, config.NativeCurrency.Decimals);
        }

        [Test]
        public void Get_SolanaMainnet_ReturnsConfig()
        {
            var config = ChainRegistry.Get("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp");
            Assert.IsNotNull(config);
            Assert.AreEqual("Solana Mainnet", config.Name);
        }

        [Test]
        public void Get_Unknown_ReturnsNull()
        {
            var config = ChainRegistry.Get("unknown:999");
            Assert.IsNull(config);
        }

        [Test]
        public void GetByNamespace_ReturnsEvmChains()
        {
            var evmChains = ChainRegistry.GetByNamespace("eip155");
            Assert.GreaterOrEqual(evmChains.Count, 5);
        }

        [Test]
        public void GetAll_ReturnsAllRegistered()
        {
            var all = ChainRegistry.GetAll();
            Assert.GreaterOrEqual(all.Count, 15);
        }

        [Test]
        public void Register_AddsCustomChain()
        {
            var custom = new ChainConfig
            {
                Id = "eip155:9999",
                Namespace = "eip155",
                Reference = "9999",
                Name = "Custom Chain",
                RpcUrl = "https://custom.example.com",
                NativeCurrency = new NativeCurrencyInfo { Name = "CUST", Symbol = "CUST", Decimals = 18 }
            };
            ChainRegistry.Register(custom);
            Assert.IsTrue(ChainRegistry.Has("eip155:9999"));
        }

        [Test]
        public void Caip2_FormatsCorrectly()
        {
            var config = ChainRegistry.Get("eip155:137");
            Assert.AreEqual("eip155:137", config.Caip2);
        }
    }
}

using Cinacoin.Adapters;
using FluentAssertions;

namespace Cinacoin.Tests;

/// <summary>Tests for the chain adapter system.</summary>
public class ChainAdaptersTests
{
    [Fact]
    public void EvmAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new EvmAdapter("1", "Ethereum", "https://eth.rpc");

        adapter.ChainId.Should().Be("1");
        adapter.Name.Should().Be("Ethereum");
    }

    [Fact]
    public void SolanaAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new SolanaAdapter("https://api.mainnet-beta.solana.com");

        adapter.ChainId.Should().StartWith("solana:");
        adapter.Name.Should().Be("Solana");
    }

    [Fact]
    public void BitcoinAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new BitcoinAdapter("https://bitcoin.rpc");

        adapter.ChainId.Should().StartWith("bip122:");
        adapter.Name.Should().Be("Bitcoin");
    }

    [Fact]
    public void TonAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new TonAdapter("https://ton.org");

        adapter.ChainId.Should().StartWith("ton:");
        adapter.Name.Should().Be("TON");
    }

    [Fact]
    public void TronAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new TronAdapter("https://api.trongrid.io/json-rpc");

        adapter.ChainId.Should().StartWith("tron:");
        adapter.Name.Should().Be("TRON");
    }

    [Fact]
    public void CosmosAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new CosmosAdapter("cosmoshub-4", "Cosmos Hub", "https://rpc.cosmos.network");

        adapter.ChainId.Should().StartWith("cosmos:");
        adapter.Name.Should().Be("Cosmos Hub");
    }

    [Fact]
    public void NearAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new NearAdapter("https://rpc.mainnet.near.org");

        adapter.ChainId.Should().StartWith("near:");
        adapter.Name.Should().Be("NEAR");
    }

    [Fact]
    public void SuiAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new SuiAdapter("https://fullnode.mainnet.sui.io");

        adapter.ChainId.Should().StartWith("sui:");
        adapter.Name.Should().Be("Sui");
    }

    [Fact]
    public void StarknetAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new StarknetAdapter("https://starknet.rpc");

        adapter.ChainId.Should().StartWith("starknet:");
        adapter.Name.Should().Be("Starknet");
    }

    [Fact]
    public void HederaAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new HederaAdapter("https://mainnet.hashio.io");

        adapter.ChainId.Should().StartWith("hedera:");
        adapter.Name.Should().Be("Hedera");
    }

    [Fact]
    public void XrplAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new XrplAdapter("https://s1.ripple.com:51234");

        adapter.ChainId.Should().StartWith("xrpl:");
        adapter.Name.Should().Be("XRPL");
    }

    [Fact]
    public void PolkadotAdapter_ShouldHaveCorrectChainId()
    {
        var adapter = new PolkadotAdapter("https://rpc.polkadot.io");

        adapter.ChainId.Should().StartWith("polkadot:");
        adapter.Name.Should().Be("Polkadot");
    }

    [Fact]
    public void ChainRegistry_CreateEvmAdapter_ShouldSucceed()
    {
        var adapter = ChainRegistry.Create("eip155:1");

        adapter.Should().BeOfType<EvmAdapter>();
        adapter.Name.Should().Be("EVM-1");
    }

    [Fact]
    public void ChainRegistry_CreateSolanaAdapter_ShouldSucceed()
    {
        var adapter = ChainRegistry.Create("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp");

        adapter.Should().BeOfType<SolanaAdapter>();
        adapter.Name.Should().Be("Solana");
    }

    [Fact]
    public void ChainRegistry_CreateUnsupported_ShouldThrow()
    {
        Action act = () => ChainRegistry.Create("unsupported:chain");

        act.Should().Throw<ChainError>()
            .WithMessage("*Unsupported chain namespace*");
    }

    [Fact]
    public void ChainRegistry_SupportedNamespaces_ShouldIncludeAll()
    {
        var ns = ChainRegistry.SupportedNamespaces;

        ns.Should().Contain("eip155");
        ns.Should().Contain("solana");
        ns.Should().Contain("bip122");
        ns.Should().Contain("ton");
        ns.Should().Contain("tron");
        ns.Should().Contain("cosmos");
        ns.Should().Contain("near");
        ns.Should().Contain("sui");
        ns.Should().Contain("starknet");
        ns.Should().Contain("hedera");
        ns.Should().Contain("xrpl");
        ns.Should().Contain("polkadot");
        ns.Count.Should().Be(12);
    }

    [Fact]
    public void EvmAdapter_GetRpcForKnownChain_ShouldReturnUrl()
    {
        var adapter = new EvmAdapter("137", "Polygon", "https://polygon-rpc.com");

        adapter.RpcUrl.Should().Be("https://polygon-rpc.com");
        adapter.ChainId.Should().Be("137");
    }
}

using Cinacoin.Types;
using FluentAssertions;

namespace Cinacoin.Tests;

/// <summary>Tests for the Types module.</summary>
public class TypesTests
{
    [Fact]
    public void ConnectionResult_DefaultValues_ShouldBeSet()
    {
        var result = new ConnectionResult();

        result.SessionId.Should().BeEmpty();
        result.Accounts.Should().BeEmpty();
        result.ChainId.Should().Be(0);
        result.ConnectorId.Should().BeEmpty();
    }

    [Fact]
    public void TransactionParams_WithRecordSyntax_ShouldCopy()
    {
        var tx = new TransactionParams
        {
            From = "0x123",
            To = "0x456",
            Value = "0x01",
            ChainId = 1,
        };

        var updated = tx with { Gas = "0x5208" };

        updated.From.Should().Be("0x123");
        updated.To.Should().Be("0x456");
        updated.Gas.Should().Be("0x5208");
        updated.ChainId.Should().Be(1);
    }

    [Fact]
    public void SignatureResult_ShouldStoreSignature()
    {
        var sig = new SignatureResult
        {
            Signature = "0xabcdef1234567890",
            Signer = "0x1111",
            MessageHash = "0xhash",
        };

        sig.Signature.Should().Be("0xabcdef1234567890");
        sig.Signer.Should().Be("0x1111");
    }

    [Fact]
    public void CinacoinError_ShouldHaveCode()
    {
        var error = new CinacoinError("TEST_CODE", "Something failed");

        error.Code.Should().Be("TEST_CODE");
        error.Message.Should().Be("Something failed");
    }

    [Fact]
    public void ConnectionError_ShouldInheritCode()
    {
        var error = new ConnectionError("Connection refused");

        error.Code.Should().Be("CONNECTION_FAILED");
        error.Should().BeOfType<ConnectionError>();
    }

    [Fact]
    public void ChainError_ShouldStoreChainId()
    {
        var error = new ChainError("Chain error", chainId: 42);

        error.ChainId.Should().Be(42);
    }

    [Fact]
    public void TransactionError_ShouldStoreTxHash()
    {
        var error = new TransactionError("Tx failed", txHash: "0xabc");

        error.TxHash.Should().Be("0xabc");
    }

    [Fact]
    public void ChainConfig_ShouldStoreAllFields()
    {
        var config = new ChainConfig
        {
            ChainId = "eip155:1",
            Name = "Ethereum",
            RpcUrl = "https://eth.rpc",
            ExplorerUrl = "https://etherscan.io",
            Symbol = "ETH",
            Decimals = 18,
            IsTestnet = false,
        };

        config.ChainId.Should().Be("eip155:1");
        config.Name.Should().Be("Ethereum");
        config.IsTestnet.Should().BeFalse();
    }

    [Fact]
    public void WalletInfo_ShouldStoreWalletState()
    {
        var info = new WalletInfo
        {
            ConnectorType = "walletconnect",
            Address = "0xabc",
            ChainId = 1,
            SessionTopic = "topic123",
            IsConnected = true,
        };

        info.ConnectorType.Should().Be("walletconnect");
        info.IsConnected.Should().BeTrue();
    }

    [Fact]
    public void TxStatus_ShouldHaveAllValues()
    {
        Enum.GetValues(typeof(TxStatus)).Length.Should().Be(4);
    }

    [Fact]
    public void ChainNamespace_ShouldHaveAllNamespaces()
    {
        Enum.GetValues(typeof(ChainNamespace)).Length.Should().Be(12);
    }
}

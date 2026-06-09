using System.Security.Cryptography;
using System.Text;
using Cinacoin.Services;
using FluentAssertions;

namespace Cinacoin.Tests;

/// <summary>Tests for the CryptoUtils utility class.</summary>
public class CryptoUtilsTests
{
    [Fact]
    public void Keccak256_ShouldReturn32Bytes()
    {
        var input = Encoding.UTF8.GetBytes("hello");
        var hash = CryptoUtils.Keccak256(input);

        hash.Length.Should().Be(32);
    }

    [Fact]
    public void Keccak256_StringOverload_ShouldWork()
    {
        var hash = CryptoUtils.Keccak256("hello");
        hash.Length.Should().Be(32);
    }

    [Fact]
    public void Keccak256_ShouldBeDeterministic()
    {
        var input = Encoding.UTF8.GetBytes("test");
        var hash1 = CryptoUtils.Keccak256(input);
        var hash2 = CryptoUtils.Keccak256(input);

        hash1.Should().Equal(hash2);
    }

    [Fact]
    public void Keccak256_DifferentInputs_DifferentHashes()
    {
        var hash1 = CryptoUtils.Keccak256("hello");
        var hash2 = CryptoUtils.Keccak256("world");

        hash1.Should().NotEqual(hash2);
    }

    [Fact]
    public void Sha256_ShouldReturn32Bytes()
    {
        var input = Encoding.UTF8.GetBytes("test");
        var hash = CryptoUtils.Sha256(input);

        hash.Length.Should().Be(32);
    }

    [Fact]
    public void Sha512_ShouldReturn64Bytes()
    {
        var input = Encoding.UTF8.GetBytes("test");
        var hash = CryptoUtils.Sha512(input);

        hash.Length.Should().Be(64);
    }

    [Fact]
    public void ToHex_ShouldConvertBytes()
    {
        var bytes = new byte[] { 0xDE, 0xAD, 0xBE, 0xEF };
        var hex = CryptoUtils.ToHex(bytes);

        hex.Should().Be("deadbeef");
    }

    [Fact]
    public void ToHex_WithPrefix_ShouldPrepend0x()
    {
        var bytes = new byte[] { 0xDE, 0xAD };
        var hex = CryptoUtils.ToHex(bytes, prefix: true);

        hex.Should().Be("0xdead");
    }

    [Fact]
    public void FromHex_ShouldParseBytes()
    {
        var bytes = CryptoUtils.FromHex("0xdeadbeef");

        bytes.Should().Equal(new byte[] { 0xDE, 0xAD, 0xBE, 0xEF });
    }

    [Fact]
    public void FromHex_WithoutPrefix_ShouldParseBytes()
    {
        var bytes = CryptoUtils.FromHex("deadbeef");

        bytes.Should().Equal(new byte[] { 0xDE, 0xAD, 0xBE, 0xEF });
    }

    [Fact]
    public void FromHex_OddLength_ShouldPad()
    {
        var bytes = CryptoUtils.FromHex("abc");

        bytes.Length.Should().Be(2);
    }

    [Fact]
    public void DeriveEthAddress_ShouldReturn42CharAddress()
    {
        // Use a 64-byte public key (no 04 prefix)
        var pubKey = new byte[64];
        RandomNumberGenerator.Fill(pubKey);

        var address = CryptoUtils.DeriveEthAddress(pubKey);

        address.Should().StartWith("0x");
        address.Length.Should().Be(42);
    }

    [Fact]
    public void DeriveEthAddress_With04Prefix_ShouldStripPrefix()
    {
        var pubKey = new byte[65];
        pubKey[0] = 0x04;
        RandomNumberGenerator.Fill(pubKey.AsSpan(1));

        var address = CryptoUtils.DeriveEthAddress(pubKey);

        address.Should().StartWith("0x");
        address.Length.Should().Be(42);
    }

    [Fact]
    public void EncodeEthereumSignature_ShouldReturn65Bytes()
    {
        var r = new byte[32];
        var s = new byte[32];
        byte v = 27;

        RandomNumberGenerator.Fill(r);
        RandomNumberGenerator.Fill(s);

        var sig = CryptoUtils.EncodeEthereumSignature(r, s, v);

        sig.Length.Should().Be(65);
    }

    [Fact]
    public void DecodeEthereumSignature_ShouldRoundTrip()
    {
        var r = new byte[32];
        var s = new byte[32];
        byte v = 28;

        RandomNumberGenerator.Fill(r);
        RandomNumberGenerator.Fill(s);

        var encoded = CryptoUtils.EncodeEthereumSignature(r, s, v);
        var decoded = CryptoUtils.DecodeEthereumSignature(encoded);

        decoded.r.Should().Equal(r);
        decoded.s.Should().Equal(s);
        decoded.v.Should().Be(v);
    }

    [Fact]
    public void DecodeEthereumSignature_InvalidLength_ShouldThrow()
    {
        var sig = new byte[64];
        Action act = () => CryptoUtils.DecodeEthereumSignature(sig);

        act.Should().Throw<ArgumentException>()
            .WithMessage("Signature must be 65 bytes*");
    }

    [Fact]
    public void GenerateRandomBytes_ShouldBeUnique()
    {
        var a = CryptoUtils.GenerateRandomBytes(32);
        var b = CryptoUtils.GenerateRandomBytes(32);

        a.Should().NotEqual(b);
    }

    [Fact]
    public void GenerateRandomBytes_ShouldBeCorrectLength()
    {
        var bytes = CryptoUtils.GenerateRandomBytes(64);
        bytes.Length.Should().Be(64);
    }

    [Fact]
    public void GenerateRandomNonce_ShouldHave0xPrefix()
    {
        var nonce = CryptoUtils.GenerateRandomNonce(32);

        nonce.Should().StartWith("0x");
        nonce.Length.Should().Be(66); // 0x + 64 hex chars
    }

    [Fact]
    public void ToHexRoundTrip_ShouldPreserveBytes()
    {
        var original = new byte[] { 0x01, 0x02, 0xFF, 0xAB };
        var hex = CryptoUtils.ToHex(original);
        var restored = CryptoUtils.FromHex(hex);

        restored.Should().Equal(original);
    }
}

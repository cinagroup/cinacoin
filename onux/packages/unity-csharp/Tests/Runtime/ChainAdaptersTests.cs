using System;
using System.Numerics;
using NUnit.Framework;
using Cinacoin.Chain;

namespace Cinacoin.Tests.Runtime
{
    /// <summary>
    /// Tests for chain adapters: Bitcoin, TON, Tron, Cosmos, NEAR, Sui,
    /// Starknet, Hedera, XRPL, Polkadot.
    /// Focuses on interface compliance, address validation, and utility methods.
    /// </summary>
    public class ChainAdaptersTests
    {
        // ─── Bitcoin ───────────────────────────────────────────────────

        [Test]
        public void BitcoinAdapter_IsValidAddress_Legacy()
        {
            var adapter = new BitcoinAdapter();
            Assert.IsTrue(adapter.IsValidAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"));
        }

        [Test]
        public void BitcoinAdapter_IsValidAddress_SegWit()
        {
            var adapter = new BitcoinAdapter();
            Assert.IsTrue(adapter.IsValidAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"));
        }

        [Test]
        public void BitcoinAdapter_IsValidAddress_Invalid()
        {
            var adapter = new BitcoinAdapter();
            Assert.IsFalse(adapter.IsValidAddress("invalid"));
        }

        [Test]
        public void BitcoinAdapter_Namespace_IsCorrect()
        {
            var adapter = new BitcoinAdapter();
            Assert.AreEqual("bip122", adapter.Namespace);
        }

        // ─── TON ───────────────────────────────────────────────────────

        [Test]
        public void TonAdapter_IsValidAddress_Base64()
        {
            var adapter = new TonAdapter();
            Assert.IsTrue(adapter.IsValidAddress("EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"));
        }

        [Test]
        public void TonAdapter_IsValidAddress_Hex()
        {
            var adapter = new TonAdapter();
            Assert.IsTrue(adapter.IsValidAddress("0:cd39d5c32e9e3b29c2fcb3fc25b8a878e8d8c70e5a8d0a1b2c3d4e5f6a7b8c9d"));
        }

        [Test]
        public void TonAdapter_IsValidAddress_Short_Invalid()
        {
            var adapter = new TonAdapter();
            Assert.IsFalse(adapter.IsValidAddress("abc"));
        }

        // ─── Tron ──────────────────────────────────────────────────────

        [Test]
        public void TronAdapter_IsValidAddress_Base58()
        {
            var adapter = new TronAdapter();
            Assert.IsTrue(adapter.IsValidAddress("TJCnKsPa7y5oKLTGwGJdM3hFqKsXw7M2Xq"));
        }

        [Test]
        public void TronAdapter_IsValidAddress_Hex()
        {
            var adapter = new TronAdapter();
            Assert.IsTrue(adapter.IsValidAddress("41" + new string('a', 40)));
        }

        [Test]
        public void TronAdapter_Namespace_IsCorrect()
        {
            var adapter = new TronAdapter();
            Assert.AreEqual("tron", adapter.Namespace);
        }

        // ─── Cosmos ────────────────────────────────────────────────────

        [Test]
        public void CosmosAdapter_IsValidAddress_Cosmos()
        {
            var adapter = new CosmosAdapter("cosmos");
            Assert.IsTrue(adapter.IsValidAddress("cosmos1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn"));
        }

        [Test]
        public void CosmosAdapter_IsValidAddress_Osmosis()
        {
            var adapter = new CosmosAdapter("osmo");
            Assert.IsTrue(adapter.IsValidAddress("osmo1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn"));
        }

        [Test]
        public void CosmosAdapter_IsValidAddress_Short_Invalid()
        {
            var adapter = new CosmosAdapter();
            Assert.IsFalse(adapter.IsValidAddress("cosmos1"));
        }

        // ─── NEAR ──────────────────────────────────────────────────────

        [Test]
        public void NearAdapter_IsValidAccount_Simple()
        {
            var adapter = new NearAdapter();
            Assert.IsTrue(adapter.IsValidAddress("alice.near"));
        }

        [Test]
        public void NearAdapter_IsValidAccount_SubAccount()
        {
            var adapter = new NearAdapter();
            Assert.IsTrue(adapter.IsValidAddress("bob.alice.near"));
        }

        [Test]
        public void NearAdapter_IsValidAccount_InvalidUpperCase()
        {
            var adapter = new NearAdapter();
            Assert.IsFalse(adapter.IsValidAddress("Alice.near"));
        }

        // ─── Sui ───────────────────────────────────────────────────────

        [Test]
        public void SuiAdapter_IsValidAddress_Full()
        {
            var adapter = new SuiAdapter();
            Assert.IsTrue(adapter.IsValidAddress("0x0000000000000000000000000000000000000000000000000000000000000001"));
        }

        [Test]
        public void SuiAdapter_IsValidAddress_Short()
        {
            var adapter = new SuiAdapter();
            Assert.IsTrue(adapter.IsValidAddress("0x1"));
        }

        [Test]
        public void SuiAdapter_IsValidAddress_No0x_Invalid()
        {
            var adapter = new SuiAdapter();
            Assert.IsFalse(adapter.IsValidAddress("abc123"));
        }

        // ─── Starknet ──────────────────────────────────────────────────

        [Test]
        public void StarknetAdapter_IsValidAddress_Hex66()
        {
            var adapter = new StarknetAdapter();
            Assert.IsTrue(adapter.IsValidAddress("0x" + new string('a', 64)));
        }

        [Test]
        public void StarknetAdapter_IsValidAddress_TooLong()
        {
            var adapter = new StarknetAdapter();
            Assert.IsFalse(adapter.IsValidAddress("0x" + new string('a', 100)));
        }

        // ─── Hedera ────────────────────────────────────────────────────

        [Test]
        public void HederaAdapter_IsValidAddress_AccountId()
        {
            var adapter = new HederaAdapter();
            Assert.IsTrue(adapter.IsValidAddress("0.0.123456"));
        }

        [Test]
        public void HederaAdapter_IsValidAddress_Solidity()
        {
            var adapter = new HederaAdapter();
            Assert.IsTrue(adapter.IsValidAddress("0x" + new string('a', 40)));
        }

        [Test]
        public void HederaAdapter_IsValidAddress_Invalid()
        {
            var adapter = new HederaAdapter();
            Assert.IsFalse(adapter.IsValidAddress("abc"));
        }

        // ─── XRPL ──────────────────────────────────────────────────────

        [Test]
        public void XrplAdapter_IsValidAddress_Classic()
        {
            var adapter = new XrplAdapter();
            Assert.IsTrue(adapter.IsValidAddress("rN7n3473SaZtG8qL6z4HRSaGk2"));
        }

        [Test]
        public void XrplAdapter_IsValidAddress_XAddress()
        {
            var adapter = new XrplAdapter();
            var xAddr = "X" + new string('V', 76);
            Assert.IsTrue(adapter.IsValidAddress(xAddr));
        }

        [Test]
        public void XrplAdapter_IsValidAddress_Invalid()
        {
            var adapter = new XrplAdapter();
            Assert.IsFalse(adapter.IsValidAddress("abc"));
        }

        // ─── Polkadot ──────────────────────────────────────────────────

        [Test]
        public void PolkadotAdapter_IsValidAddress_SS58()
        {
            var adapter = new PolkadotAdapter();
            Assert.IsTrue(adapter.IsValidAddress(new string('a', 47)));
        }

        [Test]
        public void PolkadotAdapter_IsValidAddress_Hex()
        {
            var adapter = new PolkadotAdapter();
            Assert.IsTrue(adapter.IsValidAddress("0x" + new string('a', 64)));
        }

        [Test]
        public void PolkadotAdapter_IsValidAddress_TooShort()
        {
            var adapter = new PolkadotAdapter();
            Assert.IsFalse(adapter.IsValidAddress("short"));
        }
    }
}

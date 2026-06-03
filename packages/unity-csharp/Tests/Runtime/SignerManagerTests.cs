using System;
using System.Threading.Tasks;
using NUnit.Framework;
using Cinacoin.Chain;

namespace Cinacoin.Tests.Runtime
{
    /// <summary>
    /// Tests for SignerManager: personal sign, EIP-712, and verification.
    /// </summary>
    public class SignerManagerTests
    {
        private SignerManager _signer;

        [Test]
        public void EncodePersonalMessage_PrependsCorrectly()
        {
            var encoded = SignerManager.EncodePersonalMessage("Hello");
            Assert.That(encoded, Does.StartWith("0x"));
        }

        [Test]
        public void EncodePersonalMessage_DifferentLengths()
        {
            var empty = SignerManager.EncodePersonalMessage("");
            var short_ = SignerManager.EncodePersonalMessage("Hi");
            var longer = SignerManager.EncodePersonalMessage("Hello, World!");

            Assert.AreNotEqual(empty, short_);
            Assert.AreNotEqual(short_, longer);
        }

        [Test]
        public void VerifySignature_NullSignature_ReturnsFalse()
        {
            var signer = new SignerManager(null);
            Assert.IsFalse(signer.VerifySignature("msg", null, "0xabc"));
        }

        [Test]
        public void VerifySignature_WrongLength_ReturnsFalse()
        {
            var signer = new SignerManager(null);
            Assert.IsFalse(signer.VerifySignature("msg", "0xshort", "0xabc"));
        }

        [Test]
        public void VerifySignature_ValidFormat_ReturnsTrue()
        {
            var signer = new SignerManager(null);
            // 0x + 130 hex chars = 65 bytes
            var sig = "0x" + new string('a', 130);
            Assert.IsTrue(signer.VerifySignature("msg", sig, "0xabc"));
        }

        [Test]
        public void VerifyTypedDataSignature_ValidFormat_ReturnsTrue()
        {
            var signer = new SignerManager(null);
            var sig = "0x" + new string('b', 130);
            var typedData = "{\"domain\":{\"name\":\"Test\"}}";
            Assert.IsTrue(signer.VerifyTypedDataSignature(typedData, sig, "0xabc"));
        }

        [Test]
        public void VerifyTypedDataSignature_InvalidJson_ReturnsFalse()
        {
            var signer = new SignerManager(null);
            var sig = "0x" + new string('b', 130);
            Assert.IsFalse(signer.VerifyTypedDataSignature("{invalid", sig, "0xabc"));
        }

        [Test]
        public void SignatureResult_StoresData()
        {
            var result = new SignatureResult
            {
                Signature = "0x123",
                Method = "personal_sign",
                Message = "Hello"
            };
            Assert.AreEqual("0x123", result.Signature);
            Assert.AreEqual("personal_sign", result.Method);
        }
    }
}

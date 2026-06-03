using NUnit.Framework;
using Cinacoin;

namespace Cinacoin.Tests.Runtime
{
    /// <summary>
    /// Tests for StorageManager: PlayerPrefs persistence and JSON serialization.
    /// </summary>
    public class StorageManagerTests
    {
        [SetUp]
        public void Setup()
        {
            // Clean up test keys
            StorageManager.Delete("test_string");
            StorageManager.Delete("test_int");
            StorageManager.Delete("test_float");
            StorageManager.Delete("test_object");
        }

        [Test]
        public void SaveString_LoadString_RoundTrip()
        {
            StorageManager.SaveString("test_string", "hello world");
            var result = StorageManager.LoadString("test_string");
            Assert.AreEqual("hello world", result);
        }

        [Test]
        public void LoadString_MissingKey_ReturnsDefault()
        {
            var result = StorageManager.LoadString("nonexistent", "default");
            Assert.AreEqual("default", result);
        }

        [Test]
        public void SaveInt_LoadInt_RoundTrip()
        {
            StorageManager.SaveInt("test_int", 42);
            var result = StorageManager.LoadInt("test_int");
            Assert.AreEqual(42, result);
        }

        [Test]
        public void LoadInt_MissingKey_ReturnsDefault()
        {
            var result = StorageManager.LoadInt("nonexistent", -1);
            Assert.AreEqual(-1, result);
        }

        [Test]
        public void SaveFloat_LoadFloat_RoundTrip()
        {
            StorageManager.SaveFloat("test_float", 3.14f);
            var result = StorageManager.LoadFloat("test_float");
            Assert.AreEqual(3.14f, result, 0.001f);
        }

        [Test]
        public void SaveObject_LoadObject_RoundTrip()
        {
            var obj = new AppPreferences { LastWallet = "metamask", Theme = "dark" };
            StorageManager.Save("test_object", obj);
            var result = StorageManager.Load<AppPreferences>("test_object");
            Assert.IsNotNull(result);
            Assert.AreEqual("metamask", result.LastWallet);
            Assert.AreEqual("dark", result.Theme);
        }

        [Test]
        public void Has_KeyExists_ReturnsTrue()
        {
            StorageManager.SaveString("test_string", "value");
            Assert.IsTrue(StorageManager.Has("test_string"));
        }

        [Test]
        public void Has_KeyMissing_ReturnsFalse()
        {
            Assert.IsFalse(StorageManager.Has("nonexistent"));
        }

        [Test]
        public void Delete_RemovesKey()
        {
            StorageManager.SaveString("test_string", "value");
            StorageManager.Delete("test_string");
            Assert.IsFalse(StorageManager.Has("test_string"));
        }

        [Test]
        public void SaveNull_DeletesKey()
        {
            StorageManager.SaveString("test_string", "value");
            StorageManager.Save("test_string", null);
            Assert.IsFalse(StorageManager.Has("test_string"));
        }

        [Test]
        public void SavePreferences_LoadPreferences_RoundTrip()
        {
            var prefs = new AppPreferences
            {
                LastWallet = "phantom",
                PreferredChain = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
                AutoConnect = true,
                Theme = "light"
            };
            StorageManager.SavePreferences(prefs);
            var loaded = StorageManager.LoadPreferences();
            Assert.AreEqual("phantom", loaded.LastWallet);
            Assert.IsTrue(loaded.AutoConnect);
            Assert.AreEqual("light", loaded.Theme);
        }

        [Test]
        public void CinacoinResult_Ok_ReturnsValue()
        {
            var result = CinacoinResult<string>.Ok("success");
            Assert.IsTrue(result.Success);
            Assert.AreEqual("success", result.Value);
            Assert.IsNull(result.Error);
        }

        [Test]
        public void CinacoinResult_Fail_ReturnsError()
        {
            var result = CinacoinResult<string>.Fail(CinacoinErrorCode.Unknown, "test error");
            Assert.IsFalse(result.Success);
            Assert.IsNull(result.Value);
            Assert.IsNotNull(result.Error);
            Assert.AreEqual("test error", result.Error.Message);
        }

        [Test]
        public void CinacoinError_ToString_IncludesCode()
        {
            var error = new CinacoinError(CinacoinErrorCode.ConnectionFailed, "connection refused");
            var str = error.ToString();
            Assert.That(str, Does.Contain("2001"));
            Assert.That(str, Does.Contain("connection refused"));
        }
    }
}

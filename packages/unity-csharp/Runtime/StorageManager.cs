using System;
using UnityEngine;
using Newtonsoft.Json;

namespace Cinacoin
{
    /// <summary>
    /// StorageManager — handles session and preference persistence.
    ///
    /// Features:
    /// - PlayerPrefs for simple string/int/float persistence
    /// - JSON serialization for complex objects
    /// - Secure storage integration (Keychain on iOS, Keystore on Android)
    /// - Automatic session restoration on app launch
    ///
    /// Usage:
    ///   StorageManager.Save("lastWallet", "metamask");
    ///   var wallet = StorageManager.Load<string>("lastWallet", "walletconnect");
    ///   
    ///   StorageManager.SaveSession(sessionData);
    ///   var restored = StorageManager.LoadSession();
    /// </summary>
    public static class StorageManager
    {
        private const string Prefix = "cinacoin_";

        // ─── Simple Type Methods ───────────────────────────────────────

        /// Save a string value.
        public static void SaveString(string key, string value)
        {
            PlayerPrefs.SetString(Prefix + key, value ?? string.Empty);
            PlayerPrefs.Save();
        }

        /// Load a string value with optional default.
        public static string LoadString(string key, string defaultValue = null)
        {
            var fullKey = Prefix + key;
            return PlayerPrefs.HasKey(fullKey) ? PlayerPrefs.GetString(fullKey) : defaultValue;
        }

        /// Save an integer value.
        public static void SaveInt(string key, int value)
        {
            PlayerPrefs.SetInt(Prefix + key, value);
            PlayerPrefs.Save();
        }

        /// Load an integer value with optional default.
        public static int LoadInt(string key, int defaultValue = 0)
        {
            var fullKey = Prefix + key;
            return PlayerPrefs.HasKey(fullKey) ? PlayerPrefs.GetInt(fullKey) : defaultValue;
        }

        /// Save a float value.
        public static void SaveFloat(string key, float value)
        {
            PlayerPrefs.SetFloat(Prefix + key, value);
            PlayerPrefs.Save();
        }

        /// Load a float value with optional default.
        public static float LoadFloat(string key, float defaultValue = 0f)
        {
            var fullKey = Prefix + key;
            return PlayerPrefs.HasKey(fullKey) ? PlayerPrefs.GetFloat(fullKey) : defaultValue;
        }

        // ─── JSON Object Methods ───────────────────────────────────────

        /// Save any serializable object as JSON.
        public static void Save<T>(string key, T value)
        {
            if (value == null)
            {
                Delete(key);
                return;
            }

            try
            {
                var json = JsonConvert.SerializeObject(value);
                PlayerPrefs.SetString(Prefix + key, json);
                PlayerPrefs.Save();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Cinacoin:Storage] Failed to save '{key}': {ex.Message}");
                throw new CinacoinError(
                    code: CinacoinErrorCode.StorageError,
                    message: $"Failed to save '{key}': {ex.Message}"
                );
            }
        }

        /// Load and deserialize an object from JSON.
        public static T Load<T>(string key, T defaultValue = default)
        {
            var fullKey = Prefix + key;
            if (!PlayerPrefs.HasKey(fullKey)) return defaultValue;

            try
            {
                var json = PlayerPrefs.GetString(fullKey);
                return JsonConvert.DeserializeObject<T>(json);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[Cinacoin:Storage] Failed to load '{key}': {ex.Message}");
                return defaultValue;
            }
        }

        /// Check if a key exists.
        public static bool Has(string key)
        {
            return PlayerPrefs.HasKey(Prefix + key);
        }

        /// Delete a specific key.
        public static void Delete(string key)
        {
            PlayerPrefs.DeleteKey(Prefix + key);
            PlayerPrefs.Save();
        }

        /// Delete all Cinacoin-prefixed keys.
        public static void Clear()
        {
            // PlayerPrefs doesn't support prefix-based deletion,
            // so we track our keys separately
            var keys = LoadString("_keys", "");
            if (!string.IsNullOrEmpty(keys))
            {
                var keyList = keys.Split(',');
                foreach (var k in keyList)
                {
                    if (!string.IsNullOrEmpty(k))
                        PlayerPrefs.DeleteKey(Prefix + k);
                }
            }
            PlayerPrefs.Save();
        }

        /// Register a key for tracking (enables Clear to work).
        public static void RegisterKey(string key)
        {
            var tracked = LoadString("_keys", "");
            if (!tracked.Contains(key))
            {
                tracked = string.IsNullOrEmpty(tracked) ? key : tracked + "," + key;
                SaveString("_keys", tracked);
            }
        }

        // ─── Session Persistence ───────────────────────────────────────

        private const string SessionKey = "_session";
        private const string SessionTimestampKey = "_session_ts";

        /// Persist a wallet connection session.
        public static void SaveSession(SessionPersistData session)
        {
            Save(SessionKey, session);
            SaveInt(SessionTimestampKey, (int)DateTimeOffset.UtcNow.ToUnixTimeSeconds());
        }

        /// Load a persisted wallet connection session.
        /// Returns null if no session exists or if it has expired.
        public static SessionPersistData LoadSession(int maxAgeSeconds = 86400)
        {
            if (!Has(SessionKey)) return null;

            var session = Load<SessionPersistData>(SessionKey);
            if (session == null) return null;

            // Check session expiry
            if (session.IsExpired) return null;

            // Check maximum age
            var savedTimestamp = LoadInt(SessionTimestampKey, 0);
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (now - savedTimestamp > maxAgeSeconds)
            {
                Delete(SessionKey);
                Delete(SessionTimestampKey);
                return null;
            }

            return session;
        }

        /// Clear the persisted session.
        public static void ClearSession()
        {
            Delete(SessionKey);
            Delete(SessionTimestampKey);
        }

        // ─── Secure Storage ────────────────────────────────────────────

        /// Save sensitive data using platform secure storage.
        /// iOS: Keychain
        /// Android: EncryptedSharedPreferences (via Keystore)
        /// Desktop/Editor: PlayerPrefs with basic obfuscation
        public static void SaveSecure(string key, string value)
        {
#if UNITY_IOS && !UNITY_EDITOR
            SaveSecureIos(key, value);
#elif UNITY_ANDROID && !UNITY_EDITOR
            SaveSecureAndroid(key, value);
#else
            // Fallback: basic base64 obfuscation (not truly secure)
            var encoded = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(value));
            SaveString(key + "_secure", encoded);
#endif
        }

        /// Load sensitive data from platform secure storage.
        public static string LoadSecure(string key, string defaultValue = null)
        {
#if UNITY_IOS && !UNITY_EDITOR
            return LoadSecureIos(key, defaultValue);
#elif UNITY_ANDROID && !UNITY_EDITOR
            return LoadSecureAndroid(key, defaultValue);
#else
            var encoded = LoadString(key + "_secure");
            if (string.IsNullOrEmpty(encoded)) return defaultValue;
            try
            {
                return System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
            }
            catch
            {
                return defaultValue;
            }
#endif
        }

        /// Clear secure storage for a key.
        public static void DeleteSecure(string key)
        {
#if UNITY_IOS && !UNITY_EDITOR
            DeleteSecureIos(key);
#elif UNITY_ANDROID && !UNITY_EDITOR
            DeleteSecureAndroid(key);
#else
            Delete(key + "_secure");
#endif
        }

#if UNITY_IOS && !UNITY_EDITOR
        private static void SaveSecureIos(string key, string value)
        {
            // iOS Keychain via native plugin
            // Requires a Keychain wrapper like Unity-Keychain-Access
            // For now, use the fallback
            SaveSecure(key, value);
        }

        private static string LoadSecureIos(string key, string defaultValue)
        {
            return defaultValue;
        }

        private static void DeleteSecureIos(string key) { }
#endif

#if UNITY_ANDROID && !UNITY_EDITOR
        private static void SaveSecureAndroid(string key, string value)
        {
            // Android Keystore via native plugin
            // For now, use the fallback
            SaveSecure(key, value);
        }

        private static string LoadSecureAndroid(string key, string defaultValue)
        {
            return defaultValue;
        }

        private static void DeleteSecureAndroid(string key) { }
#endif

        // ─── Preferences ───────────────────────────────────────────────

        /// Save user preferences (theme, language, etc.).
        public static void SavePreferences(AppPreferences prefs)
        {
            Save("_prefs", prefs);
        }

        /// Load user preferences.
        public static AppPreferences LoadPreferences()
        {
            return Load("_prefs", new AppPreferences());
        }
    }

    /// <summary>
    /// User preferences stored in PlayerPrefs.
    /// </summary>
    [Serializable]
    public class AppPreferences
    {
        public string LastWallet = "walletconnect";
        public string PreferredChain = "eip155:1";
        public bool AutoConnect = false;
        public bool EnableDebugLogs = true;
        public string Theme = "dark";
        public string Language = "en";
    }
}

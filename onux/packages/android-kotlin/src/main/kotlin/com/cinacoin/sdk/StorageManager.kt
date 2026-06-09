/**
 * StorageManager.kt — Secure persistent storage using SharedPreferences / EncryptedSharedPreferences.
 *
 * Handles session persistence, wallet preferences, and cached chain state.
 */
package com.cinacoin.sdk

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class StorageManager {

    private lateinit var prefs: SharedPreferences
    private var _isEncrypted: Boolean = false

    /**
     * Initialize storage. Called once by CinacoinSDK.initialize().
     *
     * @param context Application context.
     * @param encrypt If true, uses AndroidX EncryptedSharedPreferences.
     */
    fun initialize(context: Context, encrypt: Boolean = true) {
        _isEncrypted = encrypt

        prefs = if (encrypt) {
            try {
                val masterKey = MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build()

                EncryptedSharedPreferences.create(
                    context,
                    "cinacoin_sdk_encrypted",
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                )
            } catch (_: Exception) {
                // Fallback to plain SharedPreferences if encryption fails (e.g. API < 23)
                _isEncrypted = false
                context.getSharedPreferences("cinacoin_sdk", Context.MODE_PRIVATE)
            }
        } else {
            context.getSharedPreferences("cinacoin_sdk", Context.MODE_PRIVATE)
        }
    }

    /**
     * Get a string value.
     */
    fun getString(key: String): String? =
        prefs.getString(key, null)

    /**
     * Set a string value.
     */
    fun putString(key: String, value: String) {
        prefs.edit().putString(key, value).apply()
    }

    /**
     * Get an integer value.
     */
    fun getInt(key: String, defaultValue: Int = 0): Int =
        prefs.getInt(key, defaultValue)

    /**
     * Set an integer value.
     */
    fun putInt(key: String, value: Int) {
        prefs.edit().putInt(key, value).apply()
    }

    /**
     * Get a long value.
     */
    fun getLong(key: String, defaultValue: Long = 0L): Long =
        prefs.getLong(key, defaultValue)

    /**
     * Set a long value.
     */
    fun putLong(key: String, value: Long) {
        prefs.edit().putLong(key, value).apply()
    }

    /**
     * Get a boolean value.
     */
    fun getBoolean(key: String, defaultValue: Boolean = false): Boolean =
        prefs.getBoolean(key, defaultValue)

    /**
     * Set a boolean value.
     */
    fun putBoolean(key: String, value: Boolean) {
        prefs.edit().putBoolean(key, value).apply()
    }

    /**
     * Remove a key.
     */
    fun remove(key: String) {
        prefs.edit().remove(key).apply()
    }

    /**
     * Check if a key exists.
     */
    fun contains(key: String): Boolean =
        prefs.contains(key)

    /**
     * Clear all stored data.
     */
    fun clear() {
        prefs.edit().clear().apply()
    }

    /**
     * Whether encryption is currently active.
     */
    val isEncrypted: Boolean
        get() = _isEncrypted

    /**
     * Get all key-value pairs (for debugging).
     */
    fun getAll(): Map<String, *> = prefs.all
}

/**
 * WCSessionRecoveryTest — Tests for session recovery and multi-session management.
 */
package com.cinacoin.walletconnect

import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlinx.coroutines.runBlocking
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull

@RunWith(JUnit4::class)
class WCSessionRecoveryTest {

    private lateinit var prefs: TestSharedPreferences
    private lateinit var recovery: WCSessionRecovery

    @Before
    fun setUp() {
        prefs = TestSharedPreferences()
        recovery = WCSessionRecovery(prefs)
    }

    @Test
    fun `register and load a single session`() {
        recovery.registerSession(
            topic = "test-topic-123",
            accounts = listOf("eip155:1:0xabc123"),
            chainId = 1,
            peerName = "TestWallet"
        )

        val active = recovery.getActiveSession()
        assertNotNull(active)
        assertEquals("test-topic-123", active.topic)
        assertEquals("TestWallet", active.peerName)
        assertTrue(active.isActive)
    }

    @Test
    fun `register multiple sessions and list them`() = runBlocking {
        recovery.registerSession("topic-1", listOf("eip155:1:0xaaa"), 1, "Wallet A", isActive = true)
        recovery.registerSession("topic-2", listOf("eip155:137:0xbbb"), 137, "Wallet B", isActive = false)

        val all = recovery.getAllSessions()
        assertEquals(2, all.size)

        val result = recovery.attemptRecovery()
        assertTrue(result is RecoveryResult.Success)
        assertEquals(2, result.sessions.size)
    }

    @Test
    fun `set active session switches correctly`() {
        recovery.registerSession("topic-1", listOf("eip155:1:0xaaa"), 1, "Wallet A", isActive = true)
        recovery.registerSession("topic-2", listOf("eip155:137:0xbbb"), 137, "Wallet B", isActive = false)

        assertTrue(recovery.setActiveSession("topic-2"))

        val active = recovery.getActiveSession()
        assertNotNull(active)
        assertEquals("topic-2", active.topic)
        assertTrue(active.isActive)
    }

    @Test
    fun `unregister session removes it`() {
        recovery.registerSession("topic-1", listOf("eip155:1:0xaaa"), 1, "Wallet A")
        recovery.unregisterSession("topic-1")

        val all = recovery.getAllSessions()
        assertTrue(all.isEmpty())
    }

    @Test
    fun `expired sessions are filtered out`() {
        // Manually insert an expired session
        val now = System.currentTimeMillis()
        val expiredEntry = MultiSessionEntry(
            topic = "expired-topic",
            accounts = listOf("eip155:1:0xdead"),
            chainId = 1,
            peerName = "DeadWallet",
            createdAt = now - 8L * 24 * 60 * 60 * 1000, // 8 days ago
            expiresAt = now - 1 * 24 * 60 * 60 * 1000, // expired 1 day ago
            isActive = false
        )

        prefs.edit().putString("wc_v2_multi_sessions_v1",
            org.json.JSONArray().apply {
                put(org.json.JSONObject().apply {
                    put("topic", expiredEntry.topic)
                    put("accounts", org.json.JSONArray(expiredEntry.accounts))
                    put("chainId", expiredEntry.chainId)
                    put("peerName", expiredEntry.peerName)
                    put("createdAt", expiredEntry.createdAt)
                    put("expiresAt", expiredEntry.expiresAt)
                    put("isActive", expiredEntry.isActive)
                    put("lastValidatedAt", expiredEntry.lastValidatedAt)
                })
            }.toString()
        ).apply()

        val loaded = recovery.loadRegistry()
        assertTrue(loaded.isEmpty()) // Expired session should be filtered
    }

    @Test
    fun `validate session updates lastValidatedAt`() {
        recovery.registerSession("topic-1", listOf("eip155:1:0xaaa"), 1, "Wallet A")

        Thread.sleep(10) // Ensure time passes
        recovery.validateSession("topic-1")

        val session = recovery.getActiveSession()
        assertNotNull(session)
        assertTrue(session.lastValidatedAt > session.createdAt)
    }

    @Test
    fun `legacy single-session compat works`() {
        val legacySession = PersistedSession(
            topic = "legacy-topic",
            accounts = listOf("eip155:1:0xlegacy"),
            chainId = 1,
            peerName = "LegacyWallet",
            createdAt = System.currentTimeMillis(),
            expiresAt = System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000
        )
        recovery.saveActiveSession(legacySession)

        val loaded = recovery.loadActiveSession()
        assertNotNull(loaded)
        assertEquals("legacy-topic", loaded.topic)
    }
}

/** Minimal SharedPreferences mock for JVM tests. */
class TestSharedPreferences : android.content.SharedPreferences {
    private val storage = mutableMapOf<String, Any?>()

    override fun getString(key: String?, defValue: String?): String? =
        storage[key] as? String? ?: defValue

    override fun getInt(key: String?, defValue: Int): Int =
        (storage[key] as? Int) ?: defValue

    override fun getLong(key: String?, defValue: Long): Long =
        (storage[key] as? Long) ?: defValue

    override fun getFloat(key: String?, defValue: Float): Float =
        (storage[key] as? Float) ?: defValue

    override fun getBoolean(key: String?, defValue: Boolean): Boolean =
        (storage[key] as? Boolean) ?: defValue

    override fun getStringSet(key: String?, defValues: MutableSet<String>?): MutableSet<String>? =
        (storage[key] as? MutableSet<String>) ?: defValues

    override fun contains(key: String?): Boolean = storage.containsKey(key)

    override fun edit(): android.content.SharedPreferences.Editor = TestEditor(storage)

    override fun registerOnSharedPreferenceChangeListener(listener: android.content.SharedPreferences.OnSharedPreferenceChangeListener?) {}
    override fun unregisterOnSharedPreferenceChangeListener(listener: android.content.SharedPreferences.OnSharedPreferenceChangeListener?) {}

    override fun getAll(): MutableMap<String,*> = storage.toMutableMap()
}

class TestEditor(private val storage: MutableMap<String, Any?>) : android.content.SharedPreferences.Editor {
    override fun putString(key: String?, value: String?): android.content.SharedPreferences.Editor {
        storage[key] = value; return this
    }
    override fun putInt(key: String?, value: Int): android.content.SharedPreferences.Editor {
        storage[key] = value; return this
    }
    override fun putLong(key: String?, value: Long): android.content.SharedPreferences.Editor {
        storage[key] = value; return this
    }
    override fun putFloat(key: String?, value: Float): android.content.SharedPreferences.Editor {
        storage[key] = value; return this
    }
    override fun putBoolean(key: String?, value: Boolean): android.content.SharedPreferences.Editor {
        storage[key] = value; return this
    }
    override fun putStringSet(key: String?, values: MutableSet<String>?): android.content.SharedPreferences.Editor {
        storage[key] = values; return this
    }
    override fun remove(key: String?): android.content.SharedPreferences.Editor {
        storage.remove(key); return this
    }
    override fun clear(): android.content.SharedPreferences.Editor {
        storage.clear(); return this
    }
    override fun commit(): Boolean = true
    override fun apply() {}
}

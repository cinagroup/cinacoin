/**
 * WCSiweHandlerTest — Tests for SIWE message generation and EIP-4361 compliance.
 */
package com.cinacoin.walletconnect

import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class WCSiweHandlerTest {

    @Test
    fun `SIWE message serialization is EIP-4361 compliant`() {
        val msg = SiweMessage(
            domain = "login.example.com",
            address = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            statement = "Sign in to access your account",
            uri = "https://login.example.com",
            version = "1",
            chainId = 1,
            nonce = "abc123def456",
            issuedAt = "2024-01-15T10:30:00Z"
        )

        val serialized = msg.serialize()

        assertTrue(serialized.contains("login.example.com wants you to sign in with your Ethereum account:"))
        assertTrue(serialized.contains("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"))
        assertTrue(serialized.contains("Sign in to access your account"))
        assertTrue(serialized.contains("URI: https://login.example.com"))
        assertTrue(serialized.contains("Version: 1"))
        assertTrue(serialized.contains("Chain ID: 1"))
        assertTrue(serialized.contains("Nonce: abc123def456"))
        assertTrue(serialized.contains("Issued At: 2024-01-15T10:30:00Z"))
    }

    @Test
    fun `SIWE message with optional fields`() {
        val msg = SiweMessage(
            domain = "app.example.com",
            address = "0x1234567890abcdef1234567890abcdef12345678",
            uri = "https://app.example.com",
            chainId = 137,
            nonce = "nonce456",
            issuedAt = "2024-06-01T00:00:00Z",
            expirationTime = "2024-06-02T00:00:00Z",
            notBefore = "2024-06-01T00:00:00Z",
            requestId = "req-789",
            resources = listOf("https://docs.example.com", "https://api.example.com/v1")
        )

        val serialized = msg.serialize()

        assertTrue(serialized.contains("Expiration Time: 2024-06-02T00:00:00Z"))
        assertTrue(serialized.contains("Not Before: 2024-06-01T00:00:00Z"))
        assertTrue(serialized.contains("Request ID: req-789"))
        assertTrue(serialized.contains("Resources:"))
        assertTrue(serialized.contains("- https://docs.example.com"))
        assertTrue(serialized.contains("- https://api.example.com/v1"))
    }

    @Test
    fun `SIWE message without statement is valid`() {
        val msg = SiweMessage(
            domain = "simple.example.com",
            address = "0xabcdef",
            uri = "https://simple.example.com",
            chainId = 1,
            nonce = "n1",
            issuedAt = "2024-01-01T00:00:00Z"
        )

        val serialized = msg.serialize()

        // Should not contain blank statement lines
        assertTrue(serialized.startsWith("simple.example.com wants you to sign in with your Ethereum account:"))
    }

    @Test
    fun `parse SIWE message back to fields`() {
        val msg = SiweMessage(
            domain = "parse.example.com",
            address = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            statement = "Please sign in",
            uri = "https://parse.example.com",
            chainId = 10,
            nonce = "parse-nonce-123",
            issuedAt = "2024-03-15T12:00:00Z"
        )

        val serialized = msg.serialize()
        val parsed = SiweMessage.parse(serialized)

        assertNotNull(parsed)
        assertEquals("parse.example.com", parsed.domain)
        assertEquals("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18", parsed.address)
        assertEquals("Please sign in", parsed.statement)
        assertEquals("https://parse.example.com", parsed.uri)
        assertEquals(10, parsed.chainId)
        assertEquals("parse-nonce-123", parsed.nonce)
    }

    @Test
    fun `parse SIWE with resources`() {
        val msg = SiweMessage(
            domain = "res.example.com",
            address = "0xabc",
            uri = "https://res.example.com",
            chainId = 1,
            nonce = "n1",
            issuedAt = "2024-01-01T00:00:00Z",
            resources = listOf("https://a.com", "https://b.com")
        )

        val parsed = SiweMessage.parse(msg.serialize())
        assertNotNull(parsed)
        assertEquals(2, parsed.resources?.size)
        assertEquals("https://a.com", parsed.resources?.get(0))
    }

    @Test
    fun `nonce generator produces unique values`() {
        val gen = DefaultNonceGenerator()
        val nonces = (1..100).map { gen.generate() }

        // All nonces should be unique
        assertEquals(100, nonces.distinct().size)

        // All should be 32 hex chars (16 bytes)
        nonces.forEach { nonce ->
            assertEquals(32, nonce.length)
            assertTrue(nonce.all { it in '0'..'9' || it in 'a'..'f' })
        }
    }

    @Test
    fun `Caip2Chain parsing`() {
        val chain = Caip2Chain.fromString("eip155:1")
        assertNotNull(chain)
        assertEquals("eip155", chain.namespace)
        assertEquals("1", chain.reference)
        assertEquals("eip155:1", chain.id)

        val invalid = Caip2Chain.fromString("invalid")
        assertNull(invalid)
    }
}

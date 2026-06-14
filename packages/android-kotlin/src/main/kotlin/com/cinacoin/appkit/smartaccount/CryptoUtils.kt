package com.cinacoin.appkit.smartaccount

import java.math.BigInteger
import java.security.MessageDigest

/**
 * Cryptographic utilities for ERC-4337 smart account operations.
 *
 * Production note: uses SHA3-256 (FIPS 202) as a stand-in for keccak256.
 * Replace with BouncyCastle's KeccakDigest(256) or web3j's Numeric/Hash
 * for real keccak256 semantics.
 */
object CryptoUtils {

    // ---- keccak256 ----------------------------------------------------------

    /** Compute keccak256 hash (placeholder: SHA3-256). */
    fun keccak256(data: ByteArray): ByteArray {
        // TODO: Replace with actual keccak256 (BouncyCastle KeccakDigest(256))
        val digest = MessageDigest.getInstance("SHA3-256")
        return digest.digest(data)
    }

    fun keccak256(string: String): ByteArray = keccak256(string.toByteArray(Charsets.UTF_8))

    // ---- hex ----------------------------------------------------------------

    fun hexToBytes(hex: String): ByteArray {
        var h = hex.removePrefix("0x").removePrefix("0X")
        if (h.length % 2 != 0) h = "0$h"
        return ByteArray(h.length / 2) { i ->
            h.substring(i * 2, i * 2 + 2).toInt(16).toByte()
        }
    }

    fun bytesToHex(bytes: ByteArray, prefix: Boolean = true): String {
        val hex = bytes.joinToString("") { "%02x".format(it) }
        return if (prefix) "0x$hex" else hex
    }

    // ---- ABI encoding -------------------------------------------------------

    /** Left-pad an address to 32 bytes. */
    fun padAddress(address: String): ByteArray {
        val raw = hexToBytes(address)
        return ByteArray(32 - raw.size) + raw
    }

    /** Encode a Long as a 32-byte big-endian uint256. */
    fun padUint256(value: Long): ByteArray {
        val big = BigInteger.valueOf(value)
        val raw = big.toByteArray()
        return when {
            raw.size > 32 -> raw.takeLast(32).toByteArray()
            raw.size < 32 -> ByteArray(32 - raw.size) + raw
            else -> raw
        }
    }

    /** Encode arbitrary-length bytes as ABI dynamic bytes. */
    fun abiEncodeBytes(data: ByteArray): ByteArray {
        val length = padUint256(data.size.toLong())
        val paddedLen = ((data.size + 31) / 32) * 32
        val padded = data + ByteArray(paddedLen - data.size)
        return length + padded
    }

    /** Function selector: first 4 bytes of keccak256(signature). */
    fun functionSelector(signature: String): ByteArray =
        keccak256(signature).copyOfRange(0, 4)

    // ---- CREATE2 ------------------------------------------------------------

    /**
     * address = keccak256(0xff ++ factory ++ salt ++ keccak256(initCode))[12..]
     */
    fun computeCreate2Address(
        factory: String,
        salt: ByteArray,
        initCode: ByteArray,
    ): String {
        val factoryBytes = hexToBytes(factory)
        val initCodeHash = keccak256(initCode)

        val buf = ByteArray(1 + factoryBytes.size + salt.size + initCodeHash.size)
        var pos = 0
        buf[pos++] = 0xff.toByte()
        System.arraycopy(factoryBytes, 0, buf, pos, factoryBytes.size); pos += factoryBytes.size
        System.arraycopy(salt, 0, buf, pos, salt.size); pos += salt.size
        System.arraycopy(initCodeHash, 0, buf, pos, initCodeHash.size)

        val hash = keccak256(buf)
        return bytesToHex(hash.copyOfRange(12, 32))
    }
}

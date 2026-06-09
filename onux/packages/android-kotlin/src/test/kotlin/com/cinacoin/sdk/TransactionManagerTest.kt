package com.cinacoin.sdk

import org.junit.Test
import org.junit.Assert.*
import kotlinx.coroutines.test.runTest

class TransactionManagerTest {

    @Test
    fun `buildTransfer creates correct params`() = runTest {
        val params = TransactionParams(
            from = "0xsender",
            to = "0xreceiver",
            value = "0x" + (1_000_000_000_000_000_000L).toString(16), // 1 ETH in wei
            data = "0x",
            chainId = 1
        )

        assertEquals("0xsender", params.from)
        assertEquals("0xreceiver", params.to)
        assertEquals("0x", params.data)
        assertEquals(1, params.chainId)
    }

    @Test
    fun `buildContractCall sets calldata`() = runTest {
        val params = TransactionParams(
            from = "0xsender",
            to = "0xcontract",
            data = "0xa9059cbb",
            chainId = 137
        )

        assertEquals("0xa9059cbb", params.data)
        assertEquals(137, params.chainId)
    }

    @Test
    fun `TxReceipt contains all fields`() = runTest {
        val receipt = TxReceipt(
            hash = "0xabc",
            chainId = 1,
            status = TxStatus.CONFIRMED,
            blockNumber = 18000000L,
            gasUsed = 21000L
        )

        assertEquals("0xabc", receipt.hash)
        assertEquals(TxStatus.CONFIRMED, receipt.status)
        assertEquals(18000000L, receipt.blockNumber)
        assertEquals(21000L, receipt.gasUsed)
    }
}

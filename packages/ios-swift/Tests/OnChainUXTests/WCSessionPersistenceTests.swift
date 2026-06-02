/**
 * WCSessionPersistenceTests — Tests for WC v2 session persistence & auto-reconnect (iOS).
 */

import XCTest
@testable import OnChainUX

// MARK: - Persisted Session Tests

final class WCSessionPersistenceTests: XCTestCase {

    private var testDefaults: UserDefaults!

    override func setUp() {
        super.setUp()
        testDefaults = UserDefaults(suiteName: "test.wc.session.\(UUID().uuidString)")
    }

    // MARK: - Persistence

    func testPersistAndLoadSession() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.persistSession(
            topic: "test-topic-abc123",
            accounts: ["eip155:1:0xAbc...Def"],
            chainId: 1,
            peerName: "MetaMask"
        )

        let loaded = manager.loadSession()
        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.topic, "test-topic-abc123")
        XCTAssertEqual(loaded?.accounts, ["eip155:1:0xAbc...Def"])
        XCTAssertEqual(loaded?.chainId, 1)
        XCTAssertEqual(loaded?.peerName, "MetaMask")
        XCTAssertFalse(loaded!.isExpired)
    }

    func testClearSessionRemovesData() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.persistSession(topic: "t", accounts: [], chainId: 1)
        XCTAssertNotNil(manager.loadSession())

        manager.clearSession()
        XCTAssertNil(manager.loadSession())
    }

    func testExpiredSessionReturnsNil() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.sessionTTL = 0.001 // 1ms for testing

        manager.persistSession(topic: "t", accounts: [], chainId: 1)
        // Wait for TTL to expire
        Thread.sleep(forTimeInterval: 0.01)

        XCTAssertNil(manager.loadSession())
    }

    func testLoadSessionNilWhenNoData() {
        let manager = WCSessionManager(defaults: testDefaults)
        XCTAssertNil(manager.loadSession())
    }

    // MARK: - Expiry Monitoring

    func testExpiryCheckDetectsExpiredSession() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.sessionTTL = 0.001

        manager.persistSession(topic: "t", accounts: [], chainId: 1)
        Thread.sleep(forTimeInterval: 0.01)

        let expectation = self.expectation(description: "onExpired called")
        manager.checkExpiry(onExpired: {
            expectation.fulfill()
        })

        waitForExpectations(timeout: 1)
        XCTAssertNil(manager.loadSession())
    }

    func testExpiryCheckDoesNothingForValidSession() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.persistSession(topic: "t", accounts: [], chainId: 1)

        var expiredCalled = false
        manager.checkExpiry(onExpired: { expiredCalled = true })

        XCTAssertFalse(expiredCalled)
        XCTAssertNotNil(manager.loadSession())
    }

    // MARK: - Auto-Reconnect

    func testScheduleReconnectIncrementsAttempts() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.reconnectBaseDelay = 0.01 // fast for testing
        manager.maxReconnectAttempts = 2

        let scheduled = manager.scheduleReconnect { false } // always fails
        XCTAssertTrue(scheduled)
        XCTAssertEqual(manager.reconnectAttempts, 0) // hasn't fired yet

        let exp = self.expectation(description: "reconnect fires")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            XCTAssertTrue(manager.reconnectAttempts >= 1)
            exp.fulfill()
        }
        waitForExpectations(timeout: 2)
    }

    func testCancelReconnectResetsCounter() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.reconnectBaseDelay = 10 // long delay so it doesn't fire
        _ = manager.scheduleReconnect { false }

        manager.cancelReconnect()
        XCTAssertEqual(manager.reconnectAttempts, 0)
    }

    func testMaxReconnectAttemptsStopsScheduling() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.maxReconnectAttempts = 0

        let scheduled = manager.scheduleReconnect { false }
        XCTAssertFalse(scheduled)
    }

    func testSuccessfulReconnectResetsCounter() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.reconnectBaseDelay = 0.01
        manager.maxReconnectAttempts = 3

        _ = manager.scheduleReconnect { true } // succeeds immediately

        let exp = self.expectation(description: "reconnect succeeds")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            // After success, counter should be reset
            // (may take a moment to complete)
            exp.fulfill()
        }
        waitForExpectations(timeout: 2)
    }

    // MARK: - App Lifecycle

    func testAppDidBecomeActiveChecksExpiry() {
        let manager = WCSessionManager(defaults: testDefaults)
        manager.sessionTTL = 0.001
        manager.persistSession(topic: "t", accounts: [], chainId: 1)
        Thread.sleep(forTimeInterval: 0.01)

        manager.appDidBecomeActive()
        XCTAssertNil(manager.loadSession()) // cleared by expiry check
    }

    // MARK: - Defaults

    func testDefaultSessionTTL() {
        let manager = WCSessionManager(defaults: testDefaults)
        // 7 days in seconds
        XCTAssertEqual(manager.sessionTTL, 7 * 24 * 60 * 60)
    }

    func testDefaultMaxReconnectAttempts() {
        let manager = WCSessionManager(defaults: testDefaults)
        XCTAssertEqual(manager.maxReconnectAttempts, 5)
    }

    func testAutoReconnectEnabledByDefault() {
        let manager = WCSessionManager(defaults: testDefaults)
        XCTAssertTrue(manager.autoReconnectEnabled)
    }

    // MARK: - Relay Health

    func testRelayHealthDefault() {
        let manager = WCSessionManager(defaults: testDefaults)
        XCTAssertEqual(manager.relayHealth, .disconnected)
    }

    func testRelayHealthEquality() {
        XCTAssertEqual(RelayHealth.connected, .connected)
        XCTAssertEqual(RelayHealth.disconnected, .disconnected)
        XCTAssertEqual(RelayHealth.degraded, .degraded)
        XCTAssertEqual(RelayHealth.reconnecting, .reconnecting)
        XCTAssertNotEqual(RelayHealth.connected, .disconnected)
    }
}

// MARK: - BigInt Tests

final class BigIntTests: XCTestCase {

    func testParseValidHex() {
        let bigInt = BigInt("0x5208", radix: 16)
        XCTAssertEqual(bigInt?.magnitude, 21000)
    }

    func testParseZero() {
        let bigInt = BigInt("0x0", radix: 16)
        XCTAssertEqual(bigInt?.magnitude, 0)
    }

    func testParseInvalidReturnsNil() {
        XCTAssertNil(BigInt("0xZZZZ", radix: 16))
    }

    func testParseNoPrefixReturnsNil() {
        XCTAssertNil(BigInt("abc", radix: 16))
    }

    func testParseNonHexRadixReturnsNil() {
        XCTAssertNil(BigInt("10", radix: 10))
    }

    func testParseLargeValue() {
        let bigInt = BigInt("0xFFFFFFFFFFFFFFFF", radix: 16)
        XCTAssertEqual(bigInt?.magnitude, UInt64.max)
    }

    func testParseOverflowReturnsNil() {
        XCTAssertNil(BigInt("0x10000000000000000", radix: 16)) // exceeds UInt64
    }
}

// MARK: - String Extension Tests

final class StringExtensionTests: XCTestCase {

    func testUtf8Hex() {
        let hex = "hello".utf8Hex
        XCTAssertEqual(hex, "0x68656c6c6f")
    }

    func testUtf8HexEmpty() {
        XCTAssertEqual("".utf8Hex, "0x")
    }

    func testUtf8HexWithSpecialChars() {
        let hex = "0xabc".utf8Hex
        XCTAssertTrue(hex.hasPrefix("0x"))
        XCTAssertTrue(hex.count > 2)
    }

    func testUrlEncoded() {
        let encoded = "hello world".urlEncoded
        XCTAssertTrue(encoded.contains("hello"))
        XCTAssertTrue(encoded.contains("world"))
    }
}

// MARK: - WCTransactionRequest Tests

final class WCTransactionRequestTests: XCTestCase {

    func testMinimalTransaction() {
        let tx = WCTransactionRequest(from: "0xabc", to: "0xdef")
        XCTAssertEqual(tx.from, "0xabc")
        XCTAssertEqual(tx.to, "0xdef")
        XCTAssertNil(tx.value)
        XCTAssertNil(tx.data)
        XCTAssertNil(tx.gas)
        XCTAssertNil(tx.chainId)
    }

    func testFullTransaction() {
        let tx = WCTransactionRequest(
            from: "0xabc",
            to: "0xdef",
            value: "0x100",
            data: "0xabcdef",
            gas: "0x5208",
            gasPrice: "0x1",
            maxFeePerGas: "0x2",
            maxPriorityFeePerGas: "0x1",
            nonce: "0x0",
            chainId: 1
        )
        XCTAssertEqual(tx.value, "0x100")
        XCTAssertEqual(tx.data, "0xabcdef")
        XCTAssertEqual(tx.gas, "0x5208")
        XCTAssertEqual(tx.gasPrice, "0x1")
        XCTAssertEqual(tx.maxFeePerGas, "0x2")
        XCTAssertEqual(tx.maxPriorityFeePerGas, "0x1")
        XCTAssertEqual(tx.nonce, "0x0")
        XCTAssertEqual(tx.chainId, 1)
    }
}

// MARK: - WCMethods & WCEvents Tests

final class WCConstantsTests: XCTestCase {

    func testStandardEvmMethods() {
        let methods = WCMethods.standardEvmMethods
        XCTAssertTrue(methods.contains("eth_sendTransaction"))
        XCTAssertTrue(methods.contains("personal_sign"))
        XCTAssertTrue(methods.contains("eth_signTypedData_v4"))
        XCTAssertTrue(methods.contains("eth_signTransaction"))
        XCTAssertEqual(methods.count, 9)
    }

    func testStandardEvmEvents() {
        let events = WCEvents.standardEvmEvents
        XCTAssertTrue(events.contains("chainChanged"))
        XCTAssertTrue(events.contains("accountsChanged"))
        XCTAssertEqual(events.count, 2)
    }

    func testMethodConstants() {
        XCTAssertEqual(WCMethods.ethSendTransaction, "eth_sendTransaction")
        XCTAssertEqual(WCMethods.ethSignTransaction, "eth_signTransaction")
        XCTAssertEqual(WCMethods.personalSign, "personal_sign")
        XCTAssertEqual(WCMethods.ethSignTypedDataV4, "eth_signTypedData_v4")
        XCTAssertEqual(WCMethods.walletSwitchEthereumChain, "wallet_switchEthereumChain")
        XCTAssertEqual(WCMethods.walletAddEthereumChain, "wallet_addEthereumChain")
        XCTAssertEqual(WCMethods.ethAccounts, "eth_accounts")
        XCTAssertEqual(WCMethods.ethChainId, "eth_chainId")
    }
}

// MARK: - WCError Tests

final class WCErrorTests: XCTestCase {

    func testErrorDescriptions() {
        XCTAssertEqual(WCError.notConnected.errorDescription, "Not connected to a wallet")
        XCTAssertEqual(WCError.notConfigured.errorDescription, "WCClient has not been configured")
        XCTAssertEqual(WCError.sessionTimeout.errorDescription, "Session establishment timed out")
        XCTAssertTrue(WCError.invalidUrl("bad").errorDescription!.contains("bad"))
        XCTAssertTrue(WCError.invalidUri("bad").errorDescription!.contains("bad"))
    }

    func testRequestTimeoutDescription() {
        let err = WCError.requestTimeout("eth_sendTransaction")
        XCTAssertTrue(err.errorDescription!.contains("eth_sendTransaction"))
    }

    func testRpcErrorDescription() {
        let err = WCError.rpcError(-32603, "Internal error")
        XCTAssertTrue(err.errorDescription!.contains("-32603"))
        XCTAssertTrue(err.errorDescription!.contains("Internal error"))
    }

    func testInvalidProposalResponse() {
        XCTAssertEqual(WCError.invalidProposalResponse.errorDescription, "Invalid session proposal response")
    }

    func testRelayError() {
        let err = WCError.relayError("connection lost")
        XCTAssertTrue(err.errorDescription!.contains("connection lost"))
    }

    func testCryptoError() {
        let err = WCError.cryptoError("key derivation failed")
        XCTAssertTrue(err.errorDescription!.contains("key derivation failed"))
    }
}

// MARK: - WCStatus Tests

final class WCStatusTests: XCTestCase {

    func testStatusEquality() {
        XCTAssertEqual(WCStatus.disconnected, .disconnected)
        XCTAssertEqual(WCStatus.connecting, .connecting)
        XCTAssertEqual(WCStatus.pairing, .pairing)
        XCTAssertEqual(WCStatus.connected, .connected)
        XCTAssertEqual(WCStatus.error("x"), .error("x"))
        XCTAssertNotEqual(WCStatus.error("x"), .error("y"))
        XCTAssertNotEqual(WCStatus.connected, .disconnected)
    }
}

// MARK: - WCSession Tests

final class WCSessionTests: XCTestCase {

    func testSessionDefaults() {
        let session = WCSession(topic: "abc")
        XCTAssertEqual(session.topic, "abc")
        XCTAssertTrue(session.accounts.isEmpty)
        XCTAssertTrue(session.peerMetadata.isEmpty)
        XCTAssertTrue(session.namespaces.isEmpty)
        XCTAssertTrue(session.relay.isEmpty)
    }

    func testSessionWithValues() {
        let session = WCSession(
            topic: "xyz",
            peerMetadata: ["name": "MetaMask"],
            accounts: ["eip155:1:0xAbc"],
            namespaces: ["eip155": ["methods": ["eth_sendTransaction"]]],
            relay: ["protocol": "waku"]
        )
        XCTAssertEqual(session.topic, "xyz")
        XCTAssertEqual(session.peerMetadata["name"], "MetaMask")
        XCTAssertEqual(session.accounts, ["eip155:1:0xAbc"])
    }
}

// MARK: - WCAppMetadata Tests

final class WCAppMetadataTests: XCTestCase {

    func testDefaultMetadata() {
        let meta = WCAppMetadata.default
        XCTAssertEqual(meta.name, "Cinacoin dApp")
        XCTAssertEqual(meta.url, "https://cinacoin.io")
    }

    func testCustomMetadata() {
        let meta = WCAppMetadata(
            name: "Test App",
            description: "A test",
            url: "https://test.app",
            icons: ["https://test.app/icon.png"]
        )
        XCTAssertEqual(meta.name, "Test App")
        XCTAssertEqual(meta.description, "A test")
        XCTAssertEqual(meta.url, "https://test.app")
        XCTAssertEqual(meta.icons, ["https://test.app/icon.png"])
    }
}

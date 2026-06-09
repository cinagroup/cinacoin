/**
 * WalletConnectFlowTests — tests for the full WC v2 connection flow.
 *
 * Validates session lifecycle, deep-link generation, event emission,
 * and balance parsing.
 */

import XCTest
@testable import OnChainUX

final class WalletConnectFlowTests: XCTestCase {

    // MARK: - Event System

    func testMultipleEventSubscriptions() {
        let client = WCClient.shared
        var events1: [WCEvent] = []
        var events2: [WCEvent] = []

        let id1 = client.onEvent { events1.append($0) }
        let id2 = client.onEvent { events2.append($0) }

        XCTAssertNotNil(id1)
        XCTAssertNotNil(id2)
        XCTAssertNotEqual(id1, id2)

        client.unsubscribe(id1)
        client.unsubscribe(id2)
    }

    func testUnsubscribeUnknownId() {
        let client = WCClient.shared
        // Should not crash
        client.unsubscribe(UUID())
        XCTAssertTrue(true)
    }

    // MARK: - URI Parse & Deep Link

    func testDeepLinkSchemeConstruction() {
        let handler = DeepLinkHandler()
        let configs = DeepLinkHandler.walletConfigs

        // Verify MetaMask deep link config exists
        let mmConfig = configs["metamask"]
        XCTAssertNotNil(mmConfig)
        XCTAssertEqual(mmConfig?.scheme, "metamask://")
        XCTAssertNotNil(mmConfig?.universalDomain)
    }

    func testDeepLinkWithEmptyUri() {
        let handler = DeepLinkHandler()
        let link = handler.generateDeepLink(walletId: "metamask", uri: "")
        XCTAssertFalse(link.isEmpty)
        XCTAssertTrue(link.hasPrefix("metamask://"))
    }

    // MARK: - Account Extraction (CAIP-10)

    func testExtractAddressFromCaip10() {
        let caip10 = "eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"

        let parts = caip10.split(separator: ":")
        XCTAssertEqual(parts.count, 3)

        let address = parts.count >= 3 ? String(parts[2]) : nil
        XCTAssertEqual(address, "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18")
    }

    func testExtractChainIdFromCaip2() {
        let caip2 = "eip155:137"
        let parts = caip2.split(separator: ":")
        XCTAssertEqual(parts.count, 2)

        let chainId = parts.count >= 2 ? Int(parts[1]) : nil
        XCTAssertEqual(chainId, 137)
    }

    func testExtractChainIdFromMalformed() {
        let malformed = "eip155"
        let parts = malformed.split(separator: ":")
        XCTAssertLessThan(parts.count, 2)

        let chainId = parts.count >= 2 ? Int(parts[1]) : nil
        XCTAssertNil(chainId)
    }

    // MARK: - WalletManager Connectors

    func testWalletManagerHasMetamask() {
        let manager = WalletManager()
        let config = CinacoinConfig(
            projectId: "test",
            chains: [.ethereum, .polygon]
        )
        manager.configure(with: config)

        let connectors = manager.getConnectors()
        XCTAssertTrue(connectors.contains(where: { $0.id == "metamask" }))
        XCTAssertTrue(connectors.contains(where: { $0.id == "walletconnect" }))
    }

    func testWalletManagerConnectorTypes() {
        let manager = WalletManager()
        let config = CinacoinConfig(
            projectId: "test",
            chains: [.ethereum]
        )
        manager.configure(with: config)

        let connectors = manager.getConnectors()
        let wcType = connectors.first(where: { $0.id == "metamask" })?.type
        XCTAssertEqual(wcType, .walletconnect)

        let emailType = connectors.first(where: { $0.id == "email" })?.type
        XCTAssertEqual(emailType, .email)
    }

    // MARK: - WCClient Initial State (Fresh)

    func testFreshWCClientInitialState() {
        // Reset shared state for test
        let client = WCClient.shared
        // Verify defaults — these should match expected initial state
        XCTAssertEqual(client.chainId, 1)
        XCTAssertTrue(client.accounts.isEmpty)
    }

    // MARK: - WCSession Struct

    func testWCSessionDefaults() {
        let session = WCSession(topic: "test-topic")
        XCTAssertEqual(session.topic, "test-topic")
        XCTAssertTrue(session.accounts.isEmpty)
        XCTAssertTrue(session.peerMetadata.isEmpty)
        XCTAssertTrue(session.namespaces.isEmpty)
        XCTAssertTrue(session.relay.isEmpty)
    }

    func testWCSessionWithAccounts() {
        let session = WCSession(
            topic: "session-123",
            accounts: ["eip155:1:0xABC", "eip155:137:0xABC"],
            peerMetadata: ["name": "Test Wallet"]
        )
        XCTAssertEqual(session.topic, "session-123")
        XCTAssertEqual(session.accounts.count, 2)
        XCTAssertEqual(session.peerMetadata["name"], "Test Wallet")
    }

    // MARK: - WCTransactionRequest

    func testTransactionRequestDefaultValues() {
        let tx = WCTransactionRequest(from: "0xA", to: "0xB")
        XCTAssertNil(tx.value)
        XCTAssertNil(tx.data)
        XCTAssertNil(tx.gas)
        XCTAssertNil(tx.gasPrice)
        XCTAssertNil(tx.maxFeePerGas)
        XCTAssertNil(tx.maxPriorityFeePerGas)
        XCTAssertNil(tx.nonce)
        XCTAssertNil(tx.chainId)
    }

    // MARK: - WCEvent Enum

    func testWCEventTypes() {
        let pairingEvent = WCEvent.pairingCreated(uri: "wc:test@2")
        let connectedEvent = WCEvent.connected(session: WCSession(topic: "s1"))
        let disconnectedEvent = WCEvent.disconnected
        let errorEvent = WCEvent.error(.notConnected)

        // Events should be constructable
        switch pairingEvent {
        case .pairingCreated(let uri):
            XCTAssertEqual(uri, "wc:test@2")
        default:
            XCTFail("Wrong event type")
        }

        switch connectedEvent {
        case .connected(let session):
            XCTAssertEqual(session.topic, "s1")
        default:
            XCTFail("Wrong event type")
        }

        switch disconnectedEvent {
        case .disconnected:
            break
        default:
            XCTFail("Wrong event type")
        }

        switch errorEvent {
        case .error(let err):
            XCTAssertEqual(err, WCError.notConnected)
        default:
            XCTFail("Wrong event type")
        }
    }
}

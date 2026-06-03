//
//  TypesTests.swift
//  CinacoinSDKTests
//
//  Unit tests for core types and error handling.
//

import XCTest
@testable import CinacoinSDK

final class TypesTests: XCTestCase {

    // MARK: - CinacoinError

    func testErrorDescriptions() {
        XCTAssertEqual(CinacoinError.notInitialized.errorDescription,
                       "SDK not configured. Call configure() first.")
        XCTAssertEqual(CinacoinError.notConnected.errorDescription,
                       "No wallet is currently connected.")
        XCTAssertTrue(CinacoinError.chainNotSupported(999).errorDescription!.contains("999"))
        XCTAssertTrue(CinacoinError.walletNotFound("unknown").errorDescription!.contains("unknown"))
        XCTAssertTrue(CinacoinError.connectionFailed("timeout").errorDescription!.contains("timeout"))
    }

    func testErrorEquality() {
        XCTAssertEqual(CinacoinError.notInitialized, .notInitialized)
        XCTAssertEqual(CinacoinError.chainNotSupported(1), .chainNotSupported(1))
        XCTAssertNotEqual(CinacoinError.chainNotSupported(1), .chainNotSupported(2))
    }

    // MARK: - ConnectionStatus

    func testConnectionStatusEquality() {
        XCTAssertEqual(ConnectionStatus.disconnected, .disconnected)
        XCTAssertEqual(ConnectionStatus.connected, .connected)
        XCTAssertEqual(ConnectionStatus.connecting, .connecting)
        XCTAssertEqual(ConnectionStatus.error("test"), .error("test"))
        XCTAssertNotEqual(ConnectionStatus.connected, .disconnected)
    }

    // MARK: - ConnectionResult

    func testConnectionResultCreation() {
        let result = ConnectionResult(
            accounts: ["0xabc"],
            chainId: 1,
            sessionId: "sess-1",
            connectorId: "metamask"
        )
        XCTAssertEqual(result.accounts, ["0xabc"])
        XCTAssertEqual(result.chainId, 1)
        XCTAssertEqual(result.sessionId, "sess-1")
        XCTAssertEqual(result.connectorId, "metamask")
    }

    // MARK: - TransactionRequest

    func testTransactionRequestDefaults() {
        let tx = TransactionRequest(from: "0xaaa", to: "0xbbb")
        XCTAssertNil(tx.value)
        XCTAssertNil(tx.data)
        XCTAssertNil(tx.gas)
        XCTAssertNil(tx.gasPrice)
        XCTAssertNil(tx.maxFeePerGas)
        XCTAssertNil(tx.maxPriorityFeePerGas)
        XCTAssertNil(tx.nonce)
        XCTAssertNil(tx.chainId)
    }

    // MARK: - SignatureResult

    func testSignatureResult() {
        let sig = SignatureResult(
            signature: "0xabc123",
            address: "0xabc",
            method: "personal_sign"
        )
        XCTAssertEqual(sig.signature, "0xabc123")
        XCTAssertEqual(sig.method, "personal_sign")
    }

    // MARK: - AppMetadata

    func testAppMetadata() {
        let meta = AppMetadata(
            name: "TestApp",
            description: "A test",
            url: "https://test.app",
            icons: ["https://test.app/icon.png"]
        )
        XCTAssertEqual(meta.name, "TestApp")
        XCTAssertEqual(meta.icons.count, 1)
    }

    // MARK: - ChainConfig

    func testChainConfigWeiConversion() {
        let eth = ChainConfig(
            chainId: 1,
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
            rpcUrl: "https://eth.llamarpc.com"
        )
        // 1 ETH = 1e18 wei
        let result = eth.weiToEther(wei: "1000000000000000000")
        XCTAssertNotNil(result)
    }

    // MARK: - WalletInfo

    func testWalletInfoDefaults() {
        let wallet = WalletInfo(id: "test", name: "Test Wallet")
        XCTAssertEqual(wallet.supportedChains, ["eip155:1"])
        XCTAssertNil(wallet.deepLinkScheme)
        XCTAssertNil(wallet.universalLinkDomain)
    }

    // MARK: - WalletRegistry

    func testWalletRegistryReturnsWallets() {
        let wallets = WalletRegistry.shared.recommended()
        XCTAssertFalse(wallets.isEmpty)
        XCTAssertTrue(wallets.contains { $0.id == "metamask" })
        XCTAssertTrue(wallets.contains { $0.id == "coinbase" })
    }

    func testWalletRegistryLookup() {
        let wallet = WalletRegistry.shared.wallet(id: "metamask")
        XCTAssertNotNil(wallet)
        XCTAssertEqual(wallet?.name, "MetaMask")
    }

    func testWalletRegistryUnknownId() {
        let wallet = WalletRegistry.shared.wallet(id: "nonexistent")
        XCTAssertNil(wallet)
    }
}

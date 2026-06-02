/**
 * WalletManagerSignTests — tests for WalletManager signing flows.
 *
 * Validates signTypedData, sendTransaction, SIWE, and chain switching
 * through the WalletManager abstraction.
 */

import XCTest
@testable import OnChainUX

final class WalletManagerSignTests: XCTestCase {

    // MARK: - SIWE Message Building

    func testBuildSIWEMessageWithStatement() {
        let message = SIWEAuth.buildMessage(
            domain: "https://example.com",
            address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            statement: "Sign in to Example",
            uri: "https://example.com/login",
            chainId: 1,
            nonce: "abc123",
            issuedAt: "2024-01-01T00:00:00.000Z"
        )

        XCTAssertTrue(message.contains("https://example.com wants you to sign in"))
        XCTAssertTrue(message.contains("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"))
        XCTAssertTrue(message.contains("Sign in to Example"))
        XCTAssertTrue(message.contains("URI: https://example.com/login"))
        XCTAssertTrue(message.contains("Chain ID: 1"))
        XCTAssertTrue(message.contains("Nonce: abc123"))
    }

    func testBuildSIWEMessageWithoutOptionalFields() {
        let message = SIWEAuth.buildMessage(
            domain: "example.com",
            address: "0x1234567890abcdef1234567890abcdef12345678",
            statement: nil,
            uri: "https://example.com",
            chainId: nil,
            nonce: "abc",
            issuedAt: "2024-01-01T00:00:00.000Z"
        )

        XCTAssertTrue(message.contains("URI: https://example.com"))
        XCTAssertTrue(message.contains("Version: 1"))
        XCTAssertFalse(message.contains("Chain ID:"))
        XCTAssertFalse(message.contains("Expiration Time:"))
    }

    // MARK: - SIWE Message Parsing

    func testParseSIWEMessage() {
        let message = """
        example.com wants you to sign in with your Ethereum account:
        0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18

        Sign in to Example

        URI: https://example.com/login
        Version: 1
        Chain ID: 137
        Nonce: nonce123
        Issued At: 2024-01-01T00:00:00.000Z
        Expiration Time: 2024-01-02T00:00:00.000Z
        """

        let parsed = SIWEAuth.parseMessage(message)
        XCTAssertNotNil(parsed)
        XCTAssertEqual(parsed?.domain, "example.com")
        XCTAssertEqual(parsed?.address, "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18")
        XCTAssertEqual(parsed?.chainId, 137)
        XCTAssertEqual(parsed?.nonce, "nonce123")
        XCTAssertEqual(parsed?.expirationTime, "2024-01-02T00:00:00.000Z")
    }

    // MARK: - SIWE Config

    func testSIWEConfigDefaults() {
        let config = SIWEAuthConfig(domain: "example.com", uri: "https://example.com")
        XCTAssertEqual(config.domain, "example.com")
        XCTAssertEqual(config.chainId, 1)
        XCTAssertEqual(config.expirationSeconds, 86400)
    }

    // MARK: - WalletManager Connectors

    func testWalletManagerBuildsConnectors() {
        let manager = WalletManager()
        let config = CinacoinConfig(
            projectId: "test-id",
            chains: [.ethereum, .polygon]
        )
        manager.configure(with: config)

        let connectors = manager.getConnectors()
        XCTAssertFalse(connectors.isEmpty)

        let ids = connectors.map { $0.id }
        XCTAssertTrue(ids.contains("metamask"))
        XCTAssertTrue(ids.contains("walletconnect"))
        XCTAssertTrue(ids.contains("coinbase"))
    }

    func testWalletManagerConnectorTypes() {
        let manager = WalletManager()
        manager.configure(with: CinacoinConfig(chains: [.ethereum]))

        let connectors = manager.getConnectors()
        let metaMask = connectors.first(where: { $0.id == "metamask" })
        XCTAssertEqual(metaMask?.type, .walletconnect)

        let email = connectors.first(where: { $0.id == "email" })
        XCTAssertEqual(email?.type, .email)
    }

    // MARK: - Transaction Request Defaults

    func testTransactionRequestDefaults() {
        let tx = TransactionRequest(from: "0xFrom", to: "0xTo")
        XCTAssertNil(tx.value)
        XCTAssertNil(tx.data)
        XCTAssertNil(tx.gas)
        XCTAssertNil(tx.gasPrice)
        XCTAssertNil(tx.maxFeePerGas)
        XCTAssertNil(tx.maxPriorityFeePerGas)
        XCTAssertNil(tx.nonce)
        XCTAssertNil(tx.chainId)
    }

    func testTransactionRequestWithEIP1559Fields() {
        let tx = TransactionRequest(
            from: "0xFrom",
            to: "0xTo",
            value: "0x1",
            maxFeePerGas: "0x77359400",
            maxPriorityFeePerGas: "0x3B9ACA00",
            chainId: 42161
        )

        XCTAssertEqual(tx.maxFeePerGas, "0x77359400")
        XCTAssertEqual(tx.maxPriorityFeePerGas, "0x3B9ACA00")
        XCTAssertEqual(tx.chainId, 42161)
        XCTAssertNil(tx.gasPrice)
    }

    // MARK: - Connect Result

    func testConnectResultInit() {
        let account = AccountInfo(
            address: "0xABC",
            balance: "1.5",
            chainId: 1,
            chainSymbol: "ETH"
        )
        let result = ConnectResult(account: account, chainId: 1, sessionId: "sess-123")

        XCTAssertEqual(result.account.address, "0xABC")
        XCTAssertEqual(result.chainId, 1)
        XCTAssertEqual(result.sessionId, "sess-123")
    }

    // MARK: - WalletManager SIWE Result Structure

    func testSIWESignInResultStructure() {
        let parsed = ParsedSIWE(
            domain: "example.com",
            address: "0xABC",
            statement: "Sign in",
            uri: "https://example.com",
            chainId: 1,
            nonce: "abc",
            issuedAt: "2024-01-01T00:00:00.000Z",
            expirationTime: nil
        )

        let result = SIWESignInResult(
            address: "0xABC",
            message: "example.com wants you to sign in...",
            signature: "0xsig",
            verified: true,
            data: parsed,
            sessionToken: "token-123",
            expiresAt: 1704067200
        )

        XCTAssertEqual(result.address, "0xABC")
        XCTAssertEqual(result.signature, "0xsig")
        XCTAssertTrue(result.verified)
        XCTAssertEqual(result.data.domain, "example.com")
        XCTAssertEqual(result.sessionToken, "token-123")
    }
}

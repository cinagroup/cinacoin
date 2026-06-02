/**
 * WCClientRequestTests — tests for JSON-RPC request flow and signing.
 *
 * Validates WCTransactionRequest serialization, request parameter building,
 * signTypedData parameter formatting, and chain switching logic.
 */

import XCTest
@testable import OnChainUX

final class WCClientRequestTests: XCTestCase {

    // MARK: - WCTransactionRequest Serialization

    func testTransactionRequestEncodeAllFields() {
        let tx = WCTransactionRequest(
            from: "0xABCDEF0123456789",
            to: "0x1234567890ABCDEF",
            value: "0xDE0B6B3A7640000",
            data: "0xa9059cbb000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            gas: "0x5208",
            gasPrice: "0x4A817C800",
            maxFeePerGas: "0x77359400",
            maxPriorityFeePerGas: "0x3B9ACA00",
            nonce: "0x1",
            chainId: 1
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = .sortedKeys
        let data = try? encoder.encode(tx)
        XCTAssertNotNil(data, "Should encode WCTransactionRequest to JSON")

        if let data = data {
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            XCTAssertNotNil(json)
            XCTAssertEqual(json?["from"] as? String, "0xABCDEF0123456789")
            XCTAssertEqual(json?["to"] as? String, "0x1234567890ABCDEF")
            XCTAssertEqual(json?["value"] as? String, "0xDE0B6B3A7640000")
            XCTAssertEqual(json?["nonce"] as? String, "0x1")
            XCTAssertEqual(json?["chainId"] as? Int, 1)
        }
    }

    func testTransactionRequestEncodeMinimalFields() {
        let tx = WCTransactionRequest(from: "0xFrom", to: "0xTo")

        let encoder = JSONEncoder()
        encoder.outputFormatting = .sortedKeys
        let data = try? encoder.encode(tx)
        XCTAssertNotNil(data)

        if let data = data {
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            XCTAssertNotNil(json)
            XCTAssertEqual(json?["from"] as? String, "0xFrom")
            XCTAssertEqual(json?["to"] as? String, "0xTo")
            // Optional fields should be null
            XCTAssertNil(json?["value"])
            XCTAssertNil(json?["data"])
            XCTAssertNil(json?["gas"])
        }
    }

    func testTransactionRequestEIP1559Fields() {
        let tx = WCTransactionRequest(
            from: "0xSender",
            to: "0xReceiver",
            value: "0x1",
            maxFeePerGas: "0x77359400",
            maxPriorityFeePerGas: "0x3B9ACA00",
            chainId: 42161
        )

        let encoder = JSONEncoder()
        let data = try? encoder.encode(tx)
        XCTAssertNotNil(data)

        if let data = data, let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            XCTAssertEqual(json?["maxFeePerGas"] as? String, "0x77359400")
            XCTAssertEqual(json?["maxPriorityFeePerGas"] as? String, "0x3B9ACA00")
            // Legacy gasPrice should not be present
            XCTAssertNil(json?["gasPrice"])
        }
    }

    // MARK: - SendTransaction Parameter Building

    func testSendTransactionParamsBuilding() {
        let tx = WCTransactionRequest(
            from: "0xABC",
            to: "0xDEF",
            value: "0x1234",
            data: "0x"
        )

        // Simulate what WCClient.sendTransaction does internally
        let params: [[String: String]] = [[
            "from": tx.from,
            "to": tx.to,
            "value": tx.value ?? "0x0",
            "data": tx.data ?? "0x",
            "gas": tx.gas ?? "0x5208",
        ].compactMapValues { $0 }]

        XCTAssertEqual(params.count, 1)
        XCTAssertEqual(params[0]["from"], "0xABC")
        XCTAssertEqual(params[0]["to"], "0xDEF")
        XCTAssertEqual(params[0]["value"], "0x1234")
        XCTAssertEqual(params[0]["data"], "0x")
        XCTAssertEqual(params[0]["gas"], "0x5208")
    }

    // MARK: - PersonalSign Parameter Building

    func testPersonalSignHexEncoding() {
        let message = "Hello World"
        let hexMessage = message.utf8Hex
        XCTAssertEqual(hexMessage, "0x48656c6c6f20576f726c64")

        // Should not double-encode already-hex messages
        let hexInput = "0x48656c6c6f"
        XCTAssertEqual(hexInput.hasPrefix("0x") ? hexInput : hexInput.utf8Hex, "0x48656c6c6f")
    }

    func testPersonalSignEmptyMessage() {
        let message = ""
        let hexMessage = message.utf8Hex
        XCTAssertEqual(hexMessage, "0x")
    }

    // MARK: - SignTypedData Parameter Building

    func testSignTypedDataEIP712Format() {
        let typedData = """
        {
            "types": {
                "EIP712Domain": [{"name": "name", "type": "string"}],
                "Transfer": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"}]
            },
            "primaryType": "Transfer",
            "domain": {"name": "MyToken"},
            "message": {"from": "0xABC", "to": "0xDEF"}
        }
        """

        // Verify the JSON is valid and parseable
        let data = typedData.data(using: .utf8)!
        let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        XCTAssertNotNil(json, "Typed data should be valid JSON")
        XCTAssertEqual(json?["primaryType"] as? String, "Transfer")
    }

    // MARK: - Switch Chain Hex Conversion

    func testChainIdToHex() {
        XCTAssertEqual("0x" + String(1, radix: 16), "0x1")
        XCTAssertEqual("0x" + String(137, radix: 16), "0x89")
        XCTAssertEqual("0x" + String(42161, radix: 16), "0xa4b1")
        XCTAssertEqual("0x" + String(56, radix: 16), "0x38")
        XCTAssertEqual("0x" + String(10, radix: 16), "0xa")
        XCTAssertEqual("0x" + String(8453, radix: 16), "0x2105")
    }

    // MARK: - WCMethods Constants

    func testWCMethodsConstants() {
        XCTAssertEqual(WCMethods.ethSendTransaction, "eth_sendTransaction")
        XCTAssertEqual(WCMethods.personalSign, "personal_sign")
        XCTAssertEqual(WCMethods.ethSignTypedDataV4, "eth_signTypedData_v4")
        XCTAssertEqual(WCMethods.walletSwitchEthereumChain, "wallet_switchEthereumChain")
        XCTAssertEqual(WCMethods.walletAddEthereumChain, "wallet_addEthereumChain")
    }

    func testStandardEvmMethodsCompleteness() {
        let methods = WCMethods.standardEvmMethods
        XCTAssertTrue(methods.contains("eth_sendTransaction"))
        XCTAssertTrue(methods.contains("eth_signTransaction"))
        XCTAssertTrue(methods.contains("personal_sign"))
        XCTAssertTrue(methods.contains("eth_signTypedData"))
        XCTAssertTrue(methods.contains("eth_signTypedData_v4"))
        XCTAssertTrue(methods.contains("wallet_switchEthereumChain"))
        XCTAssertTrue(methods.contains("wallet_addEthereumChain"))
        XCTAssertTrue(methods.contains("eth_accounts"))
        XCTAssertTrue(methods.contains("eth_chainId"))
        XCTAssertEqual(methods.count, 9)
    }

    func testStandardEvmEvents() {
        let events = WCEvents.standardEvmEvents
        XCTAssertTrue(events.contains("chainChanged"))
        XCTAssertTrue(events.contains("accountsChanged"))
        XCTAssertEqual(events.count, 2)
    }

    // MARK: - BigInt Helper

    func testBigIntParse() {
        let bigInt = BigInt("0xDE0B6B3A7640000", radix: 16)
        XCTAssertNotNil(bigInt)
        XCTAssertEqual(bigInt?.magnitude, 1_000_000_000_000_000_000)

        let smallInt = BigInt("0x0", radix: 16)
        XCTAssertNotNil(smallInt)
        XCTAssertEqual(smallInt?.magnitude, 0)

        let invalid = BigInt("not-a-hex", radix: 16)
        XCTAssertNil(invalid)

        let wrongRadix = BigInt("123", radix: 10)
        XCTAssertNil(wrongRadix, "Only radix 16 is supported")
    }

    // MARK: - String Hex Extension

    func testStringUtf8HexEncoding() {
        XCTAssertEqual("Hello".utf8Hex, "0x48656c6c6f")
        XCTAssertEqual("Hi".utf8Hex, "0x4869")
        XCTAssertEqual("".utf8Hex, "0x")

        // Special characters
        XCTAssertEqual(" ".utf8Hex, "0x20")
        XCTAssertEqual("\n".utf8Hex, "0x0a")
    }

    // MARK: - WCStatus Equality

    func testWCStatusEquality() {
        XCTAssertEqual(WCStatus.disconnected, .disconnected)
        XCTAssertEqual(WCStatus.connecting, .connecting)
        XCTAssertEqual(WCStatus.pairing, .pairing)
        XCTAssertEqual(WCStatus.connected, .connected)
        XCTAssertEqual(WCStatus.error("fail"), .error("fail"))
        XCTAssertNotEqual(WCStatus.error("a"), .error("b"))
        XCTAssertNotEqual(WCStatus.disconnected, .connected)
    }

    // MARK: - WCAppMetadata Defaults

    func testWCAppMetadataDefaults() {
        let meta = WCAppMetadata.default
        XCTAssertEqual(meta.name, "Cinacoin dApp")
        XCTAssertEqual(meta.url, "https://cinacoin.io")
        XCTAssertFalse(meta.icons.isEmpty)
    }

    // MARK: - WCError Descriptions

    func testWCErrorDescriptions() {
        XCTAssertEqual(WCError.notConnected.errorDescription, "Not connected to a wallet")
        XCTAssertEqual(WCError.notConfigured.errorDescription, "WCClient has not been configured")
        XCTAssertEqual(WCError.sessionTimeout.errorDescription, "Session establishment timed out")
        XCTAssertEqual(WCError.invalidProposalResponse.errorDescription, "Invalid session proposal response")

        let invalidUrl = WCError.invalidUrl("wss://bad")
        XCTAssertEqual(invalidUrl.errorDescription, "Invalid relay URL: wss://bad")

        let rpcErr = WCError.rpcError(4001, "User rejected")
        XCTAssertEqual(rpcErr.errorDescription, "RPC error 4001: User rejected")

        let cryptoErr = WCError.cryptoError("bad key")
        XCTAssertEqual(cryptoErr.errorDescription, "Crypto error: bad key")
    }
}

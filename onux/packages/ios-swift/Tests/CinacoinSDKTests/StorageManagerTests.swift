//
//  StorageManagerTests.swift
//  CinacoinSDKTests
//
//  Unit tests for Keychain-backed session storage.
//

import XCTest
@testable import CinacoinSDK

final class StorageManagerTests: XCTestCase {

    var storage: StorageManager!

    override func setUp() {
        super.setUp()
        // Use a unique service per test to avoid cross-test contamination.
        storage = StorageManager(
            service: "com.cinacoin.sdk.test.\(UUID().uuidString.prefix(8))",
            account: "test-session"
        )
    }

    override func tearDown() {
        try? storage.clearSession()
        storage = nil
        super.tearDown()
    }

    func testSaveAndLoadSession() throws {
        let session = SessionData(
            accounts: ["0xabc123"],
            chainId: 1,
            sessionId: "sess-1",
            connectorId: "metamask"
        )

        try storage.saveSession(session)
        let loaded = try storage.loadSession()

        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.accounts, ["0xabc123"])
        XCTAssertEqual(loaded?.chainId, 1)
        XCTAssertEqual(loaded?.sessionId, "sess-1")
        XCTAssertEqual(loaded?.connectorId, "metamask")
    }

    func testLoadSessionWhenEmpty() throws {
        let loaded = try storage.loadSession()
        XCTAssertNil(loaded)
    }

    func testClearSession() throws {
        let session = SessionData(
            accounts: ["0xabc"],
            chainId: 1,
            sessionId: "sess-2",
            connectorId: "walletconnect"
        )

        try storage.saveSession(session)
        try storage.clearSession()

        let loaded = try storage.loadSession()
        XCTAssertNil(loaded)
    }

    func testOverwriteSession() throws {
        let session1 = SessionData(
            accounts: ["0xold"],
            chainId: 1,
            sessionId: "old",
            connectorId: "old"
        )
        try storage.saveSession(session1)

        let session2 = SessionData(
            accounts: ["0xnew"],
            chainId: 137,
            sessionId: "new",
            connectorId: "new"
        )
        try storage.saveSession(session2)

        let loaded = try storage.loadSession()
        XCTAssertEqual(loaded?.accounts, ["0xnew"])
        XCTAssertEqual(loaded?.chainId, 137)
        XCTAssertEqual(loaded?.sessionId, "new")
    }

    func testSessionDataCodable() throws {
        let session = SessionData(
            accounts: ["0xtest", "0xtest2"],
            chainId: 10,
            sessionId: "codable-test",
            connectorId: "optimism",
            topic: "topic-123"
        )

        let data = try JSONEncoder().encode(session)
        let decoded = try JSONDecoder().decode(SessionData.self, from: data)

        XCTAssertEqual(decoded.accounts.count, 2)
        XCTAssertEqual(decoded.chainId, 10)
        XCTAssertEqual(decoded.topic, "topic-123")
    }
}

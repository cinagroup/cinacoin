//
//  ChainManagerTests.swift
//  CinacoinSDKTests
//
//  Unit tests for chain configuration and switching.
//

import XCTest
@testable import CinacoinSDK

final class ChainManagerTests: XCTestCase {

    func testWellKnownChainsExist() {
        XCTAssertEqual(ChainManager.ethereum.chainId, 1)
        XCTAssertEqual(ChainManager.polygon.chainId, 137)
        XCTAssertEqual(ChainManager.arbitrum.chainId, 42161)
        XCTAssertEqual(ChainManager.base.chainId, 8453)
        XCTAssertEqual(ChainManager.optimism.chainId, 10)
        XCTAssertEqual(ChainManager.bsc.chainId, 56)
    }

    func testAllChainsCount() {
        XCTAssertEqual(ChainManager.allChains.count, 6)
    }

    func testChainLookup() {
        let eth = ChainManager.chain(for: 1)
        XCTAssertNotNil(eth)
        XCTAssertEqual(eth?.name, "Ethereum")

        let polygon = ChainManager.chain(for: 137)
        XCTAssertNotNil(polygon)
        XCTAssertEqual(polygon?.symbol, "MATIC")
    }

    func testUnknownChainReturnsNil() {
        let unknown = ChainManager.chain(for: 99999)
        XCTAssertNil(unknown)
    }

    func testNamespaceString() {
        XCTAssertEqual(ChainManager.namespaceString(for: 1), "eip155:1")
        XCTAssertEqual(ChainManager.namespaceString(for: 137), "eip155:137")
    }

    func testSupportedNamespaces() {
        let namespaces = ChainManager.allChains.map { ChainManager.namespaceString(for: $0.chainId) }
        XCTAssertTrue(namespaces.contains("eip155:1"))
        XCTAssertTrue(namespaces.contains("eip155:137"))
        XCTAssertEqual(namespaces.count, 6)
    }

    func testIsSupported() {
        // Use static lookup as proxy for isSupported check
        XCTAssertTrue(ChainManager.chain(for: 1) != nil)
        XCTAssertTrue(ChainManager.chain(for: 42161) != nil)
        XCTAssertFalse(ChainManager.chain(for: 99999) != nil)
    }

    @MainActor
    func testSetActiveChainByChainId() throws {
        try ChainManager.shared.setActiveChain(chainId: 137)
        XCTAssertEqual(ChainManager.shared.activeChain.chainId, 137)
    }

    @MainActor
    func testSetActiveChainThrowsOnUnknown() {
        XCTAssertThrowsError(try ChainManager.shared.setActiveChain(chainId: 99999)) { error in
            guard case .chainNotSupported(let id) = error as? CinacoinError else {
                XCTFail("Wrong error type")
                return
            }
            XCTAssertEqual(id, 99999)
        }
    }

    @MainActor
    func testSetActiveChainDirectly() {
        ChainManager.shared.setActiveChain(.base)
        XCTAssertEqual(ChainManager.shared.activeChain.chainId, 8453)
    }
}

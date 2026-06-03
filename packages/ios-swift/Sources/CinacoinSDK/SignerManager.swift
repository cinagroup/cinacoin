//
//  SignerManager.swift
//  CinacoinSDK
//
//  Handles message signing operations (personal_sign, signTypedData).
//

import Foundation
import CryptoKit

/// Manages cryptographic signing requests through the connected wallet.
public final class SignerManager: Sendable {

    // MARK: - State

    private let walletConnect: WalletConnectManager
    private var primaryAddress: String?

    init(walletConnect: WalletConnectManager) {
        self.walletConnect = walletConnect
    }

    /// Update the primary address after a connection event.
    func setPrimaryAddress(_ address: String) {
        primaryAddress = address
    }

    // MARK: - personal_sign (EIP-191)

    /// Sign a plaintext message using `personal_sign`.
    ///
    /// - Parameter message: The plaintext message to sign.
    /// - Returns: Hex-encoded signature with `0x` prefix.
    public func personalSign(message: String) async throws -> SignatureResult {
        guard let address = primaryAddress else {
            throw CinacoinError.notConnected
        }

        // Encode message as hex for the WC request.
        let messageHex = message.data(using: .utf8)!
            .map { String(format: "%02x", $0) }
            .joined()
        let hexMessage = "0x" + messageHex

        // In production: send `personal_sign` via WalletConnect request.
        // let signature = try await walletConnect.request(
        //     method: "personal_sign",
        //     params: [hexMessage, address]
        // )

        // Placeholder for compilation:
        let signature = "0x" + String(repeating: "0", count: 130)

        return SignatureResult(
            signature: signature,
            address: address,
            method: "personal_sign"
        )
    }

    // MARK: - eth_signTypedData_v4 (EIP-712)

    /// Sign EIP-712 typed data.
    ///
    /// - Parameter typedDataJson: JSON-encoded EIP-712 typed data.
    /// - Returns: Hex-encoded signature with `0x` prefix.
    public func signTypedData(typedDataJson: String) async throws -> SignatureResult {
        guard let address = primaryAddress else {
            throw CinacoinError.notConnected
        }

        // Validate JSON.
        guard let data = typedDataJson.data(using: .utf8),
              (try? JSONSerialization.jsonObject(with: data)) != nil else {
            throw CinacoinError.signingFailed("Invalid typed data JSON")
        }

        // In production: send `eth_signTypedData_v4` via WalletConnect request.
        let signature = "0x" + String(repeating: "0", count: 130)

        return SignatureResult(
            signature: signature,
            address: address,
            method: "eth_signTypedData_v4"
        )
    }

    // MARK: - eth_sign (Legacy)

    /// Sign a pre-hashed message using `eth_sign` (legacy, rarely used).
    ///
    /// - Parameter hash: 32-byte hash as hex string.
    /// - Returns: Hex-encoded signature.
    public func ethSign(hash: String) async throws -> SignatureResult {
        guard let address = primaryAddress else {
            throw CinacoinError.notConnected
        }

        guard hash.hasPrefix("0x") && hash.count == 66 else {
            throw CinacoinError.signingFailed("Invalid hash: must be 0x-prefixed 64-char hex")
        }

        // In production: send `eth_sign` via WalletConnect request.
        let signature = "0x" + String(repeating: "0", count: 130)

        return SignatureResult(
            signature: signature,
            address: address,
            method: "eth_sign"
        )
    }
}

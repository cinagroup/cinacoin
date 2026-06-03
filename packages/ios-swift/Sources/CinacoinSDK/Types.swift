//
//  Types.swift
//  CinacoinSDK
//
//  Core types, enums, and error definitions for the Cinacoin iOS SDK.
//

import Foundation
import Combine

// MARK: - SDK Version

/// Current SDK version.
public let CINACOIN_SDK_VERSION = "1.0.0"

// MARK: - CinacoinError

/// Error cases surfaced by the Cinacoin SDK.
public enum CinacoinError: Error, LocalizedError, Equatable {
    case notInitialized
    case disposed
    case notConnected
    case chainNotSupported(Int)
    case walletNotFound(String)
    case connectionFailed(String)
    case userRejected
    case timeout
    case invalidAddress(String)
    case signingFailed(String)
    case transactionFailed(String)
    case keychainError(String)
    case networkUnavailable

    public var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "SDK not configured. Call configure() first."
        case .disposed:
            return "SDK has been disposed. Create a new instance."
        case .notConnected:
            return "No wallet is currently connected."
        case .chainNotSupported(let id):
            return "Chain \(id) is not supported."
        case .walletNotFound(let id):
            return "Wallet '\(id)' not found on this device."
        case .connectionFailed(let msg):
            return "Connection failed: \(msg)"
        case .userRejected:
            return "User rejected the request."
        case .timeout:
            return "Operation timed out."
        case .invalidAddress(let addr):
            return "Invalid address: \(addr)"
        case .signingFailed(let msg):
            return "Signing failed: \(msg)"
        case .transactionFailed(let msg):
            return "Transaction failed: \(msg)"
        case .keychainError(let msg):
            return "Keychain error: \(msg)"
        case .networkUnavailable:
            return "Network is unavailable."
        }
    }
}

// MARK: - ConnectionStatus

/// Connection lifecycle state.
public enum ConnectionStatus: Sendable, Equatable {
    case disconnected
    case connecting
    case connected
    case error(String)

    public static func == (lhs: ConnectionStatus, rhs: ConnectionStatus) -> Bool {
        switch (lhs, rhs) {
        case (.disconnected, .disconnected),
             (.connecting, .connecting),
             (.connected, .connected):
            return true
        case (.error(let l), .error(let r)):
            return l == r
        default:
            return false
        }
    }
}

// MARK: - ConnectionResult

/// Result returned after a successful wallet connection.
public struct ConnectionResult: Sendable {
    public let accounts: [String]
    public let chainId: Int
    public let sessionId: String
    public let connectorId: String

    public init(accounts: [String], chainId: Int, sessionId: String, connectorId: String) {
        self.accounts = accounts
        self.chainId = chainId
        self.sessionId = sessionId
        self.connectorId = connectorId
    }
}

// MARK: - TransactionRequest

/// Parameters for an EVM transaction.
public struct TransactionRequest: Sendable {
    public let from: String
    public let to: String
    public let value: String?          // Wei amount as hex string
    public let data: String?           // Calldata as hex string
    public let gas: String?
    public let gasPrice: String?
    public let maxFeePerGas: String?
    public let maxPriorityFeePerGas: String?
    public let nonce: String?
    public let chainId: Int?

    public init(
        from: String,
        to: String,
        value: String? = nil,
        data: String? = nil,
        gas: String? = nil,
        gasPrice: String? = nil,
        maxFeePerGas: String? = nil,
        maxPriorityFeePerGas: String? = nil,
        nonce: String? = nil,
        chainId: Int? = nil
    ) {
        self.from = from
        self.to = to
        self.value = value
        self.data = data
        self.gas = gas
        self.gasPrice = gasPrice
        self.maxFeePerGas = maxFeePerGas
        self.maxPriorityFeePerGas = maxPriorityFeePerGas
        self.nonce = nonce
        self.chainId = chainId
    }
}

// MARK: - SignatureResult

/// Result of a signing operation.
public struct SignatureResult: Sendable {
    public let signature: String    // Hex-encoded, 0x-prefixed
    public let address: String
    public let method: String       // e.g. "personal_sign", "eth_signTypedData_v4"

    public init(signature: String, address: String, method: String) {
        self.signature = signature
        self.address = address
        self.method = method
    }
}

// MARK: - AppMetadata

/// App metadata surfaced to wallets during WalletConnect pairing.
public struct AppMetadata: Sendable {
    public let name: String
    public let description: String
    public let url: String
    public let icons: [String]

    public init(name: String, description: String, url: String, icons: [String]) {
        self.name = name
        self.description = description
        self.url = url
        self.icons = icons
    }
}

// MARK: - WalletInfo

/// Information about a supported wallet application.
public struct WalletInfo: Sendable {
    public let id: String
    public let name: String
    public let iconUrl: String?
    public let deepLinkScheme: String?
    public let universalLinkDomain: String?
    public let appStoreUrl: String?
    public let playStoreUrl: String?
    public let supportedChains: [String]

    public init(
        id: String,
        name: String,
        iconUrl: String? = nil,
        deepLinkScheme: String? = nil,
        universalLinkDomain: String? = nil,
        appStoreUrl: String? = nil,
        playStoreUrl: String? = nil,
        supportedChains: [String] = ["eip155:1"]
    ) {
        self.id = id
        self.name = name
        self.iconUrl = iconUrl
        self.deepLinkScheme = deepLinkScheme
        self.universalLinkDomain = universalLinkDomain
        self.appStoreUrl = appStoreUrl
        self.playStoreUrl = playStoreUrl
        self.supportedChains = supportedChains
    }
}

// MARK: - CinacoinEvent

/// Union of all events emitted by the SDK.
public enum CinacoinEvent: Sendable {
    case configured
    case connected(accounts: [String], chainId: Int)
    case connecting(connectorId: String)
    case disconnected
    case chainChanged(chainId: Int)
    case accountsChanged(accounts: [String])
    case error(message: String)
    case sessionRestored(accounts: [String], chainId: Int)
}

// MARK: - ChainConfig

/// Configuration for an EVM-compatible chain.
public struct ChainConfig: Sendable, Identifiable {
    public let chainId: Int
    public let name: String
    public let symbol: String
    public let decimals: Int
    public let rpcUrl: String
    public let explorerUrl: String?
    public let nativeCurrencyName: String

    public var id: Int { chainId }

    public init(
        chainId: Int,
        name: String,
        symbol: String,
        decimals: Int = 18,
        rpcUrl: String,
        explorerUrl: String? = nil,
        nativeCurrencyName: String = "Ether"
    ) {
        self.chainId = chainId
        self.name = name
        self.symbol = symbol
        self.decimals = decimals
        self.rpcUrl = rpcUrl
        self.explorerUrl = explorerUrl
        self.nativeCurrencyName = nativeCurrencyName
    }

    /// Convert a wei amount string to a human-readable decimal string.
    public func weiToEther(wei: String) -> String? {
        guard let bigWei = Decimal(string: wei) else { return nil }
        let divisor = Decimal(pow(Decimal(10), decimals))
        return String(format: "%.\(decimals)f", (bigWei / divisor) as NSDecimalNumber as! Double)
    }
}

// MARK: - NetworkStatus

/// High-level network reachability state.
public enum NetworkStatus {
    case unknown
    case connected    // WiFi or cellular
    case disconnected
}

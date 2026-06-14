// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "OnChainUX",
    platforms: [
        .iOS(.v15),
        .macOS(.v12),
    ],
    products: [
        // MARK: - OnChainUX (UI components + WC integration)
        .library(
            name: "OnChainUX",
            targets: ["OnChainUX"]),
        // MARK: - CinacoinSDK (Core Wallet SDK — programmatic API)
        .library(
            name: "CinacoinSDK",
            targets: ["CinacoinSDK"]),
        // MARK: - CinacoinAppKitConfig (AppKit configuration module)
        .library(
            name: "CinacoinAppKitConfig",
            targets: ["CinacoinAppKitConfig"]),
        // MARK: - CinacoinAppKitUI (AppKit SwiftUI components)
        .library(
            name: "CinacoinAppKitUI",
            targets: ["CinacoinAppKitUI"]),
        // MARK: - CinacoinAppKitAuth (Social login, email login, session management)
        .library(
            name: "CinacoinAppKitAuth",
            targets: ["CinacoinAppKitAuth"]),
        // MARK: - CinacoinAppKitSmartAccount (ERC-4337 smart accounts)
        .library(
            name: "CinacoinAppKitSmartAccount",
            targets: ["CinacoinAppKitSmartAccount"]),
    ],
    dependencies: [
        .package(url: "https://github.com/WalletConnect/WalletConnectSwiftV2.git", exact: "1.13.0"),
    ],
    targets: [
        // MARK: - OnChainUX
        .target(
            name: "OnChainUX",
            dependencies: [
                .product(name: "WalletConnect", package: "WalletConnectSwiftV2"),
                .product(name: "WalletConnectNetworking", package: "WalletConnectSwiftV2"),
            ],
            path: "Sources/OnChainUX",
        ),
        .testTarget(
            name: "OnChainUXTests",
            dependencies: ["OnChainUX"],
            path: "Tests/OnChainUXTests"),

        // MARK: - CinacoinSDK
        .target(
            name: "CinacoinSDK",
            dependencies: [
                // WalletConnectSwiftV2 is declared as an optional dependency.
                // The SDK compiles without it (stubs for testing); production
                // apps should include the WC package.
                // .product(name: "WalletConnect", package: "WalletConnectSwiftV2"),
            ],
            path: "Sources/CinacoinSDK",
        ),
        .testTarget(
            name: "CinacoinSDKTests",
            dependencies: ["CinacoinSDK"],
            path: "Tests/CinacoinSDKTests"),

        // MARK: - CinacoinAppKitConfig
        .target(
            name: "CinacoinAppKitConfig",
            dependencies: [],
            path: "Sources/CinacoinAppKitConfig"
        ),

        // MARK: - CinacoinAppKitUI
        .target(
            name: "CinacoinAppKitUI",
            dependencies: ["CinacoinAppKitConfig"],
            path: "Sources/CinacoinAppKitUI"
        ),

        // MARK: - CinacoinAppKitAuth
        .target(
            name: "CinacoinAppKitAuth",
            dependencies: ["CinacoinAppKitConfig"],
            path: "Sources/CinacoinAppKitAuth"
        ),

        // MARK: - CinacoinAppKitSmartAccount
        .target(
            name: "CinacoinAppKitSmartAccount",
            dependencies: ["CinacoinAppKitConfig"],
            path: "Sources/CinacoinAppKitSmartAccount"
        ),
    ]
)

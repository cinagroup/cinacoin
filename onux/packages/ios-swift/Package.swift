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
            path: "Tests/CinacoinSDKTests")
    ]
)

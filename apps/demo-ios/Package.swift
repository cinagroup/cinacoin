// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CinacoinDemo",
    platforms: [.iOS(.v16)],
    products: [
        .library(name: "CinacoinDemo", targets: ["CinacoinDemo"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "CinacoinDemo",
            dependencies: [],
            path: "CinacoinDemo"
        ),
    ]
)

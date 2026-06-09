//
//  NetworkMonitor.swift
//  CinacoinSDK
//
//  Observes network reachability changes using NWPathMonitor.
//

import Foundation
import Combine
import Network

/// Lightweight network reachability observer.
/// Publishes `NetworkStatus` changes via Combine.
@MainActor
public final class NetworkMonitor: ObservableObject {

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "com.cinacoin.networkMonitor")

    @Published public private(set) var status: NetworkStatus = .unknown

    public var isOnline: Bool {
        status == .connected
    }

    public init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                switch path.status {
                case .satisfied:
                    self?.status = .connected
                case .unsatisfied, .requiresConnection:
                    self?.status = .disconnected
                @unknown default:
                    self?.status = .unknown
                }
            }
        }
    }

    /// Start monitoring.
    public func start() {
        monitor.start(queue: queue)
    }

    /// Stop monitoring.
    public func stop() {
        monitor.cancel()
    }
}

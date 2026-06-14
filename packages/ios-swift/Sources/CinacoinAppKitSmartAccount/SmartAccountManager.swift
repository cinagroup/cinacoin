import Foundation
import CinacoinAppKitConfig

/// ERC-4337 Smart Account Manager
public final class SmartAccountManager: ObservableObject, @unchecked Sendable {
    
    @Published public private(set) var smartAccountAddress: String?
    @Published public private(set) var isDeployed = false
    
    private let bundlerUrl: String
    private let entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
    
    public init(bundlerUrl: String = "https://bundler.cinacoin.com") {
        self.bundlerUrl = bundlerUrl
    }
    
    /// Create or get existing smart account
    public func getSmartAccount(ownerAddress: String, salt: UInt64 = 0) async throws -> String {
        // Compute counterfactual address
        let address = try await computeAddress(owner: ownerAddress, salt: salt)
        smartAccountAddress = address
        
        // Check if deployed
        isDeployed = try await checkDeployed(address: address)
        
        return address
    }
    
    /// Deploy the smart account
    public func deploy(ownerAddress: String, salt: UInt64 = 0) async throws -> String {
        let initCode = buildInitCode(owner: ownerAddress, salt: salt)
        
        let userOp = UserOperation(
            sender: try await computeAddress(owner: ownerAddress, salt: salt),
            nonce: 0,
            initCode: initCode,
            callData: Data(),
            callGasLimit: 500_000,
            verificationGasLimit: 500_000,
            preVerificationGas: 50_000,
            maxFeePerGas: 1_000_000_000,
            maxPriorityFeePerGas: 1_000_000_000,
            paymasterAndData: Data(),
            signature: Data()
        )
        
        let txHash = try await BundlerClient.sendUserOperation(
            userOp: userOp,
            entryPoint: entryPointAddress,
            bundlerUrl: bundlerUrl
        )
        
        isDeployed = true
        return txHash
    }
    
    /// Execute a transaction via the smart account
    public func execute(
        target: String,
        value: UInt256,
        data: Data,
        ownerAddress: String
    ) async throws -> String {
        guard let accountAddress = smartAccountAddress else {
            throw SmartAccountError.notInitialized
        }
        
        let callData = try encodeExecute(target: target, value: value, data: data)
        
        let userOp = UserOperation(
            sender: accountAddress,
            nonce: try await getNonce(address: accountAddress),
            initCode: Data(),
            callData: callData,
            callGasLimit: 500_000,
            verificationGasLimit: 500_000,
            preVerificationGas: 50_000,
            maxFeePerGas: 1_000_000_000,
            maxPriorityFeePerGas: 1_000_000_000,
            paymasterAndData: Data(),
            signature: Data() // To be signed by owner
        )
        
        return try await BundlerClient.sendUserOperation(
            userOp: userOp,
            entryPoint: entryPointAddress,
            bundlerUrl: bundlerUrl
        )
    }
    
    /// Batch execute multiple transactions
    public func executeBatch(
        targets: [String],
        values: [UInt256],
        datas: [Data],
        ownerAddress: String
    ) async throws -> String {
        guard targets.count == values.count, values.count == datas.count else {
            throw SmartAccountError.invalidBatch
        }
        
        let callData = try encodeExecuteBatch(targets: targets, values: values, datas: datas)
        
        guard let accountAddress = smartAccountAddress else {
            throw SmartAccountError.notInitialized
        }
        
        let userOp = UserOperation(
            sender: accountAddress,
            nonce: try await getNonce(address: accountAddress),
            initCode: Data(),
            callData: callData,
            callGasLimit: UInt64(500_000 * targets.count),
            verificationGasLimit: 500_000,
            preVerificationGas: 50_000,
            maxFeePerGas: 1_000_000_000,
            maxPriorityFeePerGas: 1_000_000_000,
            paymasterAndData: Data(),
            signature: Data()
        )
        
        return try await BundlerClient.sendUserOperation(
            userOp: userOp,
            entryPoint: entryPointAddress,
            bundlerUrl: bundlerUrl
        )
    }
    
    // MARK: - Private
    
    private let factoryAddress = "0x9406Cc6185a346906296840746125a0E44976454"
    
    private func computeAddress(owner: String, salt: UInt64) async throws -> String {
        // Build initCode
        let initCode = buildInitCode(owner: owner, salt: salt)
        
        // Encode salt as 32 bytes (big-endian)
        var saltBytes = withUnsafeBytes(of: salt.bigEndian) { Data($0) }
        let saltPadded = Data(repeating: 0, count: 32 - saltBytes.count) + saltBytes
        
        // CREATE2: keccak256(0xff + factory + salt + keccak256(initCode))
        return CryptoUtils.computeCreate2Address(
            factory: factoryAddress,
            salt: saltPadded,
            initCode: initCode
        )
    }
    
    private func checkDeployed(address: String) async throws -> Bool {
        // Check code at address via RPC
        // eth_getCode should return non-empty if deployed
        // TODO: Implement actual RPC call
        return false
    }
    
    private func buildInitCode(owner: String, salt: UInt64) -> Data {
        // factory.createAccount(address owner, uint256 salt)
        // Function selector: 0x5fbfb9cf
        let selector = Data([0x5f, 0xbf, 0xb9, 0xcf])
        
        // ABI encode parameters
        let ownerPadded = CryptoUtils.padAddress(owner)
        
        // Salt as uint256 (32 bytes)
        var saltBytes = withUnsafeBytes(of: salt.bigEndian) { Data($0) }
        let saltPadded = Data(repeating: 0, count: 32 - saltBytes.count) + saltBytes
        
        // initCode = factory address + encoded call
        let factoryData = CryptoUtils.hexToData(factoryAddress)
        
        return factoryData + selector + ownerPadded + saltPadded
    }
    
    private func encodeExecute(target: String, value: UInt256, data: Data) throws -> Data {
        // execute(address dest, uint256 value, bytes func)
        // Function selector: 0xb61d27f6
        let selector = Data([0xb6, 0x1d, 0x27, 0xf6])
        
        // ABI encode parameters
        let targetPadded = CryptoUtils.padAddress(target)
        let valuePadded = CryptoUtils.padUint256(value)
        
        // Dynamic bytes parameter: offset + length + data
        let offset = CryptoUtils.padUint256(UInt64(96)) // 3 * 32 bytes for fixed params
        let encodedData = CryptoUtils.abiEncodeBytes(data)
        
        return selector + targetPadded + valuePadded + offset + encodedData
    }
    
    private func encodeExecuteBatch(targets: [String], values: [UInt256], datas: [Data]) throws -> Data {
        // executeBatch(address[] dest, uint256[] value, bytes[] func)
        // Function selector: 0x47e1da2a
        let selector = Data([0x47, 0xe1, 0xda, 0x2a])
        
        // For batch, we need to encode arrays
        // This is simplified - full implementation would handle dynamic arrays properly
        // TODO: Implement full batch encoding with proper offset handling
        
        // Placeholder for now
        return selector
    }
    
    private func getNonce(address: String) async throws -> UInt64 {
        // Call entryPoint.getNonce(address, 0)
        // TODO: Implement actual RPC call to entry point
        return 0
    }
}

/// Smart account errors
public enum SmartAccountError: Error, LocalizedError {
    case notInitialized
    case invalidBatch
    case deploymentFailed
    case userOpFailed(String)
    
    public var errorDescription: String? {
        switch self {
        case .notInitialized: return "Smart account not initialized"
        case .invalidBatch: return "Invalid batch: arrays must have same length"
        case .deploymentFailed: return "Smart account deployment failed"
        case .userOpFailed(let msg): return "User operation failed: \(msg)"
        }
    }
}

/// Placeholder for UInt256
public typealias UInt256 = UInt64

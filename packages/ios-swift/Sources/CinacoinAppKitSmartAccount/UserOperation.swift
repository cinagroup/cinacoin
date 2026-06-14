import Foundation

/// ERC-4337 User Operation
public struct UserOperation: Codable, Sendable {
    public let sender: String
    public let nonce: UInt64
    public let initCode: Data
    public let callData: Data
    public let callGasLimit: UInt64
    public let verificationGasLimit: UInt64
    public let preVerificationGas: UInt64
    public let maxFeePerGas: UInt64
    public let maxPriorityFeePerGas: UInt64
    public let paymasterAndData: Data
    public let signature: Data
    
    public init(
        sender: String,
        nonce: UInt64,
        initCode: Data,
        callData: Data,
        callGasLimit: UInt64,
        verificationGasLimit: UInt64,
        preVerificationGas: UInt64,
        maxFeePerGas: UInt64,
        maxPriorityFeePerGas: UInt64,
        paymasterAndData: Data,
        signature: Data
    ) {
        self.sender = sender
        self.nonce = nonce
        self.initCode = initCode
        self.callData = callData
        self.callGasLimit = callGasLimit
        self.verificationGasLimit = verificationGasLimit
        self.preVerificationGas = preVerificationGas
        self.maxFeePerGas = maxFeePerGas
        self.maxPriorityFeePerGas = maxPriorityFeePerGas
        self.paymasterAndData = paymasterAndData
        self.signature = signature
    }
    
    /// Encode to hex string for RPC
    public func toHexParams() -> [String: String] {
        return [
            "sender": sender,
            "nonce": "0x\(String(nonce, radix: 16))",
            "initCode": initCode.hexString,
            "callData": callData.hexString,
            "callGasLimit": "0x\(String(callGasLimit, radix: 16))",
            "verificationGasLimit": "0x\(String(verificationGasLimit, radix: 16))",
            "preVerificationGas": "0x\(String(preVerificationGas, radix: 16))",
            "maxFeePerGas": "0x\(String(maxFeePerGas, radix: 16))",
            "maxPriorityFeePerGas": "0x\(String(maxPriorityFeePerGas, radix: 16))",
            "paymasterAndData": paymasterAndData.hexString,
            "signature": signature.hexString
        ]
    }
}

extension Data {
    var hexString: String {
        "0x" + map { String(format: "%02x", $0) }.joined()
    }
}

import Foundation

/// Cryptographic utilities for ERC-4337 smart account operations
public enum CryptoUtils {
    
    // MARK: - Keccak256
    
    /// Compute keccak256 hash using pure Swift implementation
    /// Keccak-256 (original) differs from SHA3-256 (FIPS 202) in padding
    public static func keccak256(_ data: Data) -> Data {
        return Data(Keccak256.hash(data))
    }
    
    /// Compute keccak256 hash of a string
    public static func keccak256(_ string: String) -> Data {
        return keccak256(Data(string.utf8))
    }
    
    // MARK: - Hex Conversion
    
    /// Convert hex string to Data
    public static func hexToData(_ hex: String) -> Data {
        var hex = hex
        if hex.hasPrefix("0x") || hex.hasPrefix("0X") {
            hex = String(hex.dropFirst(2))
        }
        
        // Pad to even length
        if hex.count % 2 != 0 {
            hex = "0" + hex
        }
        
        var data = Data()
        var index = hex.startIndex
        while index < hex.endIndex {
            let nextIndex = hex.index(index, offsetBy: 2)
            let byteString = hex[index..<nextIndex]
            if let byte = UInt8(byteString, radix: 16) {
                data.append(byte)
            }
            index = nextIndex
        }
        return data
    }
    
    /// Convert Data to hex string
    public static func dataToHex(_ data: Data, prefix: Bool = true) -> String {
        let hex = data.map { String(format: "%02x", $0) }.joined()
        return prefix ? "0x" + hex : hex
    }
    
    // MARK: - ABI Encoding
    
    /// Pad address to 32 bytes (left-padded with zeros)
    public static func padAddress(_ address: String) -> Data {
        let addressData = hexToData(address)
        // Address should be 20 bytes, pad to 32 bytes
        let padding = Data(repeating: 0, count: 32 - addressData.count)
        return padding + addressData
    }
    
    /// Pad uint256 to 32 bytes (big-endian)
    public static func padUint256(_ value: UInt64) -> Data {
        var bytes = withUnsafeBytes(of: value.bigEndian) { Data($0) }
        // Pad to 32 bytes
        let padding = Data(repeating: 0, count: 32 - bytes.count)
        return padding + bytes
    }
    
    /// Pad uint256 (from Data) to 32 bytes
    public static func padUint256(data: Data) -> Data {
        if data.count >= 32 {
            return data.suffix(32)
        }
        let padding = Data(repeating: 0, count: 32 - data.count)
        return padding + data
    }
    
    /// Encode bytes (dynamic type) for ABI
    public static func abiEncodeBytes(_ data: Data) -> Data {
        // Length prefix (32 bytes) + padded data
        let length = padUint256(UInt64(data.count))
        let paddedLength = ((data.count + 31) / 32) * 32
        let paddedData = data + Data(repeating: 0, count: paddedLength - data.count)
        return length + paddedData
    }
    
    /// Encode function call with parameters
    /// Format: selector (4 bytes) + encoded parameters
    public static func encodeFunctionCall(selector: Data, parameters: [Data]) -> Data {
        var result = selector
        for param in parameters {
            result += param
        }
        return result
    }
    
    /// Get function selector (first 4 bytes of keccak256 of signature)
    public static func functionSelector(_ signature: String) -> Data {
        let hash = keccak256(signature)
        return hash.prefix(4)
    }
    
    // MARK: - CREATE2
    
    /// Compute CREATE2 address
    /// address = keccak256(0xff + factory + salt + keccak256(initCode))[12:]
    public static func computeCreate2Address(
        factory: String,
        salt: Data,
        initCode: Data
    ) -> String {
        let factoryData = hexToData(factory)
        let initCodeHash = keccak256(initCode)
        
        // 0xff + factory (20 bytes) + salt (32 bytes) + initCodeHash (32 bytes)
        var data = Data([0xff])
        data += factoryData
        data += salt
        data += initCodeHash
        
        let hash = keccak256(data)
        let addressBytes = hash.suffix(20)
        
        return dataToHex(addressBytes)
    }
}

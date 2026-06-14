import Foundation

/// JSON-RPC client for ERC-4337 bundler
public final class BundlerClient: @unchecked Sendable {
    
    /// Send user operation to bundler
    public static func sendUserOperation(
        userOp: UserOperation,
        entryPoint: String,
        bundlerUrl: String
    ) async throws -> String {
        let params: [Any] = [
            userOp.toHexParams(),
            entryPoint
        ]
        
        let response = try await sendRPC(
            url: bundlerUrl,
            method: "eth_sendUserOperation",
            params: params
        )
        
        guard let txHash = response as? String else {
            throw SmartAccountError.userOpFailed("Invalid response")
        }
        
        return txHash
    }
    
    /// Get user operation receipt
    public static func getUserOperationReceipt(
        userOpHash: String,
        bundlerUrl: String
    ) async throws -> [String: Any] {
        let response = try await sendRPC(
            url: bundlerUrl,
            method: "eth_getUserOperationReceipt",
            params: [userOpHash]
        )
        
        guard let receipt = response as? [String: Any] else {
            throw SmartAccountError.userOpFailed("Invalid receipt")
        }
        
        return receipt
    }
    
    /// Estimate user operation gas
    public static func estimateUserOperationGas(
        userOp: UserOperation,
        entryPoint: String,
        bundlerUrl: String
    ) async throws -> (callGasLimit: UInt64, verificationGasLimit: UInt64, preVerificationGas: UInt64) {
        let response = try await sendRPC(
            url: bundlerUrl,
            method: "eth_estimateUserOperationGas",
            params: [userOp.toHexParams(), entryPoint]
        )
        
        guard let gas = response as? [String: String] else {
            throw SmartAccountError.userOpFailed("Invalid gas estimate")
        }
        
        let callGas = UInt64(gas["callGasLimit"]?.replacingOccurrences(of: "0x", with: "") ?? "0", radix: 16) ?? 0
        let verificationGas = UInt64(gas["verificationGasLimit"]?.replacingOccurrences(of: "0x", with: "") ?? "0", radix: 16) ?? 0
        let preVerificationGas = UInt64(gas["preVerificationGas"]?.replacingOccurrences(of: "0x", with: "") ?? "0", radix: 16) ?? 0
        
        return (callGas, verificationGas, preVerificationGas)
    }
    
    /// Get supported entry points
    public static func getSupportedEntryPoints(
        bundlerUrl: String
    ) async throws -> [String] {
        let response = try await sendRPC(
            url: bundlerUrl,
            method: "eth_supportedEntryPoints",
            params: []
        )
        
        guard let entryPoints = response as? [String] else {
            throw SmartAccountError.userOpFailed("Invalid response")
        }
        
        return entryPoints
    }
    
    // MARK: - Private
    
    private static func sendRPC(
        url: String,
        method: String,
        params: [Any]
    ) async throws -> Any {
        guard let requestURL = URL(string: url) else {
            throw SmartAccountError.userOpFailed("Invalid URL: \(url)")
        }
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw SmartAccountError.userOpFailed("RPC request failed")
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let result = json["result"] else {
            if let json = json,
               let error = json["error"] as? [String: Any],
               let message = error["message"] as? String {
                throw SmartAccountError.userOpFailed(message)
            }
            throw SmartAccountError.userOpFailed("Invalid RPC response")
        }
        
        return result
    }
}

import SwiftUI
import CinacoinAppKitSmartAccount

struct SmartAccountView: View {
    @StateObject private var manager = SmartAccountManager()
    @State private var ownerAddress = "0x1234567890abcdef1234567890abcdef12345678"
    @State private var isLoading = false
    @State private var infoMessage: String?
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Status
                    VStack(spacing: 8) {
                        Image(systemName: manager.smartAccountAddress != nil ? "creditcard.fill" : "creditcard")
                            .font(.system(size: 48))
                            .foregroundColor(manager.smartAccountAddress != nil ? .blue : .secondary)
                        
                        Text(manager.smartAccountAddress != nil ? "Smart Account Ready" : "No Smart Account")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        if let address = manager.smartAccountAddress {
                            Text(shorten(address))
                                .font(.system(.body, design: .monospaced))
                                .foregroundColor(.secondary)
                            
                            Text(manager.isDeployed ? "✅ Deployed" : "⏳ Not deployed")
                                .font(.caption)
                                .foregroundColor(manager.isDeployed ? .green : .orange)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(16)
                    
                    // Owner Address
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Owner Address (EOA)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        TextField("0x...", text: $ownerAddress)
                            .textFieldStyle(.roundedBorder)
                            .font(.system(.body, design: .monospaced))
                    }
                    
                    // Actions
                    HStack {
                        Button("Create") { Task { await createAccount() } }
                            .buttonStyle(.borderedProminent)
                            .disabled(isLoading)
                        
                        Button("Deploy") { Task { await deployAccount() } }
                            .buttonStyle(.bordered)
                            .disabled(isLoading || manager.smartAccountAddress == nil)
                    }
                    
                    // Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("About Smart Accounts")
                            .font(.headline)
                        Text("""
                        ERC-4337 Smart Accounts provide:
                        • Gasless transactions (paymaster)
                        • Batch transactions in a single UserOp
                        • Social recovery mechanisms
                        • Custom validation logic
                        
                        The account is deployed counterfactually — only created on-chain when the first transaction is sent.
                        """)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(16)
                    
                    if let info = infoMessage {
                        Text(info).foregroundColor(.blue).font(.caption)
                    }
                    if let error = errorMessage {
                        Text(error).foregroundColor(.red).font(.caption)
                    }
                }
                .padding()
            }
            .navigationTitle("Smart Account")
        }
    }
    
    func createAccount() async {
        isLoading = true
        errorMessage = nil
        do {
            let address = try await manager.getSmartAccount(ownerAddress: ownerAddress)
            infoMessage = "Created: \(shorten(address))"
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func deployAccount() async {
        isLoading = true
        errorMessage = nil
        do {
            let txHash = try await manager.deploy(ownerAddress: ownerAddress)
            infoMessage = "Deployed! TX: \(shorten(txHash))"
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func shorten(_ s: String) -> String {
        guard s.count > 16 else { return s }
        return "\(s.prefix(8))...\(s.suffix(6))"
    }
}

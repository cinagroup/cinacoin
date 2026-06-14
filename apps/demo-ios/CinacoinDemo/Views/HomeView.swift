import SwiftUI
import CinacoinAppKitConfig

struct HomeView: View {
    @State private var isConnected = false
    @State private var address = ""
    @State private var selectedChainId = 1
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Status Card
                    VStack(spacing: 8) {
                        Image(systemName: isConnected ? "checkmark.circle.fill" : "xmark.circle")
                            .font(.system(size: 48))
                            .foregroundColor(isConnected ? .green : .secondary)
                        
                        Text(isConnected ? "Connected" : "Not Connected")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        if isConnected {
                            Text(address)
                                .font(.system(.body, design: .monospaced))
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(16)
                    
                    // Quick Actions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick Actions")
                            .font(.headline)
                        
                        HStack(spacing: 12) {
                            ActionChip(icon: "qrcode.viewfinder", label: "Scan") {}
                            ActionChip(icon: "paperplane", label: "Send") {}
                            ActionChip(icon: "arrow.triangle.swap", label: "Swap") {}
                            ActionChip(icon: "arrow.clockwise", label: "Refresh") {}
                        }
                    }
                    
                    // SDK Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("SDK Information")
                            .font(.headline)
                        
                        InfoRow(label: "SDK", value: "Cinacoin iOS v1.0.0")
                        InfoRow(label: "Chains", value: "\(ChainRegistry.allEVMChains.count) EVM chains")
                        InfoRow(label: "Wallets", value: "\(WalletRegistry.recommended.count) recommended")
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(16)
                }
                .padding()
            }
            .navigationTitle("Cinacoin Demo")
        }
    }
}

struct ActionChip: View {
    let icon: String
    let label: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                Text(label)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)
            .cornerRadius(12)
        }
    }
}

struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .font(.subheadline)
    }
}

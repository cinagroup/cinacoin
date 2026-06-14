import SwiftUI
import CinacoinAppKitUI
import CinacoinAppKitConfig

struct ConnectView: View {
    @State private var showConnectSheet = false
    @State private var selectedChainId = 1
    @State private var isConnected = false
    @State private var address = "0x1234567890abcdef1234567890abcdef12345678"
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Connect Button
                    CinacoinConnectButton(style: .default) {
                        showConnectSheet = true
                    }
                    
                    // Account Card (when connected)
                    if isConnected {
                        CinacoinAccountCard(
                            address: address,
                            chainId: selectedChainId,
                            onDisconnect: {
                                isConnected = false
                            }
                        )
                    }
                    
                    // Chain Selector
                    HStack {
                        Text("Active Chain:")
                            .foregroundColor(.secondary)
                        Spacer()
                        CinacoinChainSelector(selectedChainId: $selectedChainId)
                    }
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(12)
                    
                    // Supported Chains
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Supported Chains")
                            .font(.headline)
                        
                        ForEach(ChainRegistry.allEVMChains) { chain in
                            HStack {
                                AsyncImage(url: URL(string: chain.iconUrl ?? "")) { image in
                                    image.resizable().aspectRatio(contentMode: .fit)
                                } placeholder: {
                                    Circle().fill(.secondary).frame(width: 24, height: 24)
                                }
                                .frame(width: 24, height: 24)
                                .clipShape(Circle())
                                
                                VStack(alignment: .leading) {
                                    Text(chain.name)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                    Text("Chain ID: \(chain.chainId)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                Text(chain.symbol)
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(.ultraThinMaterial)
                                    .cornerRadius(8)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(16)
                }
                .padding()
            }
            .navigationTitle("Connect")
            .sheet(isPresented: $showConnectSheet) {
                CinacoinConnectSheet(isPresented: $showConnectSheet) { wallet in
                    print("Selected: \(wallet.name)")
                    isConnected = true
                }
            }
        }
    }
}

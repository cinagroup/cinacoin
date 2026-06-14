import SwiftUI
import CinacoinAppKitConfig

struct ChainView: View {
    @State private var selectedChainId = 1
    
    var body: some View {
        NavigationStack {
            List {
                Section("Active Chain") {
                    CinacoinChainSelector(selectedChainId: $selectedChainId)
                }
                
                Section("Supported Chains (\(ChainRegistry.allEVMChains.count))") {
                    ForEach(ChainRegistry.allEVMChains) { chain in
                        HStack {
                            AsyncImage(url: URL(string: chain.iconUrl ?? "")) { image in
                                image.resizable().aspectRatio(contentMode: .fit)
                            } placeholder: {
                                Circle().fill(.secondary)
                            }
                            .frame(width: 32, height: 32)
                            .clipShape(Circle())
                            
                            VStack(alignment: .leading) {
                                Text(chain.name)
                                    .fontWeight(.medium)
                                Text("Chain ID: \(chain.chainId)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text(chain.symbol)
                                    .fontWeight(.semibold)
                                if chain.testnet {
                                    Text("TESTNET")
                                        .font(.caption2)
                                        .foregroundColor(.orange)
                                }
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            selectedChainId = chain.chainId
                        }
                    }
                }
                
                Section("Wallet Registry") {
                    ForEach(WalletRegistry.recommended, id: \.id) { wallet in
                        HStack {
                            AsyncImage(url: URL(string: wallet.iconUrl ?? "")) { image in
                                image.resizable().aspectRatio(contentMode: .fit)
                            } placeholder: {
                                Circle().fill(.secondary)
                            }
                            .frame(width: 32, height: 32)
                            .clipShape(Circle())
                            
                            VStack(alignment: .leading) {
                                Text(wallet.name)
                                    .fontWeight(.medium)
                                Text(wallet.id)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Chains")
        }
    }
}

import SwiftUI
import CinacoinAppKitConfig

/// Chain selector dropdown
public struct CinacoinChainSelector: View {
    
    @Environment(\.colorScheme) private var colorScheme
    
    @Binding var selectedChainId: Int
    let chains: [ChainConfig]
    
    public init(
        selectedChainId: Binding<Int>,
        chains: [ChainConfig] = ChainRegistry.allEVMChains
    ) {
        self._selectedChainId = selectedChainId
        self.chains = chains
    }
    
    public var body: some View {
        let theme = colorScheme == .dark ? CinacoinTheme.dark : CinacoinTheme.light
        let selectedChain = chains.first { $0.chainId == selectedChainId }
        
        Menu {
            ForEach(chains, id: \.chainId) { chain in
                Button(action: { selectedChainId = chain.chainId }) {
                    HStack {
                        Text(chain.name)
                        if chain.chainId == selectedChainId {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: 8) {
                if let chain = selectedChain {
                    AsyncImage(url: URL(string: chain.iconUrl ?? "")) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } placeholder: {
                        Circle()
                            .fill(theme.primary)
                    }
                    .frame(width: 20, height: 20)
                    .clipShape(Circle())
                    
                    Text(chain.shortName.uppercased())
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(theme.text)
                }
                
                Image(systemName: "chevron.down")
                    .font(.system(size: 12))
                    .foregroundColor(theme.textSecondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(theme.surface)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(theme.border, lineWidth: 1)
            )
        }
    }
}

#Preview {
    CinacoinChainSelector(selectedChainId: .constant(1))
        .padding()
}

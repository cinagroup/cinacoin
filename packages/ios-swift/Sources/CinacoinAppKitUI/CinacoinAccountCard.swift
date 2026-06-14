import SwiftUI
import CinacoinAppKitConfig

/// Card displaying connected wallet account info
public struct CinacoinAccountCard: View {
    
    @Environment(\.colorScheme) private var colorScheme
    
    let address: String
    let chainId: Int?
    let onDisconnect: () -> Void
    
    public init(
        address: String,
        chainId: Int? = nil,
        onDisconnect: @escaping () -> Void = {}
    ) {
        self.address = address
        self.chainId = chainId
        self.onDisconnect = onDisconnect
    }
    
    public var body: some View {
        let theme = colorScheme == .dark ? CinacoinTheme.dark : CinacoinTheme.light
        let chain = chainId.flatMap { ChainRegistry.shared.chain(for: $0) }
        
        VStack(spacing: 12) {
            HStack {
                // Address
                VStack(alignment: .leading, spacing: 4) {
                    Text(shortenAddress(address))
                        .font(.system(size: 16, weight: .semibold, design: .monospaced))
                        .foregroundColor(theme.text)
                    
                    if let chain = chain {
                        Text(chain.name)
                            .font(.system(size: 12))
                            .foregroundColor(theme.textSecondary)
                    }
                }
                
                Spacer()
                
                // Disconnect Button
                Button(action: onDisconnect) {
                    Image(systemName: "arrow.right.square")
                        .font(.system(size: 20))
                        .foregroundColor(theme.textSecondary)
                }
            }
        }
        .padding(16)
        .background(theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(theme.border, lineWidth: 1)
        )
    }
    
    private func shortenAddress(_ address: String) -> String {
        guard address.count > 10 else { return address }
        let prefix = address.prefix(6)
        let suffix = address.suffix(4)
        return "\(prefix)...\(suffix)"
    }
}

#Preview {
    CinacoinAccountCard(
        address: "0x1234567890abcdef1234567890abcdef12345678",
        chainId: 1
    )
    .padding()
}

import SwiftUI
import CinacoinAppKitConfig

/// Cinacoin branded wallet connection sheet
public struct CinacoinConnectSheet: View {
    
    @Environment(\.colorScheme) private var colorScheme
    @Binding var isPresented: Bool
    
    private let onWalletSelect: (WalletConfig) -> Void
    
    public init(
        isPresented: Binding<Bool>,
        onWalletSelect: @escaping (WalletConfig) -> Void = { _ in }
    ) {
        self._isPresented = isPresented
        self.onWalletSelect = onWalletSelect
    }
    
    public var body: some View {
        let theme = colorScheme == .dark ? CinacoinTheme.dark : CinacoinTheme.light
        
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Connect Wallet")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(theme.text)
                Spacer()
                Button(action: { isPresented = false }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(theme.textSecondary)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            
            Divider()
                .background(theme.border)
            
            // Wallet List
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(WalletRegistry.recommended, id: \.id) { wallet in
                        WalletRow(
                            wallet: wallet,
                            theme: theme,
                            onSelect: {
                                onWalletSelect(wallet)
                                isPresented = false
                            }
                        )
                    }
                }
                .padding(16)
            }
            
            // Footer
            VStack(spacing: 12) {
                Text("By connecting, you agree to our Terms of Service")
                    .font(.system(size: 12))
                    .foregroundColor(theme.textSecondary)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .background(theme.surface)
        }
        .background(theme.background)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .presentationDetents([.medium, .large])
    }
}

private struct WalletRow: View {
    let wallet: WalletConfig
    let theme: CinacoinTheme
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                // Wallet Icon
                AsyncImage(url: URL(string: wallet.iconUrl ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } placeholder: {
                    Circle()
                        .fill(theme.surface)
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                
                // Wallet Name
                Text(wallet.name)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(theme.text)
                
                Spacer()
                
                // Chevron
                Image(systemName: "chevron.right")
                    .font(.system(size: 14))
                    .foregroundColor(theme.textSecondary)
            }
            .padding(12)
            .background(theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    CinacoinConnectSheet(isPresented: .constant(true))
}

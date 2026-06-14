import SwiftUI
import CinacoinAppKitConfig

/// Cinacoin branded connect wallet button
public struct CinacoinConnectButton: View {
    
    @Environment(\.colorScheme) private var colorScheme
    
    private let style: ButtonStyle
    private let action: () -> Void
    
    public enum ButtonStyle {
        case `default`
        case outline
        case minimal
    }
    
    public init(
        style: ButtonStyle = .default,
        action: @escaping () -> Void = {}
    ) {
        self.style = style
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: "wallet.pass")
                    .font(.system(size: 16, weight: .medium))
                Text("Connect Wallet")
                    .font(.system(size: 16, weight: .semibold))
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
        }
        .buttonStyle(.plain)
    }
    
    private var backgroundColor: Color {
        let theme = colorScheme == .dark ? CinacoinTheme.dark : CinacoinTheme.light
        switch style {
        case .default:
            return theme.primary
        case .outline, .minimal:
            return .clear
        }
    }
    
    private var foregroundColor: Color {
        let theme = colorScheme == .dark ? CinacoinTheme.dark : CinacoinTheme.light
        switch style {
        case .default:
            return .white
        case .outline, .minimal:
            return theme.text
        }
    }
    
    private var borderColor: Color {
        let theme = colorScheme == .dark ? CinacoinTheme.dark : CinacoinTheme.light
        switch style {
        case .default:
            return .clear
        case .outline:
            return theme.border
        case .minimal:
            return .clear
        }
    }
    
    private var borderWidth: CGFloat {
        style == .outline ? 1 : 0
    }
}

#Preview {
    VStack(spacing: 16) {
        CinacoinConnectButton(style: .default)
        CinacoinConnectButton(style: .outline)
        CinacoinConnectButton(style: .minimal)
    }
    .padding()
}

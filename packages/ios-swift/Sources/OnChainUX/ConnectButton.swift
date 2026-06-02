/**
 * ConnectButton — SwiftUI component with multi-state & theme system.
 *
 * A drop-in wallet connection button that adapts its appearance based on
 * connection state. Shows "Connect Wallet" when disconnected, displays
 * the connected address when connected, shows a loading spinner
 * while connecting, and shows error state with retry option.
 *
 * ## Usage
 * ```swift
 * ConnectButton(label: "Connect Wallet")
 * ConnectButton(size: .large, showBalance: true, showAvatar: true)
 * ConnectButton(variant: .secondary) // bordered style
 * ```
 */

import SwiftUI

/// Button size preset.
public enum ButtonSize: String, CaseIterable {
    case small = "sm"
    case medium = "md"
    case large = "lg"

    var height: CGFloat {
        switch self {
        case .small: return 36
        case .medium: return 44
        case .large: return 52
        }
    }

    var horizontalPadding: CGFloat {
        switch self {
        case .small: return 16
        case .medium: return 24
        case .large: return 32
        }
    }

    var fontSize: CGFloat {
        switch self {
        case .small: return 12
        case .medium: return 14
        case .large: return 16
        }
    }
}

/// Visual variant of the button.
public enum ButtonVariant: String, CaseIterable {
    case primary
    case secondary
    case ghost
}

/// SwiftUI Connect Button component.
public struct ConnectButton: View {
    @EnvironmentObject private var onChainUX: Cinacoin

    /// Button text when disconnected.
    public var label: String
    /// Button visual variant.
    public var variant: ButtonVariant
    /// Button size.
    public var size: ButtonSize
    /// Show account balance when connected.
    public var showBalance: Bool
    /// Show avatar indicator when connected.
    public var showAvatar: Bool
    /// Show network badge when connected.
    public var showNetwork: Bool
    /// Click handler.
    public var onPress: (() -> Void)?
    /// Disconnect handler.
    public var onDisconnect: (() -> Void)?

    /// Create a ConnectButton with default settings.
    public init(
        label: String = "Connect Wallet",
        variant: ButtonVariant = .primary,
        size: ButtonSize = .medium,
        showBalance: Bool = false,
        showAvatar: Bool = false,
        showNetwork: Bool = false,
        onPress: (() -> Void)? = nil,
        onDisconnect: (() -> Void)? = nil
    ) {
        self.label = label
        self.variant = variant
        self.size = size
        self.showBalance = showBalance
        self.showAvatar = showAvatar
        self.showNetwork = showNetwork
        self.onPress = onPress
        self.onDisconnect = onDisconnect
    }

    public var body: some View {
        Button(action: handlePress) {
            Group {
                switch onChainUX.status {
                case .connecting:
                    connectingView
                case .connected:
                    connectedView
                case .error(let message):
                    errorView(message)
                case .disconnected:
                    disconnectedView
                }
            }
        }
        .frame(height: size.height)
        .padding(.horizontal, size.horizontalPadding)
        .background(buttonBackgroundColor)
        .cornerRadius(24)
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(borderColor, lineWidth: needsBorder ? 1 : 0)
        )
        .disabled(onChainUX.status == .connecting)
        .accessibilityLabel(accessibilityLabel)
    }

    // MARK: - Sub-views per state

    private var disconnectedView: some View {
        Text(label)
            .foregroundColor(buttonForegroundColor)
            .font(.system(size: size.fontSize, weight: .semibold))
    }

    private var connectingView: some View {
        HStack(spacing: 8) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: buttonForegroundColor))
            Text("Connecting...")
                .foregroundColor(buttonForegroundColor)
                .font(.system(size: size.fontSize, weight: .medium))
        }
    }

    @ViewBuilder
    private func connectedView(account: AccountInfo) -> some View {
        HStack(spacing: 8) {
            if showAvatar {
                Circle()
                    .fill(buttonForegroundColor)
                    .frame(width: size.fontSize, height: size.fontSize)
            }
            Text(truncateAddress(account.address))
                .font(.system(size: size.fontSize, weight: .medium, design: .monospaced))
                .foregroundColor(buttonForegroundColor)
            if showBalance {
                Text("\(account.balance) \(account.chainSymbol)")
                    .font(.system(size: size.fontSize - 2, weight: .regular))
                    .foregroundColor(onChainUX.themeColors.secondaryColor)
            }
            if showNetwork {
                NetworkBadge(chainId: account.chainId)
            }
        }
    }

    @ViewBuilder
    private func errorView(_ message: String) -> some View {
        HStack(spacing: 6) {
            Text("❌")
            Text("Error")
                .foregroundColor(onChainUX.themeColors.errorColor)
                .font(.system(size: size.fontSize, weight: .semibold))
        }
    }

    // MARK: - Styling

    private var buttonBackgroundColor: Color {
        let colors = onChainUX.themeColors
        switch onChainUX.status {
        case .connected:
            return Color(hex: colors.bgCard)
        case .error:
            return Color(hex: colors.error).opacity(0.15)
        case .connecting:
            return Color(hex: colors.accent500)
        case .disconnected:
            switch variant {
            case .primary: return Color(hex: colors.accent500)
            case .secondary: return Color(hex: colors.bgCard)
            case .ghost: return Color.clear
            }
        }
    }

    private var buttonForegroundColor: Color {
        let colors = onChainUX.themeColors
        switch onChainUX.status {
        case .connected:
            return Color(hex: colors.textPrimary)
        case .error:
            return Color(hex: colors.error)
        case .connecting:
            return .white
        case .disconnected:
            switch variant {
            case .primary: return .white
            case .secondary: return Color(hex: colors.textPrimary)
            case .ghost: return Color(hex: colors.textPrimary)
            }
        }
    }

    private var borderColor: Color {
        switch (onChainUX.status, variant) {
        case (.connected, _), (_, .secondary):
            return Color(hex: onChainUX.themeColors.border)
        default:
            return .clear
        }
    }

    private var needsBorder: Bool {
        switch (onChainUX.status, variant) {
        case (.connected, _), (_, .secondary):
            return true
        default:
            return false
        }
    }

    private var accessibilityLabel: String {
        if case .connected = onChainUX.status, let account = onChainUX.account {
            return "Connected as \(truncateAddress(account.address))"
        }
        return label
    }

    // MARK: - Actions

    private func handlePress() {
        switch onChainUX.status {
        case .connected:
            Task {
                await onChainUX.disconnect()
                onDisconnect?()
            }
        case .disconnected:
            Task {
                do {
                    try await onChainUX.connect(connectorId: "metamask")
                    onPress?()
                } catch {
                    // Error state is handled by Cinacoin
                }
            }
        case .error:
            // Retry on error tap
            Task {
                do {
                    try await onChainUX.connect(connectorId: "metamask")
                    onPress?()
                } catch {}
            }
        case .connecting:
            break // disabled
        }
    }
}

// MARK: - Network Badge

/// Network badge showing chain name.
private struct NetworkBadge: View {
    let chainId: Int

    var body: some View {
        Text(chainName(for: chainId))
            .font(.system(size: 10, weight: .medium))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(Color.accentColor.opacity(0.2))
            .cornerRadius(4)
    }

    private func chainName(for chainId: Int) -> String {
        switch chainId {
        case 1: return "ETH"
        case 137: return "POLY"
        case 42161: return "ARB"
        case 56: return "BSC"
        case 10: return "OP"
        case 8453: return "BASE"
        default: return String(chainId)
        }
    }
}

// MARK: - Helpers

/// Truncate an Ethereum address for display.
func truncateAddress(_ address: String, prefix: Int = 4, suffix: Int = 4) -> String {
    guard address.count > prefix + suffix + 2 else { return address }
    let startIndex = address.index(address.startIndex, offsetBy: prefix + 2)
    let endIndex = address.index(address.endIndex, offsetBy: -suffix)
    return "\(address.prefix(prefix + 2))...\(address.suffix(suffix))"
}

/// Extension to create Color from hex string.
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - ThemeColors convenience for SwiftUI

extension ThemeColors {
    var secondaryColor: Color { Color(hex: textSecondary) }
    var errorColor: Color { Color(hex: error) }
}

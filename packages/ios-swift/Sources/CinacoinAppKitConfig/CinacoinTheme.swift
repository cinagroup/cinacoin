import SwiftUI

/// Cinacoin brand theme configuration
public struct CinacoinTheme: Equatable, Sendable {
    
    // MARK: - Colors
    
    public let primary: Color
    public let secondary: Color
    public let background: Color
    public let surface: Color
    public let text: Color
    public let textSecondary: Color
    public let border: Color
    public let error: Color
    public let success: Color
    
    // MARK: - Typography
    
    public let fontFamily: String?
    public let fontSize: FontSizes
    
    public struct FontSizes: Equatable, Sendable {
        public let small: CGFloat
        public let medium: CGFloat
        public let large: CGFloat
        public let xlarge: CGFloat
        
        public static let `default` = FontSizes(
            small: 12,
            medium: 14,
            large: 16,
            xlarge: 20
        )
    }
    
    // MARK: - Spacing
    
    public let spacing: Spacing
    
    public struct Spacing: Equatable, Sendable {
        public let xs: CGFloat
        public let sm: CGFloat
        public let md: CGFloat
        public let lg: CGFloat
        public let xl: CGFloat
        
        public static let `default` = Spacing(
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32
        )
    }
    
    // MARK: - Border Radius
    
    public let borderRadius: BorderRadius
    
    public struct BorderRadius: Equatable, Sendable {
        public let small: CGFloat
        public let medium: CGFloat
        public let large: CGFloat
        public let full: CGFloat
        
        public static let `default` = BorderRadius(
            small: 4,
            medium: 8,
            large: 12,
            full: 9999
        )
    }
    
    // MARK: - Default Themes
    
    public static let dark = CinacoinTheme(
        primary: Color(hex: "0070F3"),
        secondary: Color(hex: "6366F1"),
        background: Color(hex: "000000"),
        surface: Color(hex: "141414"),
        text: Color(hex: "FFFFFF"),
        textSecondary: Color(hex: "A1A1AA"),
        border: Color(hex: "27272A"),
        error: Color(hex: "EF4444"),
        success: Color(hex: "22C55E"),
        fontFamily: nil,
        fontSize: .default,
        spacing: .default,
        borderRadius: .default
    )
    
    public static let light = CinacoinTheme(
        primary: Color(hex: "0070F3"),
        secondary: Color(hex: "6366F1"),
        background: Color(hex: "FFFFFF"),
        surface: Color(hex: "F4F4F5"),
        text: Color(hex: "000000"),
        textSecondary: Color(hex: "71717A"),
        border: Color(hex: "E4E4E7"),
        error: Color(hex: "EF4444"),
        success: Color(hex: "22C55E"),
        fontFamily: nil,
        fontSize: .default,
        spacing: .default,
        borderRadius: .default
    )
}

// MARK: - Color Hex Extension

extension Color {
    public init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
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

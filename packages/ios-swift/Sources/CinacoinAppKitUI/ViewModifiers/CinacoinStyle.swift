import SwiftUI
import CinacoinAppKitConfig

/// View modifier for applying Cinacoin theme
public struct CinacoinStyle: ViewModifier {
    
    @Environment(\.colorScheme) private var colorScheme
    
    public func body(content: Content) -> some View {
        let theme = colorScheme == .dark ? CinacoinTheme.dark : CinacoinTheme.light
        
        content
            .tint(theme.primary)
            .background(theme.background)
            .foregroundColor(theme.text)
    }
}

extension View {
    /// Apply Cinacoin theme styling
    public func cinacoinStyle() -> some View {
        modifier(CinacoinStyle())
    }
}

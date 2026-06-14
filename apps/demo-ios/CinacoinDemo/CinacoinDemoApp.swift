import SwiftUI
import CinacoinAppKitConfig
import CinacoinAppKitAuth

@main
struct CinacoinDemoApp: App {
    
    init() {
        // Configure AppKit
        CinacoinAppKit.configure(with: AppKitConfig(
            projectId: "YOUR_PROJECT_ID",
            metadata: AppKitConfig.AppMetadata(
                name: "Cinacoin Demo",
                description: "Cinacoin iOS SDK Demo",
                url: "https://demo.cinacoin.com",
                icons: ["https://cinacoin.com/icon.png"]
            ),
            themeMode: .dark
        ))
        
        // Configure Auth
        AuthManager.shared.configure(projectId: "YOUR_PROJECT_ID")
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

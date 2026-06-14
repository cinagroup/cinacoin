import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house")
                }
                .tag(0)
            
            ConnectView()
                .tabItem {
                    Label("Connect", systemImage: "link")
                }
                .tag(1)
            
            AuthView()
                .tabItem {
                    Label("Auth", systemImage: "person.circle")
                }
                .tag(2)
            
            SmartAccountView()
                .tabItem {
                    Label("Account", systemImage: "creditcard")
                }
                .tag(3)
            
            ChainView()
                .tabItem {
                    Label("Chains", systemImage: "shuffle")
                }
                .tag(4)
        }
    }
}

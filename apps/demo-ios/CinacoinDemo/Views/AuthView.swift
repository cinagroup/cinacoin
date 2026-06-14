import SwiftUI
import CinacoinAppKitAuth

struct AuthView: View {
    @StateObject private var authManager = AuthManager.shared
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Auth Status
                    VStack(spacing: 8) {
                        Image(systemName: authManager.isAuthenticated ? "person.fill.checkmark" : "person.crop.circle.badge.questionmark")
                            .font(.system(size: 48))
                            .foregroundColor(authManager.isAuthenticated ? .green : .secondary)
                        
                        Text(authManager.isAuthenticated ? "Authenticated" : "Not Authenticated")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        if let user = authManager.currentUser {
                            Text(user.email ?? user.userId)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(16)
                    
                    if !authManager.isAuthenticated {
                        // Social Login
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Social Login")
                                .font(.headline)
                            
                            Button(action: { Task { await socialLogin("Google") } }) {
                                Label("Sign in with Google", systemImage: "globe")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                            }
                            .buttonStyle(.bordered)
                            
                            Button(action: { Task { await socialLogin("GitHub") } }) {
                                Label("Sign in with GitHub", systemImage: "chevron.left.forwardslash.chevron.right")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                            }
                            .buttonStyle(.bordered)
                            
                            Button(action: { Task { await socialLogin("Discord") } }) {
                                Label("Sign in with Discord", systemImage: "bubble.left.and.bubble.right")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                            }
                            .buttonStyle(.bordered)
                        }
                        
                        // Email Login
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Email Login")
                                .font(.headline)
                            
                            TextField("Email", text: $email)
                                .textFieldStyle(.roundedBorder)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                            
                            SecureField("Password", text: $password)
                                .textFieldStyle(.roundedBorder)
                            
                            HStack {
                                Button("Login") { Task { await emailLogin() } }
                                    .buttonStyle(.borderedProminent)
                                    .disabled(isLoading)
                                
                                Button("Register") { Task { await emailRegister() } }
                                    .buttonStyle(.bordered)
                                    .disabled(isLoading)
                            }
                        }
                    } else {
                        // Sign Out
                        Button(action: { authManager.signOut() }) {
                            Label("Sign Out", systemImage: "arrow.right.square")
                                .frame(maxWidth: .infinity)
                                .padding()
                        }
                        .buttonStyle(.bordered)
                        .tint(.red)
                    }
                    
                    if let error = errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                .padding()
            }
            .navigationTitle("Auth")
        }
    }
    
    func socialLogin(_ provider: String) async {
        isLoading = true
        errorMessage = nil
        do {
            switch provider {
            case "Google": _ = try await authManager.signInWithGoogle()
            case "GitHub": _ = try await authManager.signInWithGitHub()
            case "Discord": _ = try await authManager.signInWithDiscord()
            default: break
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func emailLogin() async {
        isLoading = true
        errorMessage = nil
        do {
            _ = try await authManager.login(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func emailRegister() async {
        isLoading = true
        errorMessage = nil
        do {
            _ = try await authManager.register(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

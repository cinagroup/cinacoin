import SwiftUI
import CinacoinAppKitConfig

struct TransferView: View {
    @State private var toAddress = ""
    @State private var amount = ""
    @State private var selectedChainId = 1
    @State private var isSending = false
    @State private var showSuccess = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Recipient") {
                    TextField("0x...", text: $toAddress)
                        .font(.system(.body, design: .monospaced))
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                }
                
                Section("Amount") {
                    HStack {
                        TextField("0.0", text: $amount)
                            .keyboardType(.decimalPad)
                        Text("ETH")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Network") {
                    Picker("Chain", selection: $selectedChainId) {
                        ForEach(ChainRegistry.allEVMChains, id: \.chainId) { chain in
                            Text(chain.name).tag(chain.chainId)
                        }
                    }
                }
                
                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
                
                Section {
                    Button(action: sendTransaction) {
                        HStack {
                            if isSending {
                                ProgressView()
                                    .progressViewStyle(.circular)
                            }
                            Text(isSending ? "Sending..." : "Send Transaction")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .disabled(toAddress.isEmpty || amount.isEmpty || isSending)
                }
            }
            .navigationTitle("Transfer")
            .alert("Transaction Sent", isPresented: $showSuccess) {
                Button("OK", role: .cancel) { }
            } message: {
                Text("Your transaction has been submitted successfully.")
            }
        }
    }
    
    private func sendTransaction() {
        guard !toAddress.isEmpty, !amount.isEmpty else { return }
        
        isSending = true
        errorMessage = nil
        
        // Simulate transaction
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            
            await MainActor.run {
                isSending = false
                showSuccess = true
                toAddress = ""
                amount = ""
            }
        }
    }
}

struct TokenBalanceView: View {
    @State private var balances: [TokenBalance] = []
    @State private var isLoading = false
    @State private var selectedToken: TokenBalance?
    
    var body: some View {
        NavigationStack {
            List {
                if isLoading {
                    Section {
                        HStack {
                            Spacer()
                            ProgressView()
                            Spacer()
                        }
                        .padding()
                    }
                } else if balances.isEmpty {
                    Section {
                        VStack(spacing: 12) {
                            Image(systemName: "wallet.pass")
                                .font(.system(size: 48))
                                .foregroundColor(.secondary)
                            Text("No tokens found")
                                .font(.headline)
                            Text("Connect a wallet to view your token balances")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    }
                } else {
                    Section("Tokens") {
                        ForEach(balances) { token in
                            Button(action: { selectedToken = token }) {
                                TokenBalanceRow(token: token)
                            }
                        }
                    }
                    
                    Section {
                        HStack {
                            Text("Total Value")
                                .fontWeight(.semibold)
                            Spacer()
                            Text(totalValue, format: .currency(code: "USD"))
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                        }
                    }
                }
            }
            .navigationTitle("Token Balances")
            .refreshable {
                await loadBalances()
            }
            .task {
                await loadBalances()
            }
            .sheet(item: $selectedToken) { token in
                TokenDetailView(token: token)
            }
        }
    }
    
    private func loadBalances() async {
        isLoading = true
        
        // Simulate loading
        try? await Task.sleep(nanoseconds: 1_500_000_000)
        
        await MainActor.run {
            balances = [
                TokenBalance(
                    symbol: "ETH",
                    name: "Ethereum",
                    balance: "1.234",
                    balanceUsd: 2345.67,
                    chainId: 1,
                    iconUrl: nil
                ),
                TokenBalance(
                    symbol: "USDC",
                    name: "USD Coin",
                    balance: "500.00",
                    balanceUsd: 500.00,
                    chainId: 1,
                    iconUrl: nil
                ),
                TokenBalance(
                    symbol: "MATIC",
                    name: "Polygon",
                    balance: "1234.56",
                    balanceUsd: 890.12,
                    chainId: 137,
                    iconUrl: nil
                )
            ]
            isLoading = false
        }
    }
    
    private var totalValue: Double {
        balances.reduce(0) { $0 + $1.balanceUsd }
    }
}

struct TokenBalance: Identifiable {
    let id = UUID()
    let symbol: String
    let name: String
    let balance: String
    let balanceUsd: Double
    let chainId: Int
    let iconUrl: String?
}

struct TokenBalanceRow: View {
    let token: TokenBalance
    
    var body: some View {
        HStack(spacing: 12) {
            // Token icon placeholder
            Circle()
                .fill(Color.blue.opacity(0.2))
                .frame(width: 40, height: 40)
                .overlay(
                    Text(token.symbol.prefix(1))
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(token.symbol)
                    .fontWeight(.semibold)
                Text(token.name)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text(token.balance)
                    .fontWeight(.medium)
                Text(token.balanceUsd, format: .currency(code: "USD"))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct TokenDetailView: View {
    let token: TokenBalance
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Circle()
                            .fill(Color.blue.opacity(0.2))
                            .frame(width: 60, height: 60)
                            .overlay(
                                Text(token.symbol.prefix(1))
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                            )
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(token.name)
                                .font(.title2)
                                .fontWeight(.bold)
                            Text(token.symbol)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                Section("Balance") {
                    HStack {
                        Text("Amount")
                        Spacer()
                        Text(token.balance)
                            .fontWeight(.semibold)
                    }
                    
                    HStack {
                        Text("Value")
                        Spacer()
                        Text(token.balanceUsd, format: .currency(code: "USD"))
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                    }
                }
                
                Section("Network") {
                    HStack {
                        Text("Chain ID")
                        Spacer()
                        Text("\(token.chainId)")
                            .foregroundColor(.secondary)
                    }
                    
                    if let chain = ChainRegistry.allEVMChains.first(where: { $0.chainId == token.chainId }) {
                        HStack {
                            Text("Network")
                            Spacer()
                            Text(chain.name)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Section {
                    Button("Send") {
                        // Navigate to transfer
                    }
                    .frame(maxWidth: .infinity)
                    
                    Button("Receive") {
                        // Show receive address
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle(token.symbol)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

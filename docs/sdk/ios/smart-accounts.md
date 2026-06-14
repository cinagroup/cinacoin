# iOS SDK — Smart Accounts

## Overview

Smart Accounts (ERC-4337) enable account abstraction features like gas sponsorship, batched transactions, session keys, and social recovery. This guide covers creating, deploying, and using smart accounts with AppKit.

## Prerequisites

```swift
import CinacoinAppKitCore
import CinacoinAppKitSmartAccount
```

Ensure AppKit is configured:

```swift
CinacoinAppKit.configure(with: AppKitConfig(
    projectId: "YOUR_PROJECT_ID",
    metadata: metadata,
    smartAccountConfig: SmartAccountConfig(
        factoryAddress: "0xFACTORY_ADDRESS",
        entryPointAddress: "0xENTRY_POINT_ADDRESS",
        paymasterUrl: "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID"
    )
))
```

## Create Smart Account

### From EOA (Externally Owned Account)

```swift
import CinacoinAppKitSmartAccount

// Create a smart account from the connected EOA
let smartAccount = try await SmartAccountManager.shared.createSmartAccount(
    owner: CinacoinAppKit.shared.account!.address,
    salt: 0  // Optional: deterministic address
)

print("Smart Account Address: \(smartAccount.address)")
print("Is Deployed: \(smartAccount.isDeployed)")
```

### From Social Login

```swift
// After social auth, create a smart account
let authResult = try await AuthManager.shared.signIn(provider: .google)

let smartAccount = try await SmartAccountManager.shared.createSmartAccount(
    owner: authResult.address,
    salt: 0
)

print("Smart Account: \(smartAccount.address)")
```

### Predict Smart Account Address

Predict the address before deployment:

```swift
let predictedAddress = try await SmartAccountManager.shared.predictAddress(
    owner: "0xOwnerAddress",
    salt: 0
)

print("Predicted address: \(predictedAddress)")
// This address is deterministic and will be the same every time
```

## Deploy Smart Account

Smart accounts are lazily deployed on first use. You can also deploy explicitly:

```swift
// Deploy the smart account on-chain
let txHash = try await smartAccount.deploy()
print("Deployed at: \(txHash)")

// Check deployment status
let isDeployed = await smartAccount.checkDeployed()
print("Is deployed: \(isDeployed)")
```

### Deploy with Gas Sponsorship

```swift
// Deploy with paymaster (gasless for user)
let txHash = try await smartAccount.deploy(
    paymasterConfig: PaymasterConfig(
        url: "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID",
        sponsorshipPolicyId: "YOUR_POLICY_ID"
    )
)
```

## Execute Transactions

### Single Transaction

```swift
import CinacoinAppKitSmartAccount

// Simple ETH transfer
let userOpHash = try await smartAccount.sendTransaction(
    to: "0xRecipientAddress",
    value: BigInt("100000000000000000"), // 0.1 ETH in wei
    data: Data()
)

print("UserOp hash: \(userOpHash)")

// Wait for receipt
let receipt = try await smartAccount.waitForUserOpReceipt(userOpHash: userOpHash)
print("Transaction hash: \(receipt.transactionHash)")
print("Success: \(receipt.success)")
print("Gas used: \(receipt.actualGasCost)")
```

### ERC-20 Token Transfer

```swift
// Encode ERC-20 transfer
let tokenAddress = "0xUSDC_ADDRESS"
let recipient = "0xRecipientAddress"
let amount = BigInt("1000000") // 1 USDC (6 decimals)

let transferData = ERC20Encoder.transfer(
    to: recipient,
    amount: amount
)

let userOpHash = try await smartAccount.sendTransaction(
    to: tokenAddress,
    value: BigInt(0),
    data: transferData
)
```

### Contract Interaction

```swift
// Encode contract call
let contractAddress = "0xCONTRACT_ADDRESS"
let callData = ABIEncoder.encode(
    function: "swap(uint256,address)",
    parameters: [BigInt("1000000"), "0xTokenAddress"]
)

let userOpHash = try await smartAccount.sendTransaction(
    to: contractAddress,
    value: BigInt(0),
    data: callData
)
```

## Batch Transactions

Execute multiple transactions in a single user operation:

```swift
// Create batch of calls
let calls: [SmartAccountCall] = [
    SmartAccountCall(
        to: "0xUSDC_ADDRESS",
        value: BigInt(0),
        data: ERC20Encoder.approve(
            spender: "0xDEX_ADDRESS",
            amount: BigInt("1000000000") // 1000 USDC
        )
    ),
    SmartAccountCall(
        to: "0xDEX_ADDRESS",
        value: BigInt(0),
        data: DEXEncoder.swap(
            tokenIn: "0xUSDC_ADDRESS",
            tokenOut: "0xWETH_ADDRESS",
            amountIn: BigInt("1000000000"),
            minAmountOut: BigInt("500000000000000000") // 0.5 ETH
        )
    ),
    SmartAccountCall(
        to: "0xRecipientAddress",
        value: BigInt("500000000000000000"), // Send 0.5 ETH
        data: Data()
    )
]

// Execute batch
let userOpHash = try await smartAccount.sendBatch(calls: calls)
print("Batch UserOp: \(userOpHash)")
```

### Batch with Gas Sponsorship

```swift
let userOpHash = try await smartAccount.sendBatch(
    calls: calls,
    paymasterConfig: PaymasterConfig(
        url: "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID",
        sponsorshipPolicyId: "YOUR_POLICY_ID"
    )
)
```

## Gas Sponsorship (Paymaster)

### Configure Paymaster

```swift
let paymasterConfig = PaymasterConfig(
    url: "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID",
    sponsorshipPolicyId: "YOUR_POLICY_ID",  // Optional
    maxGasAllowance: BigInt("100000000000000000") // 0.1 ETH max
)
```

### Gasless Transaction

```swift
// Transaction with gas sponsorship
let userOpHash = try await smartAccount.sendTransaction(
    to: "0xRecipientAddress",
    value: BigInt("100000000000000000"),
    data: Data(),
    paymasterConfig: paymasterConfig
)
// User pays no gas — sponsored by paymaster
```

### Check Sponsorship Eligibility

```swift
let eligibility = try await PaymasterClient.checkEligibility(
    smartAccount: smartAccount.address,
    chainId: "0x1",
    policyId: "YOUR_POLICY_ID"
)

if eligibility.isEligible {
    print("Remaining sponsorship: \(eligibility.remainingBalance)")
}
```

## Session Keys

Session keys allow dApps to execute transactions without prompting the user for each action:

### Create Session Key

```swift
import CinacoinAppKitSmartAccount

// Create a session key with permissions
let sessionKey = try await smartAccount.createSessionKey(
    signer: "0xSessionSignerAddress",
    permissions: SessionPermissions(
        // Time bounds
        validAfter: UInt48(Date().timeIntervalSince1970),
        validUntil: UInt48(Date().addingTimeInterval(86400).timeIntervalSince1970), // 24h

        // Allowed targets
        allowedTargets: [
            AllowedTarget(
                address: "0xGAME_CONTRACT",
                functionSelectors: [
                    "0x3d18b912", // move(uint256)
                    "0x7d4bcde1"  // attack(address)
                ],
                valueLimit: BigInt("10000000000000000") // 0.01 ETH max
            )
        ],
        // Global spend limit
        spendLimits: [
            SpendLimit(
                token: "0x0", // ETH
                amount: BigInt("50000000000000000") // 0.05 ETH total
            )
        ]
    )
)

print("Session key created: \(sessionKey.key)")
```

### Use Session Key

```swift
// Execute transaction using session key (no user prompt)
let sessionSigner = SessionKeySigner(privateKey: sessionKeyPrivateKey)

let userOpHash = try await smartAccount.sendTransaction(
    to: "0xGAME_CONTRACT",
    value: BigInt(0),
    data: gameMoveData,
    signer: sessionSigner
)
```

### Revoke Session Key

```swift
try await smartAccount.revokeSessionKey(key: "0xSessionSignerAddress")
```

## Account Recovery

### Social Recovery Setup

```swift
// Set up guardians for social recovery
try await smartAccount.setGuardians([
    "0xGuardian1Address",
    "0xGuardian2Address",
    "0xGuardian3Address"
], threshold: 2) // 2 of 3 required for recovery
```

### Recover Account

```swift
// Initiate recovery (requires guardian signatures)
let recoveryRequest = try await SmartAccountManager.shared.initiateRecovery(
    smartAccountAddress: "0xSmartAccountAddress",
    newOwner: "0xNewOwnerAddress",
    guardianSignatures: [
        GuardianSignature(guardian: "0xGuardian1", signature: sig1),
        GuardianSignature(guardian: "0xGuardian2", signature: sig2)
    ]
)
```

## Smart Account Info

```swift
// Get smart account details
let info = try await smartAccount.getInfo()

print("Address: \(info.address)")
print("Owner: \(info.owner)")
print("Balance: \(info.balance)")
print("Nonce: \(info.nonce)")
print("Is Deployed: \(info.isDeployed)")
print("Guardians: \(info.guardians)")
print("Session Keys: \(info.sessionKeys)")
```

## Error Handling

```swift
do {
    let userOpHash = try await smartAccount.sendTransaction(
        to: recipient,
        value: amount,
        data: callData
    )
} catch SmartAccountError.insufficientFunds {
    // Not enough balance for gas
} catch SmartAccountError.paymasterRejected {
    // Paymaster rejected the sponsorship
} catch SmartAccountError.invalidSignature {
    // Signature verification failed
} catch SmartAccountError.nonceTooLow {
    // Nonce conflict — retry with updated nonce
} catch SmartAccountError.entryPointReverted(let reason) {
    // EntryPoint or target contract reverted
    print("Revert reason: \(reason)")
} catch {
    // Unexpected error
}
```

<!-- TODO: Add diagram of smart account architecture -->

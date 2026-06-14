# Android SDK — Smart Accounts

## Overview

Smart Accounts (ERC-4337) enable account abstraction features like gas sponsorship, batched transactions, session keys, and social recovery.

## Prerequisites

```kotlin
import io.cinacoin.appkit.smartaccount.SmartAccountManager
import io.cinacoin.appkit.smartaccount.SmartAccountConfig
```

Configure smart account support:

```kotlin
val smartAccountConfig = SmartAccountConfig(
    factoryAddress = "0xFACTORY_ADDRESS",
    entryPointAddress = "0xENTRY_POINT_ADDRESS",
    paymasterUrl = "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID"
)

CinacoinAppKit.configureSmartAccount(smartAccountConfig)
```

## Create Smart Account

### From EOA

```kotlin
// Create a smart account from the connected EOA
val smartAccount = SmartAccountManager.instance.createSmartAccount(
    owner = CinacoinAppKit.instance.account!!.address,
    salt = 0  // Optional: deterministic address
)

Log.d("SmartAccount", "Address: ${smartAccount.address}")
Log.d("SmartAccount", "Is Deployed: ${smartAccount.isDeployed}")
```

### From Social Login

```kotlin
val authResult = AuthManager.instance.signIn(provider = AuthProvider.GOOGLE)

val smartAccount = SmartAccountManager.instance.createSmartAccount(
    owner = authResult.address,
    salt = 0
)

Log.d("SmartAccount", "Address: ${smartAccount.address}")
```

### Predict Address

```kotlin
val predictedAddress = SmartAccountManager.instance.predictAddress(
    owner = "0xOwnerAddress",
    salt = 0
)

Log.d("SmartAccount", "Predicted: $predictedAddress")
```

## Deploy Smart Account

```kotlin
// Deploy on-chain
val txHash = smartAccount.deploy()
Log.d("SmartAccount", "Deployed at: $txHash")

// Check deployment status
val isDeployed = smartAccount.checkDeployed()
Log.d("SmartAccount", "Is deployed: $isDeployed")
```

### Deploy with Gas Sponsorship

```kotlin
val txHash = smartAccount.deploy(
    paymasterConfig = PaymasterConfig(
        url = "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID",
        sponsorshipPolicyId = "YOUR_POLICY_ID"
    )
)
```

## Execute Transactions

### Single Transaction

```kotlin
import io.cinacoin.appkit.smartaccount.SmartAccount

// Simple ETH transfer
val userOpHash = smartAccount.sendTransaction(
    to = "0xRecipientAddress",
    value = BigInteger("100000000000000000"), // 0.1 ETH in wei
    data = ByteArray(0)
)

Log.d("SmartAccount", "UserOp: $userOpHash")

// Wait for receipt
val receipt = smartAccount.waitForUserOpReceipt(userOpHash)
Log.d("SmartAccount", "Tx hash: ${receipt.transactionHash}")
Log.d("SmartAccount", "Success: ${receipt.success}")
Log.d("SmartAccount", "Gas used: ${receipt.actualGasCost}")
```

### ERC-20 Token Transfer

```kotlin
val tokenAddress = "0xUSDC_ADDRESS"
val recipient = "0xRecipientAddress"
val amount = BigInteger("1000000") // 1 USDC (6 decimals)

val transferData = ERC20Encoder.transfer(recipient, amount)

val userOpHash = smartAccount.sendTransaction(
    to = tokenAddress,
    value = BigInteger.ZERO,
    data = transferData
)
```

### Contract Interaction

```kotlin
val callData = ABIEncoder.encode(
    function = "swap(uint256,address)",
    params = listOf(BigInteger("1000000"), "0xTokenAddress")
)

val userOpHash = smartAccount.sendTransaction(
    to = "0xCONTRACT_ADDRESS",
    value = BigInteger.ZERO,
    data = callData
)
```

## Batch Transactions

```kotlin
val calls = listOf(
    SmartAccountCall(
        to = "0xUSDC_ADDRESS",
        value = BigInteger.ZERO,
        data = ERC20Encoder.approve("0xDEX_ADDRESS", BigInteger("1000000000"))
    ),
    SmartAccountCall(
        to = "0xDEX_ADDRESS",
        value = BigInteger.ZERO,
        data = DEXEncoder.swap(
            tokenIn = "0xUSDC_ADDRESS",
            tokenOut = "0xWETH_ADDRESS",
            amountIn = BigInteger("1000000000"),
            minAmountOut = BigInteger("500000000000000000")
        )
    ),
    SmartAccountCall(
        to = "0xRecipientAddress",
        value = BigInteger("500000000000000000"), // 0.5 ETH
        data = ByteArray(0)
    )
)

// Execute batch
val userOpHash = smartAccount.sendBatch(calls)
Log.d("SmartAccount", "Batch UserOp: $userOpHash")
```

### Batch with Gas Sponsorship

```kotlin
val userOpHash = smartAccount.sendBatch(
    calls = calls,
    paymasterConfig = PaymasterConfig(
        url = "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID",
        sponsorshipPolicyId = "YOUR_POLICY_ID"
    )
)
```

## Gas Sponsorship (Paymaster)

### Configure Paymaster

```kotlin
val paymasterConfig = PaymasterConfig(
    url = "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID",
    sponsorshipPolicyId = "YOUR_POLICY_ID",
    maxGasAllowance = BigInteger("100000000000000000") // 0.1 ETH
)
```

### Gasless Transaction

```kotlin
val userOpHash = smartAccount.sendTransaction(
    to = "0xRecipientAddress",
    value = BigInteger("100000000000000000"),
    data = ByteArray(0),
    paymasterConfig = paymasterConfig
)
// User pays no gas — sponsored by paymaster
```

### Check Sponsorship Eligibility

```kotlin
val eligibility = PaymasterClient.checkEligibility(
    smartAccount = smartAccount.address,
    chainId = "0x1",
    policyId = "YOUR_POLICY_ID"
)

if (eligibility.isEligible) {
    Log.d("Paymaster", "Remaining: ${eligibility.remainingBalance}")
}
```

## Session Keys

### Create Session Key

```kotlin
val sessionKey = smartAccount.createSessionKey(
    signer = "0xSessionSignerAddress",
    permissions = SessionPermissions(
        validAfter = System.currentTimeMillis() / 1000,
        validUntil = (System.currentTimeMillis() / 1000) + 86400, // 24h
        allowedTargets = listOf(
            AllowedTarget(
                address = "0xGAME_CONTRACT",
                functionSelectors = listOf(
                    "0x3d18b912", // move(uint256)
                    "0x7d4bcde1"  // attack(address)
                ),
                valueLimit = BigInteger("10000000000000000") // 0.01 ETH
            )
        ),
        spendLimits = listOf(
            SpendLimit(
                token = "0x0", // ETH
                amount = BigInteger("50000000000000000") // 0.05 ETH
            )
        )
    )
)

Log.d("SessionKey", "Created: ${sessionKey.key}")
```

### Use Session Key

```kotlin
val sessionSigner = SessionKeySigner(privateKey = sessionKeyPrivateKey)

val userOpHash = smartAccount.sendTransaction(
    to = "0xGAME_CONTRACT",
    value = BigInteger.ZERO,
    data = gameMoveData,
    signer = sessionSigner
)
```

### Revoke Session Key

```kotlin
smartAccount.revokeSessionKey(key = "0xSessionSignerAddress")
```

## Account Recovery

### Social Recovery Setup

```kotlin
smartAccount.setGuardians(
    guardians = listOf(
        "0xGuardian1Address",
        "0xGuardian2Address",
        "0xGuardian3Address"
    ),
    threshold = 2 // 2 of 3 required
)
```

### Recover Account

```kotlin
val recoveryRequest = SmartAccountManager.instance.initiateRecovery(
    smartAccountAddress = "0xSmartAccountAddress",
    newOwner = "0xNewOwnerAddress",
    guardianSignatures = listOf(
        GuardianSignature("0xGuardian1", sig1),
        GuardianSignature("0xGuardian2", sig2)
    )
)
```

## Smart Account Info

```kotlin
val info = smartAccount.getInfo()

Log.d("Info", "Address: ${info.address}")
Log.d("Info", "Owner: ${info.owner}")
Log.d("Info", "Balance: ${info.balance}")
Log.d("Info", "Nonce: ${info.nonce}")
Log.d("Info", "Is Deployed: ${info.isDeployed}")
Log.d("Info", "Guardians: ${info.guardians}")
Log.d("Info", "Session Keys: ${info.sessionKeys}")
```

## Error Handling

```kotlin
try {
    val userOpHash = smartAccount.sendTransaction(
        to = recipient,
        value = amount,
        data = callData
    )
} catch (e: SmartAccountException.InsufficientFunds) {
    // Not enough balance for gas
} catch (e: SmartAccountException.PaymasterRejected) {
    // Paymaster rejected sponsorship
} catch (e: SmartAccountException.InvalidSignature) {
    // Signature verification failed
} catch (e: SmartAccountException.NonceTooLow) {
    // Nonce conflict — retry
} catch (e: SmartAccountException.EntryPointReverted) {
    Log.e("SmartAccount", "Revert: ${e.reason}")
} catch (e: Exception) {
    // Unexpected error
}
```

<!-- TODO: Add diagram of smart account architecture -->

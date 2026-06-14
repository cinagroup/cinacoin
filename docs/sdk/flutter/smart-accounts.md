# Flutter SDK — Smart Accounts

## Overview

Smart Accounts (ERC-4337) enable account abstraction features like gas sponsorship, batched transactions, session keys, and social recovery.

## Prerequisites

```dart
import 'package:cinacoin_appkit_smart_account/cinacoin_appkit_smart_account.dart';
```

Configure smart account support:

```dart
final smartAccountConfig = SmartAccountConfig(
  factoryAddress: '0xFACTORY_ADDRESS',
  entryPointAddress: '0xENTRY_POINT_ADDRESS',
  paymasterUrl: 'https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID',
);

CinacoinAppKit.configureSmartAccount(smartAccountConfig);
```

## Create Smart Account

### From EOA

```dart
// Create a smart account from the connected EOA
final smartAccount = await SmartAccountManager.instance.createSmartAccount(
  owner: CinacoinAppKit.instance.account!.address,
  salt: 0, // Optional: deterministic address
);

print('Address: ${smartAccount.address}');
print('Is Deployed: ${smartAccount.isDeployed}');
```

### From Social Login

```dart
final authResult = await AuthManager.instance.signIn(provider: AuthProvider.google);

final smartAccount = await SmartAccountManager.instance.createSmartAccount(
  owner: authResult.address,
  salt: 0,
);

print('Address: ${smartAccount.address}');
```

### Predict Address

```dart
final predictedAddress = await SmartAccountManager.instance.predictAddress(
  owner: '0xOwnerAddress',
  salt: 0,
);

print('Predicted: $predictedAddress');
```

## Deploy Smart Account

```dart
// Deploy on-chain
final txHash = await smartAccount.deploy();
print('Deployed at: $txHash');

// Check deployment status
final isDeployed = await smartAccount.checkDeployed();
print('Is deployed: $isDeployed');
```

### Deploy with Gas Sponsorship

```dart
final txHash = await smartAccount.deploy(
  paymasterConfig: PaymasterConfig(
    url: 'https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID',
    sponsorshipPolicyId: 'YOUR_POLICY_ID',
  ),
);
```

## Execute Transactions

### Single Transaction

```dart
// Simple ETH transfer
final userOpHash = await smartAccount.sendTransaction(
  to: '0xRecipientAddress',
  value: BigInt.from(100000000000000000), // 0.1 ETH in wei
  data: [],
);

print('UserOp: $userOpHash');

// Wait for receipt
final receipt = await smartAccount.waitForUserOpReceipt(userOpHash: userOpHash);
print('Tx hash: ${receipt.transactionHash}');
print('Success: ${receipt.success}');
print('Gas used: ${receipt.actualGasCost}');
```

### ERC-20 Token Transfer

```dart
final tokenAddress = '0xUSDC_ADDRESS';
final recipient = '0xRecipientAddress';
final amount = BigInt.from(1000000); // 1 USDC (6 decimals)

final transferData = ERC20Encoder.transfer(
  to: recipient,
  amount: amount,
);

final userOpHash = await smartAccount.sendTransaction(
  to: tokenAddress,
  value: BigInt.zero,
  data: transferData,
);
```

### Contract Interaction

```dart
final callData = ABIEncoder.encode(
  function: 'swap(uint256,address)',
  params: [BigInt.from(1000000), '0xTokenAddress'],
);

final userOpHash = await smartAccount.sendTransaction(
  to: '0xCONTRACT_ADDRESS',
  value: BigInt.zero,
  data: callData,
);
```

## Batch Transactions

```dart
final calls = [
  SmartAccountCall(
    to: '0xUSDC_ADDRESS',
    value: BigInt.zero,
    data: ERC20Encoder.approve(
      spender: '0xDEX_ADDRESS',
      amount: BigInt.from(1000000000),
    ),
  ),
  SmartAccountCall(
    to: '0xDEX_ADDRESS',
    value: BigInt.zero,
    data: DEXEncoder.swap(
      tokenIn: '0xUSDC_ADDRESS',
      tokenOut: '0xWETH_ADDRESS',
      amountIn: BigInt.from(1000000000),
      minAmountOut: BigInt.from(500000000000000000),
    ),
  ),
  SmartAccountCall(
    to: '0xRecipientAddress',
    value: BigInt.from(500000000000000000), // 0.5 ETH
    data: [],
  ),
];

// Execute batch
final userOpHash = await smartAccount.sendBatch(calls: calls);
print('Batch UserOp: $userOpHash');
```

### Batch with Gas Sponsorship

```dart
final userOpHash = await smartAccount.sendBatch(
  calls: calls,
  paymasterConfig: PaymasterConfig(
    url: 'https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID',
    sponsorshipPolicyId: 'YOUR_POLICY_ID',
  ),
);
```

## Gas Sponsorship (Paymaster)

### Configure Paymaster

```dart
final paymasterConfig = PaymasterConfig(
  url: 'https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID',
  sponsorshipPolicyId: 'YOUR_POLICY_ID',
  maxGasAllowance: BigInt.from(100000000000000000), // 0.1 ETH
);
```

### Gasless Transaction

```dart
final userOpHash = await smartAccount.sendTransaction(
  to: '0xRecipientAddress',
  value: BigInt.from(100000000000000000),
  data: [],
  paymasterConfig: paymasterConfig,
);
// User pays no gas — sponsored by paymaster
```

### Check Sponsorship Eligibility

```dart
final eligibility = await PaymasterClient.checkEligibility(
  smartAccount: smartAccount.address,
  chainId: '0x1',
  policyId: 'YOUR_POLICY_ID',
);

if (eligibility.isEligible) {
  print('Remaining: ${eligibility.remainingBalance}');
}
```

## Session Keys

### Create Session Key

```dart
final sessionKey = await smartAccount.createSessionKey(
  signer: '0xSessionSignerAddress',
  permissions: SessionPermissions(
    validAfter: DateTime.now().millisecondsSinceEpoch ~/ 1000,
    validUntil: DateTime.now().add(Duration(hours: 24)).millisecondsSinceEpoch ~/ 1000,
    allowedTargets: [
      AllowedTarget(
        address: '0xGAME_CONTRACT',
        functionSelectors: [
          '0x3d18b912', // move(uint256)
          '0x7d4bcde1', // attack(address)
        ],
        valueLimit: BigInt.from(10000000000000000), // 0.01 ETH
      ),
    ],
    spendLimits: [
      SpendLimit(
        token: '0x0', // ETH
        amount: BigInt.from(50000000000000000), // 0.05 ETH
      ),
    ],
  ),
);

print('Session key: ${sessionKey.key}');
```

### Use Session Key

```dart
final sessionSigner = SessionKeySigner(privateKey: sessionKeyPrivateKey);

final userOpHash = await smartAccount.sendTransaction(
  to: '0xGAME_CONTRACT',
  value: BigInt.zero,
  data: gameMoveData,
  signer: sessionSigner,
);
```

### Revoke Session Key

```dart
await smartAccount.revokeSessionKey(key: '0xSessionSignerAddress');
```

## Account Recovery

### Social Recovery Setup

```dart
await smartAccount.setGuardians(
  guardians: [
    '0xGuardian1Address',
    '0xGuardian2Address',
    '0xGuardian3Address',
  ],
  threshold: 2, // 2 of 3 required
);
```

### Recover Account

```dart
final recoveryRequest = await SmartAccountManager.instance.initiateRecovery(
  smartAccountAddress: '0xSmartAccountAddress',
  newOwner: '0xNewOwnerAddress',
  guardianSignatures: [
    GuardianSignature(guardian: '0xGuardian1', signature: sig1),
    GuardianSignature(guardian: '0xGuardian2', signature: sig2),
  ],
);
```

## Smart Account Info

```dart
final info = await smartAccount.getInfo();

print('Address: ${info.address}');
print('Owner: ${info.owner}');
print('Balance: ${info.balance}');
print('Nonce: ${info.nonce}');
print('Is Deployed: ${info.isDeployed}');
print('Guardians: ${info.guardians}');
print('Session Keys: ${info.sessionKeys}');
```

## Error Handling

```dart
try {
  final userOpHash = await smartAccount.sendTransaction(
    to: recipient,
    value: amount,
    data: callData,
  );
} on SmartAccountException catch (e) {
  if (e is InsufficientFundsException) {
    // Not enough balance for gas
  } else if (e is PaymasterRejectedException) {
    // Paymaster rejected sponsorship
  } else if (e is InvalidSignatureException) {
    // Signature verification failed
  } else if (e is NonceTooLowException) {
    // Nonce conflict — retry
  } else if (e is EntryPointRevertedException) {
    print('Revert: ${e.reason}');
  } else {
    // Unexpected error
  }
}
```

<!-- TODO: Add diagram of smart account architecture -->

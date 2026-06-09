# @cinacoin/cross-chain-contracts

Production-ready cross-chain bridge smart contracts with HTLC atomic swaps for the Cinacoin ecosystem.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    HTLC.sol   │     │BridgeRouter.sol│    │  MultiSig.sol  │
│               │     │              │     │              │
│ Atomic Swaps  │◄───►│ Cross-Chain  │◄───►│ Relayer      │
│ Lock/Claim/   │     │ Transfer     │     │ Governance   │
│ Refund        │     │ Routing      │     │ Proposals    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### HTLC (Hashed TimeLock Contract)
- Atomic cross-chain swaps using hashlocks + timelocks
- Supports ERC-20 tokens and native ETH
- Lock → Claim (with secret) or Refund (after timelock)
- Secret reuse prevention across chains

### BridgeRouter
- Relayer-based cross-chain transfer routing
- Multi-signature validation for transfer completion
- Fee collection and relayer management
- Nonce-based replay protection

### MultiSig
- Threshold-based proposal execution
- Time-locked execution after approval
- Dynamic signer management (add/remove)
- Configurable thresholds and time delays

## Installation

```bash
cd packages/cross-chain-contracts
npm install
```

## Development

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Check contract sizes
npm run size
```

## Deployment

### Environment Variables

Create a `.env` file:

```env
# Deployer private key
DEPLOYER_PRIVATE_KEY=0x...

# RPC URLs
SEPOLIA_RPC_URL=https://rpc.sepolia.org
AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Etherscan API keys for verification
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key

# Optional: Additional relayer addresses (comma-separated)
RELAYER_ADDRESSES=0x...,0x...
```

### Deploy to Testnets

```bash
# Deploy to Sepolia (Ethereum testnet)
npm run deploy:sepolia

# Deploy to Amoy (Polygon testnet)
npm run deploy:amoy
```

### Verify Contracts

```bash
# Verify on Sepolia Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Verify on Polygon Amoy Etherscan
npx hardhat verify --network amoy --contract contracts/HTLC.sol:HTLC <CONTRACT_ADDRESS>
```

## Usage Example

```solidity
// 1. Create an HTLC lock
bytes32 hashlock = keccak256(abi.encodePacked(secret));
uint256 timelock = block.timestamp + 3600; // 1 hour
uint256 lockId = htlc.create(recipient, hashlock, timelock, token, amount);

// 2. Claim with the secret
htlc.claim(lockId, secret);

// 3. If timelock expires, refund
htlc.refund(lockId);
```

## Test Coverage

The test suite covers:
- ✅ Lock creation (ETH) with all parameter validation
- ✅ Lock emission events
- ✅ Claim with correct secret
- ✅ Claim rejection with wrong secret
- ✅ Double-spend prevention (secret reuse)
- ✅ Refund after timelock expiry
- ✅ Refund rejection before timelock
- ✅ Refund rejection for non-sender
- ✅ Full atomic swap lifecycle
- ✅ Emergency withdrawal
- ✅ Edge cases (non-existent locks, zero values)

## Security Considerations

- **Reentrancy Protection**: All external state-changing functions use `nonReentrant`
- **Secret Reuse Prevention**: Exposed secrets are tracked to prevent cross-chain replay
- **Timelock Safety**: Refunds only possible after expiration, not before
- **MultiSig Governance**: BridgeRouter operations require threshold relayer approval
- **Time-Locked Execution**: MultiSig proposals require a delay before execution
- **Nonce Tracking**: Prevents replay attacks on destination chains

## License

MIT

# Migration guide.

> Migrate from Reown/WalletConnect to CinaCoin.

## Why migrate?

| Reown/WalletConnect | CinaCoin |
|---|---|
| $500-5,000/month license | Free, open source (MIT) |
| MAU limits | Unlimited |
| Branding required | Fully white-label |
| Hosted relay | Self-hosted, 99.95% SLA |
| Vendor lock-in | Full control |

## Quick migration.

### 1. Install CinaCoin.

```bash
npm install @cinacoin/core-sdk @cinacoin/react
```

### 2. Use codemod.

Run the transform that matches the library you are migrating from:

```bash
# Reown AppKit / Web3Modal v2.
npx @cinacoin/codemod appkit-to-cinacoin

# Other supported sources.
npx @cinacoin/codemod web3modal-to-cinacoin
npx @cinacoin/codemod rainbowkit-to-cinacoin
npx @cinacoin/codemod connectkit-to-cinacoin
npx @cinacoin/codemod wagmi-to-cinacoin
npx @cinacoin/codemod wc-v1-to-v2
npx @cinacoin/codemod ethers-v5-to-viem
```

### 3. Update configuration.

Replace your `@reown/appkit` or `@walletconnect` configuration with CinaCoin's `CinaCoinProvider`.

### 4. Test.

Verify wallet connections, chain switching, and signing work as expected.

## Supported migrations.

All of the following codemods ship today (see `npx @cinacoin/codemod --list`):

- Reown AppKit / Web3Modal v2 → `appkit-to-cinacoin`
- Web3Modal → `web3modal-to-cinacoin`
- RainbowKit → `rainbowkit-to-cinacoin`
- ConnectKit → `connectkit-to-cinacoin`
- wagmi → `wagmi-to-cinacoin`
- WalletConnect v1 → v2 → `wc-v1-to-v2`
- ethers v5 → viem → `ethers-v5-to-viem`

## Related.

- [Codemod API](/api/codemod)

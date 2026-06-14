/**
 * Codemod test suite — comprehensive tests for all transforms.
 * Covers: appkit-to-cinacoin, wc-v1-to-v2, rainbowkit-to-cinacoin,
 *         connectkit-to-cinacoin, web3modal-to-cinacoin, ethers-v5-to-viem.
 */

import { transformAppKitToCinacoin } from "../src/codemods/appkit-to-onchainux";
import { transformWcV1ToV2 } from "../src/codemods/wc-v1-to-v2";
import { transformRainbowKitToCinacoin } from "../src/codemods/rainbowkit-to-cinacoin";
import { transformConnectKitToCinacoin } from "../src/codemods/connectkit-to-cinacoin";
import { transformWeb3ModalToCinacoin } from "../src/codemods/web3modal-to-cinacoin";
import { transformEthersV5ToViem } from "../src/codemods/ethers-v5-to-viem";
import { TRANSFORMS, listTransforms, applyTransform, applyTransforms, hasTransform } from "../src/index";

// ── appkit-to-cinacoin tests ──────────────────────────────────────────────

describe("appkit-to-cinacoin codemod", () => {
  describe("package renames", () => {
    test("renames @cinacoin/appkit to @cinacoin/core-sdk", () => {
      const result = transformAppKitToCinacoin(`import { createAppKit } from "@cinacoin/appkit";`);
      expect(result.transformed).toBe(true);
      expect(result.output).toContain("@cinacoin/core-sdk");
      expect(result.output).not.toContain("@cinacoin/appkit");
    });

    test("renames @cinacoin/appkit-react to @cinacoin/react", () => {
      const result = transformAppKitToCinacoin(`import { useAppKit } from "@cinacoin/appkit-react";`);
      expect(result.output).toContain("@cinacoin/react");
    });

    test("renames @cinacoin/appkit-wagmi to @cinacoin/wagmi", () => {
      const result = transformAppKitToCinacoin(`import { wagmiAdapter } from "@cinacoin/appkit-wagmi";`);
      expect(result.output).toContain("@cinacoin/wagmi");
    });

    test("renames @web3modal/ethereum to @cinacoin/ethereum", () => {
      const result = transformAppKitToCinacoin(`import { EthereumClient } from "@web3modal/ethereum";`);
      expect(result.output).toContain("@cinacoin/ethereum");
    });

    test("renames @web3modal/wagmi to @cinacoin/wagmi", () => {
      const result = transformAppKitToCinacoin(`import { WagmiAdapter } from "@web3modal/wagmi";`);
      expect(result.output).toContain("@cinacoin/wagmi");
    });

    test("renames @web3modal/react to @cinacoin/react", () => {
      const result = transformAppKitToCinacoin(`import { useWeb3Modal } from "@web3modal/react";`);
      expect(result.output).toContain("@cinacoin/react");
    });

    test("renames @web3modal/ui to @cinacoin/ui", () => {
      const result = transformAppKitToCinacoin(`import { W3mButton } from "@web3modal/ui";`);
      expect(result.output).toContain("@cinacoin/ui");
    });

    test("renames @web3modal/core to @cinacoin/core-sdk", () => {
      const result = transformAppKitToCinacoin(`import { W3mFrameHelpers } from "@web3modal/core";`);
      expect(result.output).toContain("@cinacoin/core-sdk");
    });

    test("renames @web3modal/html to @cinacoin/html", () => {
      const result = transformAppKitToCinacoin(`import { Web3Modal } from "@web3modal/html";`);
      expect(result.output).toContain("@cinacoin/html");
    });
  });

  describe("class/function renames", () => {
    test("renames Web3Modal to Cinacoin", () => {
      const result = transformAppKitToCinacoin(`const modal = new Web3Modal({ projectId: "abc" });`);
      expect(result.output).toContain("new Cinacoin(");
    });

    test("renames createWeb3Modal to createCinacoin", () => {
      const result = transformAppKitToCinacoin(`const modal = createWeb3Modal({ projectId: "abc" });`);
      expect(result.output).toContain("createCinacoin(");
    });

    test("renames createAppKit to createCinacoin", () => {
      const result = transformAppKitToCinacoin(`const modal = createAppKit({ projectId: "abc" });`);
      expect(result.output).toContain("createCinacoin(");
    });

    test("renames AppKit to Cinacoin", () => {
      const result = transformAppKitToCinacoin(`const modal = new AppKit({ projectId: "abc" });`);
      expect(result.output).toContain("new Cinacoin(");
    });
  });

  describe("hook renames", () => {
    test("renames useWeb3Modal to useCinacoin", () => {
      const result = transformAppKitToCinacoin(`const { open } = useWeb3Modal();`);
      expect(result.output).toContain("useCinacoin()");
    });

    test("renames useWeb3ModalTheme to useCinacoinTheme", () => {
      const result = transformAppKitToCinacoin(`const { theme } = useWeb3ModalTheme();`);
      expect(result.output).toContain("useCinacoinTheme()");
    });

    test("renames useAppKit to useCinacoin", () => {
      const result = transformAppKitToCinacoin(`const { open } = useAppKit();`);
      expect(result.output).toContain("useCinacoin()");
    });

    test("renames useAppKitAccount to useCinacoinAccount", () => {
      const result = transformAppKitToCinacoin(`const { address } = useAppKitAccount();`);
      expect(result.output).toContain("useCinacoinAccount()");
    });

    test("renames useAppKitNetwork to useCinacoinNetwork", () => {
      const result = transformAppKitToCinacoin(`const { chainId } = useAppKitNetwork();`);
      expect(result.output).toContain("useCinacoinNetwork()");
    });
  });

  describe("component renames", () => {
    test("renames W3mButton to CinacoinButton", () => {
      const result = transformAppKitToCinacoin(`<W3mButton />`);
      expect(result.output).toContain("CinacoinButton");
    });

    test("renames W3mNetworkSelect to CinacoinNetworkSelect", () => {
      const result = transformAppKitToCinacoin(`<W3mNetworkSelect />`);
      expect(result.output).toContain("CinacoinNetworkSelect");
    });

    test("renames W3mModal to CinacoinModal", () => {
      const result = transformAppKitToCinacoin(`<W3mModal />`);
      expect(result.output).toContain("CinacoinModal");
    });

    test("renames AppKitButton to CinacoinButton", () => {
      const result = transformAppKitToCinacoin(`<AppKitButton />`);
      expect(result.output).toContain("CinacoinButton");
    });
  });

  describe("type renames", () => {
    test("renames Web3ModalConfig to CinacoinConfig", () => {
      const result = transformAppKitToCinacoin(`const config: Web3ModalConfig = {};`);
      expect(result.output).toContain("CinacoinConfig");
    });

    test("renames AppKitConfig to CinacoinConfig", () => {
      const result = transformAppKitToCinacoin(`const config: AppKitConfig = {};`);
      expect(result.output).toContain("CinacoinConfig");
    });

    test("renames Web3ModalTheme to CinacoinTheme", () => {
      const result = transformAppKitToCinacoin(`const theme: Web3ModalTheme = { mode: "dark" };`);
      expect(result.output).toContain("CinacoinTheme");
    });
  });

  describe("config key renames", () => {
    test("renames walletConnectProjectId to projectId", () => {
      const result = transformAppKitToCinacoin(`{ walletConnectProjectId: "xyz" }`);
      expect(result.output).toContain("projectId:");
    });

    test("renames enableAnalytics to analytics", () => {
      const result = transformAppKitToCinacoin(`{ enableAnalytics: true }`);
      expect(result.output).toContain("analytics:");
    });
  });

  describe("edge cases", () => {
    test("no-op on already-migrated code", () => {
      const result = transformAppKitToCinacoin(`import { Cinacoin } from "@cinacoin/core-sdk";`);
      expect(result.transformed).toBe(false);
    });

    test("no-op on unrelated code", () => {
      const result = transformAppKitToCinacoin(`const x = 42;`);
      expect(result.transformed).toBe(false);
    });

    test("changes array is populated", () => {
      const result = transformAppKitToCinacoin(`import { Web3Modal } from "@web3modal/react";`);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    test("full migration example", () => {
      const input = `
import { createWeb3Modal, defaultConfig } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'

const modal = createWeb3Modal({
  walletConnectProjectId: 'abc123',
  chains: [mainnet],
  themeMode: 'dark',
})

function App() {
  return <Web3Modal />
}
`;
      const result = transformAppKitToCinacoin(input);
      expect(result.transformed).toBe(true);
      expect(result.output).toContain("@cinacoin/ethereum");
      expect(result.output).toContain("@cinacoin/react");
      expect(result.output).toContain("createCinacoin");
      expect(result.output).toContain("Cinacoin");
      expect(result.output).toContain("projectId:");
    });
  });
});

// ── web3modal-to-cinacoin tests ────────────────────────────────────────────

describe("web3modal-to-cinacoin codemod", () => {
  test("renames @web3modal/react to @cinacoin/react", () => {
    const result = transformWeb3ModalToCinacoin(`import { useWeb3Modal } from "@web3modal/react";`);
    expect(result.transformed).toBe(true);
    expect(result.output).toContain("@cinacoin/react");
  });

  test("renames @web3modal/ui to @cinacoin/ui", () => {
    const result = transformWeb3ModalToCinacoin(`import { W3mButton } from "@web3modal/ui";`);
    expect(result.output).toContain("@cinacoin/ui");
  });

  test("renames @web3modal/core to @cinacoin/core-sdk", () => {
    const result = transformWeb3ModalToCinacoin(`import { core } from "@web3modal/core";`);
    expect(result.output).toContain("@cinacoin/core-sdk");
  });

  test("renames @web3modal/html to @cinacoin/html", () => {
    const result = transformWeb3ModalToCinacoin(`import { Web3Modal } from "@web3modal/html";`);
    expect(result.output).toContain("@cinacoin/html");
  });

  test("renames web3modal to @cinacoin/core-sdk", () => {
    const result = transformWeb3ModalToCinacoin(`import { init } from "web3modal";`);
    expect(result.output).toContain("@cinacoin/core-sdk");
  });

  test("renames Web3Modal to Cinacoin", () => {
    const result = transformWeb3ModalToCinacoin(`const modal = new Web3Modal({});`);
    expect(result.output).toContain("new Cinacoin");
  });

  test("renames createWeb3Modal to createCinacoin", () => {
    const result = transformWeb3ModalToCinacoin(`const m = createWeb3Modal({});`);
    expect(result.output).toContain("createCinacoin");
  });

  test("renames Web3ModalProvider to CinacoinProvider", () => {
    const result = transformWeb3ModalToCinacoin(`<Web3ModalProvider>{children}</Web3ModalProvider>`);
    expect(result.output).toContain("CinacoinProvider");
  });

  test("renames useWeb3Modal to useCinacoin", () => {
    const result = transformWeb3ModalToCinacoin(`const { open } = useWeb3Modal();`);
    expect(result.output).toContain("useCinacoin()");
  });

  test("renames useWeb3ModalState to useCinacoinState", () => {
    const result = transformWeb3ModalToCinacoin(`const state = useWeb3ModalState();`);
    expect(result.output).toContain("useCinacoinState");
  });

  test("renames useWeb3ModalTheme to useCinacoinTheme", () => {
    const result = transformWeb3ModalToCinacoin(`const theme = useWeb3ModalTheme();`);
    expect(result.output).toContain("useCinacoinTheme");
  });

  test("renames useWeb3ModalAccount to useCinacoinAccount", () => {
    const result = transformWeb3ModalToCinacoin(`const account = useWeb3ModalAccount();`);
    expect(result.output).toContain("useCinacoinAccount");
  });

  test("renames useWeb3ModalNetwork to useCinacoinNetwork", () => {
    const result = transformWeb3ModalToCinacoin(`const network = useWeb3ModalNetwork();`);
    expect(result.output).toContain("useCinacoinNetwork");
  });

  test("renames Web3ModalConfig to CinacoinConfig", () => {
    const result = transformWeb3ModalToCinacoin(`const c: Web3ModalConfig = {};`);
    expect(result.output).toContain("CinacoinConfig");
  });

  test("renames walletConnectProjectId to projectId", () => {
    const result = transformWeb3ModalToCinacoin(`{ walletConnectProjectId: "abc" }`);
    expect(result.output).toContain("projectId:");
  });

  test("renames featuredWalletIds to recommendedWallets", () => {
    const result = transformWeb3ModalToCinacoin(`{ featuredWalletIds: ["meta"] }`);
    expect(result.output).toContain("recommendedWallets:");
  });

  test("no-op on already migrated code", () => {
    const result = transformWeb3ModalToCinacoin(`import { Cinacoin } from "@cinacoin/core-sdk";`);
    expect(result.transformed).toBe(false);
  });
});

// ── ethers-v5-to-viem tests ────────────────────────────────────────────────

describe("ethers-v5-to-viem codemod", () => {
  describe("import rewrites", () => {
    test("replaces ethers import with viem", () => {
      const result = transformEthersV5ToViem(`import { ethers } from "ethers";`);
      expect(result.transformed).toBe(true);
      expect(result.output).toContain("from 'viem'");
      expect(result.output).not.toContain("from \"ethers\"");
    });

    test("replaces require('ethers') with require('viem')", () => {
      const result = transformEthersV5ToViem(`const { ethers } = require('ethers');`);
      expect(result.output).toContain("require('viem')");
    });
  });

  describe("provider rewrites", () => {
    test("replaces JsonRpcProvider with createPublicClient", () => {
      const result = transformEthersV5ToViem(`const provider = new ethers.providers.JsonRpcProvider(url);`);
      expect(result.output).toContain("createPublicClient");
    });

    test("replaces getBalance", () => {
      const result = transformEthersV5ToViem(`const bal = await provider.getBalance(addr);`);
      expect(result.output).toContain(".getBalance({ address:");
    });

    test("replaces getBlockNumber", () => {
      const result = transformEthersV5ToViem(`const num = await provider.getBlockNumber();`);
      expect(result.output).toContain(".getBlockNumber()");
    });

    test("replaces getTransaction", () => {
      const result = transformEthersV5ToViem(`const tx = await provider.getTransaction(hash);`);
      expect(result.output).toContain(".getTransaction({ hash:");
    });

    test("replaces getTransactionReceipt", () => {
      const result = transformEthersV5ToViem(`const receipt = await provider.getTransactionReceipt(hash);`);
      expect(result.output).toContain(".getTransactionReceipt({ hash:");
    });

    test("replaces getLogs", () => {
      const result = transformEthersV5ToViem(`const logs = await provider.getLogs(filter);`);
      expect(result.output).toContain(".getLogs(");
    });

    test("replaces getGasPrice", () => {
      const result = transformEthersV5ToViem(`const price = await provider.getGasPrice();`);
      expect(result.output).toContain(".getGasPrice()");
    });
  });

  describe("signer/wallet rewrites", () => {
    test("replaces ethers.Wallet with privateKeyToAccount", () => {
      const result = transformEthersV5ToViem(`const wallet = new ethers.Wallet(pk);`);
      expect(result.output).toContain("privateKeyToAccount");
    });

    test("replaces getAddress with .address", () => {
      const result = transformEthersV5ToViem(`const addr = await signer.getAddress();`);
      expect(result.output).toContain(".address");
    });

    test("replaces signMessage", () => {
      const result = transformEthersV5ToViem(`const sig = await signer.signMessage(msg);`);
      expect(result.output).toContain(".signMessage({ message:");
    });

    test("replaces sendTransaction", () => {
      const result = transformEthersV5ToViem(`const hash = await signer.sendTransaction(tx);`);
      expect(result.output).toContain(".sendTransaction({");
    });
  });

  describe("contract rewrites", () => {
    test("replaces new ethers.Contract with getContract", () => {
      const result = transformEthersV5ToViem(`const contract = new ethers.Contract(addr, abi, signer);`);
      expect(result.output).toContain("getContract({ address:");
    });
  });

  describe("ethers.utils rewrites", () => {
    test("replaces formatEther", () => {
      const result = transformEthersV5ToViem(`const eth = ethers.utils.formatEther(wei);`);
      expect(result.output).toContain("formatEther(");
      expect(result.output).not.toContain("ethers.utils.formatEther");
    });

    test("replaces parseEther", () => {
      const result = transformEthersV5ToViem(`const wei = ethers.utils.parseEther("1.0");`);
      expect(result.output).toContain("parseEther(");
    });

    test("replaces formatUnits", () => {
      const result = transformEthersV5ToViem(`const v = ethers.utils.formatUnits(amount, decimals);`);
      expect(result.output).toContain("formatUnits(");
    });

    test("replaces parseUnits", () => {
      const result = transformEthersV5ToViem(`const v = ethers.utils.parseUnits("1.0", decimals);`);
      expect(result.output).toContain("parseUnits(");
    });

    test("replaces hexlify", () => {
      const result = transformEthersV5ToViem(`const hex = ethers.utils.hexlify(num);`);
      expect(result.output).toContain("toHex(");
    });

    test("replaces isAddress", () => {
      const result = transformEthersV5ToViem(`const valid = ethers.utils.isAddress(addr);`);
      expect(result.output).toContain("isAddress(");
    });

    test("replaces keccak256", () => {
      const result = transformEthersV5ToViem(`const hash = ethers.utils.keccak256(data);`);
      expect(result.output).toContain("keccak256(");
    });

    test("replaces toUtf8Bytes", () => {
      const result = transformEthersV5ToViem(`const bytes = ethers.utils.toUtf8Bytes(str);`);
      expect(result.output).toContain("toBytes(");
    });

    test("replaces toUtf8String", () => {
      const result = transformEthersV5ToViem(`const str = ethers.utils.toUtf8String(bytes);`);
      expect(result.output).toContain("fromBytes(");
    });
  });

  describe("BigNumber rewrites", () => {
    test("replaces ethers.BigNumber.from with BigInt", () => {
      const result = transformEthersV5ToViem(`const bn = ethers.BigNumber.from(123);`);
      expect(result.output).toContain("BigInt(");
    });

    test("replaces .isZero", () => {
      const result = transformEthersV5ToViem(`const z = bn.isZero();`);
      expect(result.output).toContain("=== 0n");
    });
  });

  describe("edge cases", () => {
    test("no-op on already viem code", () => {
      const result = transformEthersV5ToViem(`import { formatEther, parseEther } from "viem";`);
      expect(result.transformed).toBe(false);
    });

    test("no-op on unrelated code", () => {
      const result = transformEthersV5ToViem(`const x = 42;`);
      expect(result.transformed).toBe(false);
    });

    test("changes array is populated", () => {
      const result = transformEthersV5ToViem(`import { ethers } from "ethers";`);
      expect(result.changes.length).toBeGreaterThan(0);
    });
  });
});

// ── wc-v1-to-v2 tests ──────────────────────────────────────────────────────

describe("wc-v1-to-v2 codemod", () => {
  describe("import renames", () => {
    test("renames @walletconnect/client to @walletconnect/sign-client", () => {
      const result = transformWcV1ToV2(`import WalletConnect from "@walletconnect/client";`);
      expect(result.transformed).toBe(true);
      expect(result.output).toContain("@walletconnect/sign-client");
    });

    test("renames @walletconnect/browser-client to @walletconnect/sign-client", () => {
      const result = transformWcV1ToV2(`import { BrowserClient } from "@walletconnect/browser-client";`);
      expect(result.output).toContain("@walletconnect/sign-client");
    });
  });

  describe("event renames", () => {
    test("renames connect event to session_proposal", () => {
      const result = transformWcV1ToV2(`provider.on('connect', handler);`);
      expect(result.transformed).toBe(true);
      expect(result.output).toContain("session_proposal");
    });

    test("renames disconnect event to session_delete", () => {
      const result = transformWcV1ToV2(`provider.on('disconnect', handler);`);
      expect(result.output).toContain("session_delete");
    });

    test("renames call_request to session_request", () => {
      const result = transformWcV1ToV2(`provider.on('call_request', handler);`);
      expect(result.output).toContain("session_request");
    });
  });

  describe("method renames", () => {
    test("renames createSession to connect", () => {
      const result = transformWcV1ToV2(`await provider.createSession();`);
      expect(result.output).toContain(".connect()");
    });

    test("renames killSession to disconnect", () => {
      const result = transformWcV1ToV2(`await provider.killSession();`);
      expect(result.output).toContain(".disconnect()");
    });
  });

  describe("bridge URL replacement", () => {
    test("replaces bridge URL with projectId", () => {
      const result = transformWcV1ToV2(`const wc = new Cinacoin({ bridge: 'https://bridge.walletconnect.org' });`);
      expect(result.output).toContain("projectId");
    });

    test("replaces bridge in config object", () => {
      const result = transformWcV1ToV2(`{ bridge: 'https://bridge.walletconnect.org' }`);
      expect(result.output).toContain("projectId");
    });
  });

  describe("edge cases", () => {
    test("no-op on already v2 code", () => {
      const result = transformWcV1ToV2(`client.on('session_proposal', handler);`);
      expect(result.transformed).toBe(false);
    });

    test("no-op on unrelated code", () => {
      const result = transformWcV1ToV2(`const x = 42;`);
      expect(result.transformed).toBe(false);
    });

    test("multiple transforms in one file", () => {
      const input = `
import WalletConnect from "@walletconnect/client";

const wc = new Cinacoin({
  bridge: 'https://bridge.walletconnect.org',
  rpc: { 1: 'https://mainnet.infura.io' }
});

wc.on('connect', onConnect);
wc.on('disconnect', onDisconnect);
await wc.createSession();
`;
      const result = transformWcV1ToV2(input);
      expect(result.transformed).toBe(true);
      expect(result.output).toContain("@walletconnect/sign-client");
      expect(result.output).toContain("session_proposal");
      expect(result.output).toContain("session_delete");
      expect(result.output).toContain(".connect()");
    });
  });
});

// ── rainbowkit-to-cinacoin tests ──────────────────────────────────────────

describe("rainbowkit-to-cinacoin codemod", () => {
  test("renames @rainbow-me/rainbowkit to @cinacoin/react", () => {
    const result = transformRainbowKitToCinacoin(`import { ConnectButton } from "@rainbow-me/rainbowkit";`);
    expect(result.transformed).toBe(true);
    expect(result.output).toContain("@cinacoin/react");
  });

  test("renames wagmi to @cinacoin/react", () => {
    const result = transformRainbowKitToCinacoin(`import { useAccount } from "wagmi";`);
    expect(result.output).toContain("@cinacoin/react");
  });

  test("renames wagmi/connectors to @cinacoin/core-sdk", () => {
    const result = transformRainbowKitToCinacoin(`import { injected } from "wagmi/connectors";`);
    expect(result.output).toContain("@cinacoin/core-sdk");
  });

  test("renames wagmi/actions to @cinacoin/core-sdk", () => {
    const result = transformRainbowKitToCinacoin(`import { getAccount } from "wagmi/actions";`);
    expect(result.output).toContain("@cinacoin/core-sdk");
  });

  test("renames RainbowKitProvider to CinacoinProvider", () => {
    const result = transformRainbowKitToCinacoin(`<RainbowKitProvider>children</RainbowKitProvider>`);
    expect(result.output).toContain("CinacoinProvider");
  });

  test("renames getDefaultConfig to createCinacoinConfig", () => {
    const result = transformRainbowKitToCinacoin(`const config = getDefaultConfig({});`);
    expect(result.output).toContain("createCinacoinConfig");
  });

  test("replaces mainnet.id with eip155:1", () => {
    const result = transformRainbowKitToCinacoin(`const chain = mainnet.id;`);
    expect(result.output).toContain("'eip155:1'");
  });

  test("replaces polygon.id with eip155:137", () => {
    const result = transformRainbowKitToCinacoin(`const chain = polygon.id;`);
    expect(result.output).toContain("'eip155:137'");
  });

  test("replaces arbitrum.id with eip155:42161", () => {
    const result = transformRainbowKitToCinacoin(`const chain = arbitrum.id;`);
    expect(result.output).toContain("'eip155:42161'");
  });

  test("replaces base.id with eip155:8453", () => {
    const result = transformRainbowKitToCinacoin(`const chain = base.id;`);
    expect(result.output).toContain("'eip155:8453'");
  });

  test("replaces injected() with 'metamask'", () => {
    const result = transformRainbowKitToCinacoin(`const connector = injected();`);
    expect(result.output).toContain("'metamask'");
  });

  test("replaces coinbaseWallet() with coinbase connector", () => {
    const result = transformRainbowKitToCinacoin(`const connector = coinbaseWallet({ appName: "My App" });`);
    expect(result.output).toContain("'coinbase'");
  });

  test("removes QueryClientProvider", () => {
    const result = transformRainbowKitToCinacoin(`<QueryClientProvider client={qc}>{children}</QueryClientProvider>`);
    expect(result.output).toContain("/* QueryClientProvider removed");
  });

  test("no-op on already migrated code", () => {
    const result = transformRainbowKitToCinacoin(`import { CinacoinProvider } from "@cinacoin/react";`);
    expect(result.transformed).toBe(false);
  });
});

// ── connectkit-to-cinacoin tests ──────────────────────────────────────────

describe("connectkit-to-cinacoin codemod", () => {
  test("renames connectkit to @cinacoin/react", () => {
    const result = transformConnectKitToCinacoin(`import { ConnectKitProvider } from "connectkit";`);
    expect(result.transformed).toBe(true);
    expect(result.output).toContain("@cinacoin/react");
  });

  test("renames ConnectKitProvider to CinacoinProvider", () => {
    const result = transformConnectKitToCinacoin(`<ConnectKitProvider>children</ConnectKitProvider>`);
    expect(result.output).toContain("CinacoinProvider");
  });

  test("renames ConnectKitButton to ConnectButton", () => {
    const result = transformConnectKitToCinacoin(`<ConnectKitButton />`);
    expect(result.output).toContain("<ConnectButton");
  });

  test("renames useConnectKit to useCinacoin", () => {
    const result = transformConnectKitToCinacoin(`const ck = useConnectKit();`);
    expect(result.output).toContain("useCinacoin()");
  });

  test("renames wagmi to @cinacoin/react", () => {
    const result = transformConnectKitToCinacoin(`import { useAccount } from "wagmi";`);
    expect(result.output).toContain("@cinacoin/react");
  });

  test("replaces walletConnectProvider with projectId", () => {
    const result = transformConnectKitToCinacoin(`{ walletConnectProvider: "abc" }`);
    expect(result.output).toContain("projectId:");
  });

  test("no-op on already migrated code", () => {
    const result = transformConnectKitToCinacoin(`import { CinacoinProvider } from "@cinacoin/react";`);
    expect(result.transformed).toBe(false);
  });
});

// ── exports / index tests ──────────────────────────────────────────────────

describe("index exports", () => {
  test("TRANSFORMS contains all codemods", () => {
    expect(TRANSFORMS).toHaveProperty("appkit-to-cinacoin");
    expect(TRANSFORMS).toHaveProperty("wc-v1-to-v2");
    expect(TRANSFORMS).toHaveProperty("rainbowkit-to-cinacoin");
    expect(TRANSFORMS).toHaveProperty("connectkit-to-cinacoin");
    expect(TRANSFORMS).toHaveProperty("web3modal-to-cinacoin");
    expect(TRANSFORMS).toHaveProperty("ethers-v5-to-viem");
  });

  test("listTransforms returns all transform names", () => {
    const transforms = listTransforms();
    expect(transforms).toContain("appkit-to-cinacoin");
    expect(transforms).toContain("wc-v1-to-v2");
    expect(transforms).toContain("rainbowkit-to-cinacoin");
    expect(transforms).toContain("connectkit-to-cinacoin");
    expect(transforms).toContain("web3modal-to-cinacoin");
    expect(transforms).toContain("ethers-v5-to-viem");
    expect(transforms.length).toBe(6);
  });

  test("each transform function is callable", () => {
    for (const [name, fn] of Object.entries(TRANSFORMS)) {
      const result = fn("const x = 1;");
      expect(result).toHaveProperty("transformed");
      expect(result).toHaveProperty("output");
      expect(result).toHaveProperty("original");
      expect(result).toHaveProperty("changes");
    }
  });

  test("hasTransform returns true for valid transforms", () => {
    expect(hasTransform("appkit-to-cinacoin")).toBe(true);
    expect(hasTransform("web3modal-to-cinacoin")).toBe(true);
    expect(hasTransform("ethers-v5-to-viem")).toBe(true);
  });

  test("hasTransform returns false for invalid transforms", () => {
    expect(hasTransform("nonexistent")).toBe(false);
    expect(hasTransform("")).toBe(false);
  });

  test("applyTransform returns null for unknown transform", () => {
    expect(applyTransform("nonexistent", "source")).toBeNull();
  });

  test("applyTransform returns result for valid transform", () => {
    const result = applyTransform("appkit-to-cinacoin", `import { Web3Modal } from "@web3modal/react";`);
    expect(result).not.toBeNull();
    expect(result!.transformed).toBe(true);
  });

  test("applyTransforms chains multiple transforms", () => {
    const input = `import WalletConnect from "@walletconnect/client";
import { Web3Modal } from "@web3modal/react";`;
    const result = applyTransforms(["wc-v1-to-v2", "appkit-to-cinacoin"], input);
    expect(result.transformsApplied.length).toBe(2);
    expect(result.changes.length).toBeGreaterThan(0);
  });

  test("applyTransforms handles empty transforms array", () => {
    const result = applyTransforms([], "const x = 1;");
    expect(result.transformsApplied.length).toBe(0);
    expect(result.changes.length).toBe(0);
    expect(result.output).toBe("const x = 1;");
  });
});

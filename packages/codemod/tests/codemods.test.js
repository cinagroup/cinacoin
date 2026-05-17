/**
 * Codemod test suite — 20+ tests covering both transforms.
 */
import { transformAppKitToCinaConnect } from "../src/codemods/appkit-to-cinaconnect.js";
import { transformWcV1ToV2 } from "../src/codemods/wc-v1-to-v2.js";
import { TRANSFORMS, listTransforms } from "../src/index.js";
// ── appkit-to-cinaconnect tests ──────────────────────────────────────────────
describe("appkit-to-cinaconnect codemod", () => {
    describe("package renames", () => {
        test("renames @reown/appkit to @cinaconnect/core", () => {
            const result = transformAppKitToCinaConnect(`import { createAppKit } from "@reown/appkit";`);
            expect(result.transformed).toBe(true);
            expect(result.output).toContain("@cinaconnect/core-sdk");
            expect(result.output).not.toContain("@reown/appkit");
        });
        test("renames @reown/appkit-react to @cinaconnect/react", () => {
            const result = transformAppKitToCinaConnect(`import { useAppKit } from "@reown/appkit-react";`);
            expect(result.output).toContain("@cinaconnect/react");
        });
        test("renames @reown/appkit-wagmi to @cinaconnect/wagmi", () => {
            const result = transformAppKitToCinaConnect(`import { wagmiAdapter } from "@reown/appkit-wagmi";`);
            expect(result.output).toContain("@cinaconnect/wagmi");
        });
        test("renames @web3modal/ethereum to @cinaconnect/ethereum", () => {
            const result = transformAppKitToCinaConnect(`import { EthereumClient } from "@web3modal/ethereum";`);
            expect(result.output).toContain("@cinaconnect/ethereum");
        });
        test("renames @web3modal/wagmi to @cinaconnect/wagmi", () => {
            const result = transformAppKitToCinaConnect(`import { WagmiAdapter } from "@web3modal/wagmi";`);
            expect(result.output).toContain("@cinaconnect/wagmi");
        });
        test("renames @web3modal/react to @cinaconnect/react", () => {
            const result = transformAppKitToCinaConnect(`import { useWeb3Modal } from "@web3modal/react";`);
            expect(result.output).toContain("@cinaconnect/react");
        });
        test("renames @web3modal/ui to @cinaconnect/ui", () => {
            const result = transformAppKitToCinaConnect(`import { W3mButton } from "@web3modal/ui";`);
            expect(result.output).toContain("@cinaconnect/ui");
        });
        test("renames @web3modal/core to @cinaconnect/core", () => {
            const result = transformAppKitToCinaConnect(`import { W3mFrameHelpers } from "@web3modal/core";`);
            expect(result.output).toContain("@cinaconnect/core-sdk");
        });
        test("renames @web3modal/html to @cinaconnect/html", () => {
            const result = transformAppKitToCinaConnect(`import { Web3Modal } from "@web3modal/html";`);
            expect(result.output).toContain("@cinaconnect/html");
        });
    });
    describe("class/function renames", () => {
        test("renames Web3Modal to CinaConnect", () => {
            const result = transformAppKitToCinaConnect(`const modal = new Web3Modal({ projectId: "abc" });`);
            expect(result.output).toContain("new CinaConnect(");
        });
        test("renames createWeb3Modal to createCinaConnect", () => {
            const result = transformAppKitToCinaConnect(`const modal = createWeb3Modal({ projectId: "abc" });`);
            expect(result.output).toContain("createCinaConnect(");
        });
        test("renames createAppKit to createCinaConnect", () => {
            const result = transformAppKitToCinaConnect(`const modal = createAppKit({ projectId: "abc" });`);
            expect(result.output).toContain("createCinaConnect(");
        });
        test("renames AppKit to CinaConnect", () => {
            const result = transformAppKitToCinaConnect(`const modal = new AppKit({ projectId: "abc" });`);
            expect(result.output).toContain("new CinaConnect(");
        });
    });
    describe("hook renames", () => {
        test("renames useWeb3Modal to useCinaConnect", () => {
            const result = transformAppKitToCinaConnect(`const { open } = useWeb3Modal();`);
            expect(result.output).toContain("useCinaConnect()");
        });
        test("renames useWeb3ModalTheme to useCinaConnectTheme", () => {
            const result = transformAppKitToCinaConnect(`const { theme } = useWeb3ModalTheme();`);
            expect(result.output).toContain("useCinaConnectTheme()");
        });
        test("renames useAppKit to useCinaConnect", () => {
            const result = transformAppKitToCinaConnect(`const { open } = useAppKit();`);
            expect(result.output).toContain("useCinaConnect()");
        });
        test("renames useAppKitAccount to useCinaConnectAccount", () => {
            const result = transformAppKitToCinaConnect(`const { address } = useAppKitAccount();`);
            expect(result.output).toContain("useCinaConnectAccount()");
        });
        test("renames useAppKitNetwork to useCinaConnectNetwork", () => {
            const result = transformAppKitToCinaConnect(`const { chainId } = useAppKitNetwork();`);
            expect(result.output).toContain("useCinaConnectNetwork()");
        });
    });
    describe("component renames", () => {
        test("renames W3mButton to CinaConnectButton", () => {
            const result = transformAppKitToCinaConnect(`<W3mButton />`);
            expect(result.output).toContain("CinaConnectButton");
        });
        test("renames W3mNetworkSelect to CinaConnectNetworkSelect", () => {
            const result = transformAppKitToCinaConnect(`<W3mNetworkSelect />`);
            expect(result.output).toContain("CinaConnectNetworkSelect");
        });
        test("renames W3mModal to CinaConnectModal", () => {
            const result = transformAppKitToCinaConnect(`<W3mModal />`);
            expect(result.output).toContain("CinaConnectModal");
        });
        test("renames AppKitButton to CinaConnectButton", () => {
            const result = transformAppKitToCinaConnect(`<AppKitButton />`);
            expect(result.output).toContain("CinaConnectButton");
        });
    });
    describe("type renames", () => {
        test("renames Web3ModalConfig to CinaConnectConfig", () => {
            const result = transformAppKitToCinaConnect(`const config: Web3ModalConfig = {};`);
            expect(result.output).toContain("CinaConnectConfig");
        });
        test("renames AppKitConfig to CinaConnectConfig", () => {
            const result = transformAppKitToCinaConnect(`const config: AppKitConfig = {};`);
            expect(result.output).toContain("CinaConnectConfig");
        });
        test("renames Web3ModalTheme to CinaConnectTheme", () => {
            const result = transformAppKitToCinaConnect(`const theme: Web3ModalTheme = { mode: "dark" };`);
            expect(result.output).toContain("CinaConnectTheme");
        });
    });
    describe("config key renames", () => {
        test("renames walletConnectProjectId to projectId", () => {
            const result = transformAppKitToCinaConnect(`{ walletConnectProjectId: "xyz" }`);
            expect(result.output).toContain("projectId:");
        });
        test("renames enableAnalytics to analytics", () => {
            const result = transformAppKitToCinaConnect(`{ enableAnalytics: true }`);
            expect(result.output).toContain("analytics:");
        });
    });
    describe("edge cases", () => {
        test("no-op on already-migrated code", () => {
            const result = transformAppKitToCinaConnect(`import { CinaConnect } from "@cinaconnect/core-sdk";`);
            expect(result.transformed).toBe(false);
        });
        test("no-op on unrelated code", () => {
            const result = transformAppKitToCinaConnect(`const x = 42;`);
            expect(result.transformed).toBe(false);
        });
        test("changes array is populated", () => {
            const result = transformAppKitToCinaConnect(`import { Web3Modal } from "@web3modal/react";`);
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
            const result = transformAppKitToCinaConnect(input);
            expect(result.transformed).toBe(true);
            expect(result.output).toContain("@cinaconnect/ethereum");
            expect(result.output).toContain("@cinaconnect/react");
            expect(result.output).toContain("createCinaConnect");
            expect(result.output).toContain("CinaConnect");
            expect(result.output).toContain("projectId:");
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
            const result = transformWcV1ToV2(`const wc = new WalletConnect({ bridge: 'https://bridge.walletconnect.org' });`);
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

const wc = new WalletConnect({
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
// ── exports / index tests ──────────────────────────────────────────────────
describe("index exports", () => {
    test("TRANSFORMS contains both codemods", () => {
        expect(TRANSFORMS).toHaveProperty("appkit-to-cinaconnect");
        expect(TRANSFORMS).toHaveProperty("wc-v1-to-v2");
    });
    test("listTransforms returns all transform names", () => {
        const transforms = listTransforms();
        expect(transforms).toContain("appkit-to-cinaconnect");
        expect(transforms).toContain("wc-v1-to-v2");
        expect(transforms.length).toBe(2);
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
});
//# sourceMappingURL=codemods.test.js.map
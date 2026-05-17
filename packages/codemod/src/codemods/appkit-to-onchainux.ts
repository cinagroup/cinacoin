/**
 * appkit-to-cinaconnect codemod
 *
 * Transforms:
 *   - @reown/appkit*     → @cinaconnect/*
 *   - @web3modal/*       → @cinaconnect/*
 *   - Web3Modal           → CinaConnect
 *   - createWeb3Modal     → createCinaConnect
 *   - AppKit              → CinaConnect
 *   - useWeb3Modal        → useCinaConnect
 *   - W3mButton           → CinaConnectButton
 *   - W3mNetworkSelect    → CinaConnectNetworkSelect
 *   - Config object keys  → CinaConnectConfig keys
 */

export interface CodemodResult {
  transformed: boolean;
  original: string;
  output: string;
  changes: string[];
}

// ── Import / require path rewrites ──────────────────────────────────────────

const PACKAGE_RENAMES: [RegExp, string][] = [
  [/@reown\/appkit-([a-z0-9-]+)/g, "@cinaconnect/$1"],
  [/@reown\/appkit/g, "@cinaconnect/core-sdk"],
  [/@web3modal\/([a-z0-9-]+)/g, "@cinaconnect/$1"],
  [/@web3modal\/ethereum/g, "@cinaconnect/ethereum"],
  [/@web3modal\/wagmi/g, "@cinaconnect/wagmi"],
  [/@web3modal\/react/g, "@cinaconnect/react"],
  [/@web3modal\/ui/g, "@cinaconnect/ui"],
  [/@web3modal\/core/g, "@cinaconnect/core-sdk"],
  [/@web3modal\/html/g, "@cinaconnect/html"],
];

// ── Component / function name rewrites ──────────────────────────────────────

const IDENTIFIER_RENAMES: [RegExp, string][] = [
  // Core classes / factories
  [/Web3Modal\b/g, "CinaConnect"],
  [/createWeb3Modal\b/g, "createCinaConnect"],
  [/createAppKit\b/g, "createCinaConnect"],
  [/AppKit\b/g, "CinaConnect"],

  // Hooks
  [/useWeb3Modal\b/g, "useCinaConnect"],
  [/useWeb3ModalState\b/g, "useCinaConnectState"],
  [/useWeb3ModalTheme\b/g, "useCinaConnectTheme"],
  [/useAppKit\b/g, "useCinaConnect"],
  [/useAppKitState\b/g, "useCinaConnectState"],
  [/useAppKitTheme\b/g, "useCinaConnectTheme"],
  [/useAppKitAccount\b/g, "useCinaConnectAccount"],
  [/useAppKitNetwork\b/g, "useCinaConnectNetwork"],

  // Components
  [/w3m-button\b/gi, "cinaconnect-button"],
  [/W3mButton\b/g, "CinaConnectButton"],
  [/w3m-network-select\b/gi, "cinaconnect-network-select"],
  [/W3mNetworkSelect\b/g, "CinaConnectNetworkSelect"],
  [/w3m-modal\b/gi, "cinaconnect-modal"],
  [/W3mModal\b/g, "CinaConnectModal"],
  [/app-kit-button\b/gi, "cinaconnect-button"],
  [/AppKitButton\b/g, "CinaConnectButton"],

  // Type names
  [/Web3ModalConfig\b/g, "CinaConnectConfig"],
  [/AppKitConfig\b/g, "CinaConnectConfig"],
  [/Web3ModalTheme\b/g, "CinaConnectTheme"],
  [/AppKitTheme\b/g, "CinaConnectTheme"],
];

// ── Config key rewrites ────────────────────────────────────────────────────

const CONFIG_KEY_RENAMES: [RegExp, string][] = [
  [/projectId\b/g, "projectId"], // stays the same — already correct
  [/walletConnectProjectId\b/g, "projectId"],
  [/enableAnalytics\b/g, "analytics"],
  [/themeMode\b/g, "themeMode"],
  [/themeVariables\b/g, "themeVariables"],
  [/featuredWalletIds\b/g, "featuredWalletIds"],
  [/excludeWalletIds\b/g, "excludeWalletIds"],
  [/defaultChain\b/g, "defaultChain"],
  [/chains\b/g, "chains"],
  [/tokens\b/g, "tokens"],
  [/allowUnsupportedChain\b/g, "allowUnsupportedChain"],
];

// ── Main transform ──────────────────────────────────────────────────────────

/**
 * Apply the AppKit/Web3Modal → CinaConnect transformation to source text.
 */
export function transformAppKitToCinaConnect(source: string): CodemodResult {
  let output = source;
  const changes: string[] = [];

  // 1. Package imports/requires
  for (const [pattern, replacement] of PACKAGE_RENAMES) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      const match = before.match(pattern);
      if (match) changes.push(`Renamed package: ${match[0]} → ${replacement}`);
    }
  }

  // 2. Identifiers (components, hooks, classes)
  for (const [pattern, replacement] of IDENTIFIER_RENAMES) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      const match = before.match(pattern);
      if (match) changes.push(`Renamed identifier: ${match[0]} → ${replacement}`);
    }
  }

  // 3. Config keys (only in config-like contexts, applied globally for safety)
  for (const [pattern, replacement] of CONFIG_KEY_RENAMES) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      changes.push(`Renamed config key: ${pattern.source} → ${replacement}`);
    }
  }

  return {
    transformed: output !== source,
    original: source,
    output,
    changes,
  };
}

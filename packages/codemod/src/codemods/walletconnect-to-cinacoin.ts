/**
 * walletconnect-to-cinacoin codemod
 *
 * Transforms @walletconnect/* → @cinacoin/*:
 *   import { SignClient } from '@walletconnect/sign-client'
 *     → import { SignClient } from '@cinacoin/sign-client'
 *   import { Core } from '@walletconnect/core'
 *     → import { Core } from '@cinacoin/core'
 *   import @walletconnect/ethereum-provider
 *     → import @cinacoin/ethereum-provider
 *   etc.
 */

export interface CodemodResult {
  transformed: boolean;
  original: string;
  output: string;
  changes: string[];
}

// ── Package import / require rewrites ──────────────────────────────────────

const PACKAGE_RENAMES: [RegExp, string][] = [
  [/@walletconnect\/sign-client/g, "@cinacoin/sign-client"],
  [/@walletconnect\/core/g, "@cinacoin/core-sdk"],
  [/@walletconnect\/ethereum-provider/g, "@cinacoin/ethereum-provider"],
  [/@walletconnect\/universal-provider/g, "@cinacoin/universal-provider"],
  [/@walletconnect\/web3wallet/g, "@cinacoin/web3wallet"],
  [/@walletconnect\/web3modal/g, "@cinacoin/web3modal"],
  [/@walletconnect\/modal/g, "@cinacoin/modal"],
  [/@walletconnect\/modal-core/g, "@cinacoin/modal-core"],
  [/@walletconnect\/modal-ui/g, "@cinacoin/modal-ui"],
  [/@walletconnect\/relay-api/g, "@cinacoin/relay-api"],
  [/@walletconnect\/relay-auth/g, "@cinacoin/relay-auth"],
  [/@walletconnect\/types/g, "@cinacoin/types"],
  [/@walletconnect\/utils/g, "@cinacoin/utils"],
  [/@walletconnect\/client/g, "@cinacoin/sign-client"],
  [/@walletconnect\/qrcode-modal/g, "@cinacoin/qrcode-modal"],
];

// ── API surface renames ────────────────────────────────────────────────────

const IDENTIFIER_RENAMES: [RegExp, string][] = [
  // Cinacoin class names
  [/Cinacoin\b/g, "CinacoinWallet"],
  [/CinacoinModal\b/g, "CinacoinModal"],
  [/CinacoinProvider\b/g, "CinacoinProvider"],
  [/CinacoinClient\b/g, "CinacoinClient"],

  // Method names
  [/formatUri\b/g, "formatUri"],
  [/parseUri\b/g, "parseUri"],
  [/getAccounts\b/g, "getAccounts"],
  [/switchChain\b/g, "switchChain"],
];

// ── Main transform ──────────────────────────────────────────────────────────

export function transformCinacoinToCinacoin(source: string): CodemodResult {
  let output = source;
  const changes: string[] = [];

  for (const [pattern, replacement] of PACKAGE_RENAMES) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      const match = before.match(pattern);
      if (match) changes.push(`Renamed package: ${match[0]} → ${replacement}`);
    }
  }

  for (const [pattern, replacement] of IDENTIFIER_RENAMES) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      const match = before.match(pattern);
      if (match) changes.push(`Renamed identifier: ${match[0]} → ${replacement}`);
    }
  }

  return {
    transformed: output !== source,
    original: source,
    output,
    changes,
  };
}

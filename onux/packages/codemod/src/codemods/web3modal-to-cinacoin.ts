/**
 * web3modal-to-cinacoin codemod
 *
 * Transforms:
 *   import { Web3Modal } from '@web3modal/html'  → import { Cinacoin } from '@cinacoin/html'
 *   import { useWeb3Modal } from '@web3modal/react' → import { useCinacoin } from '@cinacoin/react'
 *   new Web3Modal(...) → new Cinacoin(...)
 *   web3Modal.* → cinacoin.*
 */

export interface CodemodResult {
  transformed: boolean;
  original: string;
  output: string;
  changes: string[];
}

const PACKAGE_RENAMES: [RegExp, string][] = [
  [/@web3modal\/html/g, "@cinacoin/html"],
  [/@web3modal\/react/g, "@cinacoin/react"],
  [/@web3modal\/core/g, "@cinacoin/core-sdk"],
  [/@web3modal\/ethereum/g, "@cinacoin/ethereum"],
  [/@web3modal\/wagmi/g, "@cinacoin/wagmi"],
  [/@web3modal\/solana/g, "@cinacoin/solana"],
  [/@web3modal\/ui/g, "@cinacoin/ui"],
  [/@web3modal\/scaffold/g, "@cinacoin/scaffold"],
  [/@web3modal\/scaffold-react/g, "@cinacoin/scaffold-react"],
  [/@web3modal\/scaffold-utils/g, "@cinacoin/scaffold-utils"],
];

const IDENTIFIER_RENAMES: [RegExp, string][] = [
  [/Web3Modal\b/g, "Cinacoin"],
  [/createWeb3Modal\b/g, "createCinacoin"],
  [/useWeb3Modal\b/g, "useCinacoin"],
  [/useWeb3ModalState\b/g, "useCinacoinState"],
  [/useWeb3ModalTheme\b/g, "useCinacoinTheme"],
  [/useWeb3ModalAccount\b/g, "useCinacoinAccount"],
  [/w3m-button\b/gi, "cinacoin-button"],
  [/W3mButton\b/g, "CinacoinButton"],
  [/w3m-modal\b/gi, "cinacoin-modal"],
  [/W3mModal\b/g, "CinacoinModal"],
  [/w3m-network-button\b/gi, "cinacoin-network-button"],
  [/W3mNetworkButton\b/g, "CinacoinNetworkButton"],
  [/web3Modal\b/g, "cinacoin"],
  [/web3modal\b/g, "cinacoin"],
  [/Web3ModalConfig\b/g, "CinacoinConfig"],
  [/Web3ModalTheme\b/g, "CinacoinTheme"],
  [/Web3ModalNetwork\b/g, "CinacoinNetwork"],
];

export function transformWeb3ModalToCinacoin(source: string): CodemodResult {
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

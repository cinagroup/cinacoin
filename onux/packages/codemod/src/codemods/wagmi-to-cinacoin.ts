/**
 * wagmi-to-cinacoin codemod
 *
 * Transforms wagmi hooks → cinacoin/react hooks:
 *   import { useAccount } from 'wagmi' → import { useAccount } from '@cinacoin/react'
 *   import { useConnect } from 'wagmi' → import { useConnect } from '@cinacoin/react'
 *   import { useDisconnect } from 'wagmi' → import { useDisconnect } from '@cinacoin/react'
 *   import { useSignMessage } from 'wagmi' → import { useSignMessage } from '@cinacoin/react'
 *   etc.
 *
 * Also transforms connector references:
 *   import { injected } from 'wagmi/connectors' → import { injected } from '@cinacoin/connectors'
 *   import { walletConnect } from 'wagmi/connectors' → import { walletConnect } from '@cinacoin/connectors'
 */

export interface CodemodResult {
  transformed: boolean;
  original: string;
  output: string;
  changes: string[];
}

const PACKAGE_RENAMES: [RegExp, string][] = [
  [/from\s+['"]wagmi['"]/g, "from '@cinacoin/react'"],
  [/from\s+['"]wagmi\/actions['"]/g, "from '@cinacoin/react/actions'"],
  [/from\s+['"]wagmi\/connectors['"]/g, "from '@cinacoin/connectors'"],
  [/from\s+['"]wagmi\/chains['"]/g, "from '@cinacoin/chains'"],
  [/from\s+['"]wagmi\/utils['"]/g, "from '@cinacoin/utils'"],
  [/from\s+['"]wagmi\/query['"]/g, "from '@cinacoin/query'"],
];

const IDENTIFIER_RENAMES: [RegExp, string][] = [
  [/useAccount\b/g, "useAccount"],
  [/useConnect\b/g, "useConnect"],
  [/useDisconnect\b/g, "useDisconnect"],
  [/useSignMessage\b/g, "useSignMessage"],
  [/useSignTypedData\b/g, "useSignTypedData"],
  [/useSendTransaction\b/g, "useSendTransaction"],
  [/useWriteContract\b/g, "useWriteContract"],
  [/useReadContract\b/g, "useReadContract"],
  [/useSwitchChain\b/g, "useSwitchChain"],
  [/useBalance\b/g, "useBalance"],
  [/useNetwork\b/g, "useNetwork"],
  [/useFeeData\b/g, "useFeeData"],
  [/usePrepareSendTransaction\b/g, "usePrepareSendTransaction"],
  [/useWaitForTransactionReceipt\b/g, "useWaitForTransactionReceipt"],
  [/useSimulateContract\b/g, "useSimulateContract"],
  [/useContractRead\b/g, "useContractRead"],
  [/useContractWrite\b/g, "useContractWrite"],
  [/useEnsName\b/g, "useEnsName"],
  [/useEnsAddress\b/g, "useEnsAddress"],
  [/useEnsAvatar\b/g, "useEnsAvatar"],
  [/usePublicClient\b/g, "usePublicClient"],
  [/useWalletClient\b/g, "useWalletClient"],
];

const CONNECTOR_RENAMES: [RegExp, string][] = [
  [/injected\(\)/g, "injected()"],
  [/walletConnect\(/g, "walletConnect("],
  [/coinbaseWallet\(/g, "coinbaseWallet("],
  [/safe\(\)/g, "safe()"],
  [/metaMask\(/g, "metaMask("],
  [/walletConnectLegacy\(/g, "walletConnect("],
];

const CHAIN_RENAMES: [RegExp, string][] = [
  [/mainnet\b/g, "mainnet"],
  [/polygon\b/g, "polygon"],
  [/arbitrum\b/g, "arbitrum"],
  [/optimism\b/g, "optimism"],
  [/base\b/g, "base"],
  [/bsc\b/g, "bsc"],
];

export function transformWagmiToCinacoin(source: string): CodemodResult {
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
      if (match) changes.push(`Preserved hook name: ${match[0]}`);
    }
  }

  for (const [pattern, replacement] of CONNECTOR_RENAMES) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      const match = before.match(pattern);
      if (match) changes.push(`Connector: ${match[0]}`);
    }
  }

  for (const [pattern, replacement] of CHAIN_RENAMES) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      const match = before.match(pattern);
      if (match) changes.push(`Chain: ${match[0]}`);
    }
  }

  return {
    transformed: output !== source,
    original: source,
    output,
    changes,
  };
}

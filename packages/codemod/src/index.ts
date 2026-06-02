/**
 * @cinacoin/codemod — Codemods for migrating to Cinacoin
 *
 * CLI entry point that discovers and runs codemods.
 *
 * ## Usage
 * ```bash
 * npx @cinacoin/codemod <transform> <path>
 * ```
 */

import { transformAppKitToCinacoin, CodemodResult as AppKitCodemodResult } from "./codemods/appkit-to-onchainux.js";
import { transformWcV1ToV2, CodemodResult as WcCodemodResult } from "./codemods/wc-v1-to-v2.js";
import { transformRainbowKitToCinacoin, CodemodResult as RainbowKitCodemodResult } from "./codemods/rainbowkit-to-cinacoin.js";
import { transformConnectKitToCinacoin, CodemodResult as ConnectKitCodemodResult } from "./codemods/connectkit-to-cinacoin.js";
import { transformWeb3ModalToCinacoin, CodemodResult as Web3ModalCodemodResult } from "./codemods/web3modal-to-cinacoin.js";
import { transformEthersV5ToViem, CodemodResult as EthersViemCodemodResult } from "./codemods/ethers-v5-to-viem.js";

// Re-export everything
export { transformAppKitToCinacoin, AppKitCodemodResult };
export { transformWcV1ToV2, WcCodemodResult };
export { transformRainbowKitToCinacoin, RainbowKitCodemodResult };
export { transformConnectKitToCinacoin, ConnectKitCodemodResult };
export { transformWeb3ModalToCinacoin, Web3ModalCodemodResult };
export { transformEthersV5ToViem, EthersViemCodemodResult };

/** Codemod result type */
export interface CodemodResult {
  transformed: boolean;
  original: string;
  output: string;
  changes: string[];
}

/** Map of transform name → transform function */
export const TRANSFORMS: Record<string, (source: string) => CodemodResult> = {
  "appkit-to-cinacoin": transformAppKitToCinacoin,
  "wc-v1-to-v2": transformWcV1ToV2,
  "rainbowkit-to-cinacoin": transformRainbowKitToCinacoin,
  "connectkit-to-cinacoin": transformConnectKitToCinacoin,
  "web3modal-to-cinacoin": transformWeb3ModalToCinacoin,
  "ethers-v5-to-viem": transformEthersV5ToViem,
};

/** List all available transform names */
export function listTransforms(): string[] {
  return Object.keys(TRANSFORMS);
}

/** Check if a transform exists */
export function hasTransform(name: string): boolean {
  return name in TRANSFORMS;
}

/** Apply a single transform by name */
export function applyTransform(name: string, source: string): CodemodResult | null {
  const fn = TRANSFORMS[name];
  if (!fn) return null;
  return fn(source);
}

/** Apply multiple transforms in order */
export function applyTransforms(
  names: string[],
  source: string
): { output: string; changes: string[]; transformsApplied: string[] } {
  let output = source;
  const changes: string[] = [];
  const transformsApplied: string[] = [];

  for (const name of names) {
    const result = applyTransform(name, output);
    if (result && result.transformed) {
      output = result.output;
      changes.push(...result.changes.map((c) => `[${name}] ${c}`));
      transformsApplied.push(name);
    }
  }

  return { output, changes, transformsApplied };
}

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
/**
 * Apply the AppKit/Web3Modal → CinaConnect transformation to source text.
 */
export declare function transformAppKitToCinaConnect(source: string): CodemodResult;
//# sourceMappingURL=appkit-to-onchainux.d.ts.map
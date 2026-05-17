/**
 * Swap operation factory.
 *
 * Integrates with the swap-sdk for DEX routing data.
 */
export function createSwapOperation(params) {
    return {
        type: 'swap',
        chainId: params.chainId,
        from: params.from,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        minToAmount: params.minToAmount,
        routerAddress: params.routerAddress,
        routeData: params.routeData,
        label: params.label,
    };
}
//# sourceMappingURL=swap.js.map
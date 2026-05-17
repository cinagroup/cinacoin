/**
 * Transfer operation factory.
 */
export function createTransferOperation(params) {
    return {
        type: 'transfer',
        chainId: params.chainId,
        from: params.from,
        to: params.to,
        value: params.value,
        tokenAddress: params.tokenAddress,
        label: params.label,
    };
}
//# sourceMappingURL=transfer.js.map
/**
 * Approve operation factory.
 */
export function createApproveOperation(params) {
    return {
        type: 'approve',
        chainId: params.chainId,
        from: params.from,
        tokenAddress: params.tokenAddress,
        spender: params.spender,
        amount: params.amount,
        label: params.label,
    };
}
//# sourceMappingURL=approve.js.map
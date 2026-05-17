/**
 * Custom operation factory for arbitrary contract calls.
 */
export function createCustomOperation(params) {
    return {
        type: 'custom',
        chainId: params.chainId,
        from: params.from,
        to: params.to,
        data: params.data,
        value: params.value,
        label: params.label,
    };
}
//# sourceMappingURL=custom.js.map
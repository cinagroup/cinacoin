import type { TokenInfo, TokenSource, TokenList } from '../types.js';
export interface LocalSourceOptions {
    tokenList?: TokenList;
    tokens?: TokenInfo[];
}
/**
 * Local token list source.
 * Accepts a static TokenList or array of TokenInfo for custom tokens.
 */
export declare class LocalSource implements TokenSource {
    readonly name = "local";
    private tokenList;
    constructor(options?: LocalSourceOptions);
    fetch(): Promise<TokenInfo[]>;
    /**
     * Add a token to the local list.
     */
    addToken(token: TokenInfo): void;
    /**
     * Remove a token by address and chainId.
     */
    removeToken(address: string, chainId: number): boolean;
    /**
     * Get the full token list object.
     */
    getTokenList(): TokenList;
    /**
     * Merge another TokenList into this one.
     */
    merge(other: TokenList): void;
}
//# sourceMappingURL=local.d.ts.map
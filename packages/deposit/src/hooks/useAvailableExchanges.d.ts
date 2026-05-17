import { ExchangeInfo } from "../types";
export interface UseAvailableExchangesOptions {
    /** Filter to exchanges that support this chain/network. */
    network?: string;
    /** Filter to exchanges that support this address format. */
    address?: string;
}
/**
 * Hook that returns a filtered list of available exchanges
 * based on the user's target chain and/or address.
 *
 * @example
 * ```tsx
 * const { exchanges, isAvailable } = useAvailableExchanges({ network: "base" });
 * ```
 */
export declare function useAvailableExchanges(options?: UseAvailableExchangesOptions): {
    /** Filtered list of exchanges matching the criteria. */
    exchanges: ExchangeInfo[];
    /** Whether a specific exchange ID is available. */
    isAvailable: (exchangeId: string) => boolean;
};
//# sourceMappingURL=useAvailableExchanges.d.ts.map
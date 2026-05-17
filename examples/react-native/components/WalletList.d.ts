interface WalletInfo {
    id: string;
    name: string;
    icon: string;
    installed: boolean;
    recommended?: boolean;
    downloadUrl?: string;
}
interface WalletListProps {
    wallets: WalletInfo[];
    onSelect: (wallet: WalletInfo) => void;
    recommended?: string[];
}
export declare function WalletList({ wallets, onSelect, recommended }: WalletListProps): JSX.Element;
export {};
//# sourceMappingURL=WalletList.d.ts.map
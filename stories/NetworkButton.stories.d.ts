import type { Meta, StoryObj } from '@storybook/react';
interface NetworkButtonProps {
    /** Network identifier (eth, arb, base, polygon, etc.). */
    network: string;
    /** Network name override. */
    label?: string;
    /** Whether the network is currently active/connected. */
    isActive?: boolean;
    /** Show chain ID. */
    showChainId?: boolean;
    /** Visual size. */
    size?: 'sm' | 'md' | 'lg';
    /** Custom class. */
    className?: string;
    /** Click handler. */
    onClick?: () => void;
}
declare function NetworkButton({ network, label, isActive, showChainId, size, className, onClick, }: NetworkButtonProps): JSX.Element;
declare const meta: Meta<typeof NetworkButton>;
export default meta;
type Story = StoryObj<typeof NetworkButton>;
/** Default — Ethereum. */
export declare const Default: Story;
/** Ethereum (active). */
export declare const Ethereum: Story;
/** Arbitrum. */
export declare const Arbitrum: Story;
/** Base. */
export declare const Base: Story;
/** Polygon. */
export declare const Polygon: Story;
/** Optimism. */
export declare const Optimism: Story;
/** BNB Chain. */
export declare const BSC: Story;
/** Solana. */
export declare const Solana: Story;
/** Custom label. */
export declare const CustomLabel: Story;
/** All networks grid. */
export declare const AllNetworks: Story;
/** All networks active — Ethereum. */
export declare const AllNetworksActive: Story;
//# sourceMappingURL=NetworkButton.stories.d.ts.map
import type { Meta, StoryObj } from '@storybook/react';
interface AccountButtonProps {
    /** Wallet address to display. */
    address?: string;
    /** Account balance string. */
    balance?: string;
    /** Chain symbol (ETH, MATIC, etc.). */
    chainSymbol?: string;
    /** Visual size. */
    size?: 'sm' | 'md' | 'lg';
    /** Show balance. */
    showBalance?: boolean;
    /** Show avatar. */
    showAvatar?: boolean;
    /** Whether account is in loading state. */
    isLoading?: boolean;
    /** Custom class. */
    className?: string;
    /** Click handler. */
    onClick?: () => void;
}
declare function AccountButton({ address, balance, chainSymbol, size, showBalance, showAvatar, isLoading, className, onClick, }: AccountButtonProps): JSX.Element;
declare const meta: Meta<typeof AccountButton>;
export default meta;
type Story = StoryObj<typeof AccountButton>;
/** Default — no account connected. */
export declare const Default: Story;
/** With address only. */
export declare const WithAddress: Story;
/** With balance. */
export declare const WithBalance: Story;
/** Without balance (address only). */
export declare const WithoutBalance: Story;
/** Loading state. */
export declare const Loading: Story;
/** Small size. */
export declare const Small: Story;
/** Large size. */
export declare const Large: Story;
//# sourceMappingURL=AccountButton.stories.d.ts.map
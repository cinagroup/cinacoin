import type { Meta, StoryObj } from '@storybook/react';
import { ConnectButton } from '../packages/react/src/ConnectButton';
declare const meta: Meta<typeof ConnectButton>;
export default meta;
type Story = StoryObj<typeof ConnectButton>;
/** Default disconnected state. */
export declare const Default: Story;
/** Disabled button. */
export declare const Disabled: Story;
/** Loading / connecting state. */
export declare const Loading: Story;
/** Connected state with balance and avatar. */
export declare const Connected: Story;
/** Secondary variant. */
export declare const SecondaryVariant: Story;
/** Ghost variant. */
export declare const GhostVariant: Story;
/** Large size. */
export declare const Large: Story;
/** Small size. */
export declare const Small: Story;
/** Dark mode variant. */
export declare const DarkMode: Story;
/** Error state. */
export declare const ErrorState: Story;
//# sourceMappingURL=ConnectButton.stories.d.ts.map
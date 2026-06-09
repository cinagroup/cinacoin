import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'primary-sm', 'secondary-sm', 'nav-cta', 'tab-ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Get Started',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Learn More',
  },
};

export const PrimarySmall: Story = {
  args: {
    variant: 'primary-sm',
    children: 'Small Button',
  },
};

export const SecondarySmall: Story = {
  args: {
    variant: 'secondary-sm',
    children: 'Small Secondary',
  },
};

export const NavCTA: Story = {
  args: {
    variant: 'nav-cta',
    children: 'Sign Up',
  },
};

export const TabGhost: Story = {
  args: {
    variant: 'tab-ghost',
    children: 'Tab Item',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="primary-sm">Primary SM</Button>
      <Button variant="secondary-sm">Secondary SM</Button>
      <Button variant="nav-cta">Nav CTA</Button>
      <Button variant="tab-ghost">Tab Ghost</Button>
    </div>
  ),
};

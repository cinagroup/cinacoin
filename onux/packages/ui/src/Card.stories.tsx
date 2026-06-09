import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'soft', 'featured', 'lg'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a default card',
  },
};

export const Soft: Story = {
  args: {
    variant: 'soft',
    children: 'This is a soft card',
  },
};

export const Featured: Story = {
  args: {
    variant: 'featured',
    children: 'This is a featured card',
  },
};

export const Large: Story = {
  args: {
    variant: 'lg',
    children: 'This is a large card',
  },
};

export const WithHeader: Story = {
  args: {
    header: <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Card Title</h3>,
    children: 'Card content goes here',
  },
};

export const WithFooter: Story = {
  args: {
    children: 'Card content',
    footer: (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--cc-hairline)', background: 'transparent', cursor: 'pointer' }}>
          Cancel
        </button>
        <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--cc-primary)', color: 'var(--cc-on-primary)', cursor: 'pointer' }}>
          Save
        </button>
      </div>
    ),
  },
};

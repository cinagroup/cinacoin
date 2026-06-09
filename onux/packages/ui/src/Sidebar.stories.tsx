import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';
import type { SidebarItem } from './Sidebar';

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems: SidebarItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    active: true,
  },
  {
    key: 'projects',
    label: 'Projects',
    children: [
      { key: 'project-1', label: 'Project Alpha', href: '#' },
      { key: 'project-2', label: 'Project Beta', href: '#' },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    badge: <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: 'var(--cc-primary)', color: 'var(--cc-on-primary)' }}>New</span>,
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '#',
  },
];

export const Default: Story = {
  args: {
    items: sampleItems,
  },
};

export const Collapsed: Story = {
  args: {
    items: sampleItems,
    collapsed: true,
  },
};

export const WithHeader: Story = {
  args: {
    items: sampleItems,
    header: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--cc-primary)',
          color: 'var(--cc-on-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
        }}>
          C
        </div>
        <span style={{ fontWeight: 600 }}>Cinacoin</span>
      </div>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    items: sampleItems,
    footer: (
      <div style={{ fontSize: '12px', color: 'var(--cc-muted)' }}>
        © 2026 Cinacoin
      </div>
    ),
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { GlobalHeader } from './GlobalHeader';
import type { NavItem, User } from './GlobalHeader';

const meta = {
  title: 'Layout/GlobalHeader',
  component: GlobalHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GlobalHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '#products' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
};

export const Default: Story = {
  args: {
    navItems: sampleNavItems,
    cta: { label: 'Get Started', href: '#' },
    secondaryCta: { label: 'Log In', href: '#' },
  },
};

export const WithThemeToggle: Story = {
  args: {
    navItems: sampleNavItems,
    theme: 'light',
    onToggleTheme: () => console.log('Toggle theme'),
    cta: { label: 'Get Started', href: '#' },
  },
};

export const Authenticated: Story = {
  args: {
    navItems: sampleNavItems,
    auth: {
      user: mockUser,
      isAuthenticated: true,
      login: () => console.log('Login'),
      logout: () => console.log('Logout'),
    },
  },
};

export const WithPermissions: Story = {
  args: {
    navItems: [
      ...sampleNavItems,
      { label: 'Admin', href: '/admin', requireAuth: true, permission: 'admin' },
    ],
    permissions: ['admin'],
    auth: {
      user: mockUser,
      isAuthenticated: true,
      login: () => {},
      logout: () => {},
    },
  },
};

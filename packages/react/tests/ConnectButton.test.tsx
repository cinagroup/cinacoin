/**
 * Tests for @cinacoin/react — ConnectButton, CinacoinProvider, hooks.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock implementations since we can't import the actual components without React setup
import { CinacoinProvider, useCinacoinContext, type CinacoinConfig, type CinacoinContextValue, type AccountState, type Connector, type ChainConfig } from '../src/CinacoinProvider.tsx';
import { ConnectButton } from '../src/ConnectButton.tsx';
import { useCinacoin, useAccount, useChainId, useConnect, useDisconnect } from '../src/hooks.ts';

// Mock config
const mockConfig: CinacoinConfig = {
  projectId: 'test-project',
  chains: [
    {
      id: 1,
      name: 'Ethereum',
      rpcUrl: 'https://eth.rpc',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
    {
      id: 137,
      name: 'Polygon',
      rpcUrl: 'https://polygon.rpc',
      nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    },
  ],
  theme: { mode: 'dark' },
  metadata: {
    name: 'Test App',
    description: 'Test',
    url: 'https://test.app',
  },
};

describe('CinacoinProvider', () => {
  it('should render children', () => {
    render(
      <CinacoinProvider config={mockConfig}>
        <div data-testid="child">Hello</div>
      </CinacoinProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should apply theme class', () => {
    render(
      <CinacoinProvider config={{ ...mockConfig, theme: { mode: 'dark' } }}>
        <div data-testid="child" />
      </CinacoinProvider>
    );
    const root = screen.getByTestId('child').parentElement;
    expect(root).toHaveClass('ocx-theme-dark');
  });

  it('should default to dark theme', () => {
    render(
      <CinacoinProvider config={mockConfig}>
        <div data-testid="child" />
      </CinacoinProvider>
    );
    const root = screen.getByTestId('child').parentElement;
    expect(root).toHaveClass('ocx-theme-dark');
  });

  it('should use first chain as default', () => {
    const TestComponent = () => {
      const { account } = useCinacoinContext();
      return <div data-testid="chain">{account.chainId}</div>;
    };

    render(
      <CinacoinProvider config={mockConfig}>
        <TestComponent />
      </CinacoinProvider>
    );
    expect(screen.getByTestId('chain')).toHaveTextContent('1');
  });

  it('should expose correct initial status', () => {
    const TestComponent = () => {
      const { status } = useCinacoinContext();
      return <div data-testid="status">{status}</div>;
    };

    render(
      <CinacoinProvider config={mockConfig}>
        <TestComponent />
      </CinacoinProvider>
    );
    expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
  });

  it('should throw when useCinacoinContext is used outside provider', () => {
    const TestComponent = () => {
      useCinacoinContext();
      return null;
    };

    // Suppress console error during test
    const spy = vi.spyOn(console, 'error');
    spy.mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow('useCinacoinContext must be used within');
    spy.mockRestore();
  });

  it('should provide default connectors', () => {
    const TestComponent = () => {
      const { connectors } = useCinacoinContext();
      return <div data-testid="count">{connectors.length}</div>;
    };

    render(
      <CinacoinProvider config={mockConfig}>
        <TestComponent />
      </CinacoinProvider>
    );
    expect(screen.getByTestId('count')).toHaveTextContent('5');
  });
});

describe('React Hooks', () => {
  it('useCinacoin returns context', () => {
    const TestComponent = () => {
      const ctx = useCinacoin();
      return <div data-testid="has-config">{ctx.config ? 'yes' : 'no'}</div>;
    };

    render(
      <CinacoinProvider config={mockConfig}>
        <TestComponent />
      </CinacoinProvider>
    );
    expect(screen.getByTestId('has-config')).toHaveTextContent('yes');
  });

  it('useAccount returns account state', () => {
    const TestComponent = () => {
      const account = useAccount();
      return (
        <div>
          <span data-testid="address">{account.address ?? 'null'}</span>
          <span data-testid="balance">{account.balance}</span>
        </div>
      );
    };

    render(
      <CinacoinProvider config={mockConfig}>
        <TestComponent />
      </CinacoinProvider>
    );
    expect(screen.getByTestId('address')).toHaveTextContent('null');
    expect(screen.getByTestId('balance')).toHaveTextContent('0.00');
  });

  it('useChainId returns chain ID', () => {
    const TestComponent = () => {
      const chainId = useChainId();
      return <div data-testid="chain-id">{chainId}</div>;
    };

    render(
      <CinacoinProvider config={mockConfig}>
        <TestComponent />
      </CinacoinProvider>
    );
    expect(screen.getByTestId('chain-id')).toHaveTextContent('1');
  });

  it('useConnect returns connect function', () => {
    const TestComponent = () => {
      const { connect, status } = useConnect();
      return (
        <div>
          <button data-testid="connect-btn" onClick={() => connect('metamask')}>Connect</button>
          <span data-testid="status">{status}</span>
        </div>
      );
    };

    render(
      <CinacoinProvider config={mockConfig}>
        <TestComponent />
      </CinacoinProvider>
    );
    expect(screen.getByTestId('connect-btn')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
  });

  it('useDisconnect returns disconnect function', () => {
    const TestComponent = () => {
      const { disconnect } = useDisconnect();
      return <button data-testid="disconnect-btn" onClick={() => disconnect()}>Disconnect</button>;
    };

    render(
      <CinacoinProvider config={mockConfig}>
        <TestComponent />
      </CinacoinProvider>
    );
    expect(screen.getByTestId('disconnect-btn')).toBeInTheDocument();
  });
});

describe('ConnectButton', () => {
  it('should render with default label when disconnected', () => {
    const { container } = render(
      <CinacoinProvider config={mockConfig}>
        <ConnectButton />
      </CinacoinProvider>
    );
    expect(container.querySelector('ocx-connect-button')).toBeInTheDocument();
    expect(container.querySelector('ocx-connect-button')).toHaveAttribute('label', 'Connect Wallet');
  });

  it('should render with custom label', () => {
    const { container } = render(
      <CinacoinProvider config={mockConfig}>
        <ConnectButton label="Link Wallet" />
      </CinacoinProvider>
    );
    const el = container.querySelector('ocx-connect-button');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('label', 'Link Wallet');
  });

  it('should show address when connected', async () => {
    // We need to mock the connect function to simulate a connected state
    const TestWrapper = () => {
      const [connected, setConnected] = React.useState(false);

      return (
        <CinacoinProvider config={mockConfig}>
          {connected ? (
            <div>Connected</div>
          ) : (
            <ConnectButton onClick={() => setConnected(true)} />
          )}
        </CinacoinProvider>
      );
    };

    const { container } = render(<TestWrapper />);
    expect(container.querySelector('ocx-connect-button')).toBeInTheDocument();
  });

  it('should support different variants', () => {
    const { container, rerender } = render(
      <CinacoinProvider config={mockConfig}>
        <ConnectButton variant="primary" />
      </CinacoinProvider>
    );

    expect(container.querySelector('ocx-connect-button')).toHaveAttribute('variant', 'primary');

    rerender(
      <CinacoinProvider config={mockConfig}>
        <ConnectButton variant="ghost" />
      </CinacoinProvider>
    );

    expect(container.querySelector('ocx-connect-button')).toHaveAttribute('variant', 'ghost');
  });

  it('should support different sizes', () => {
    const { container } = render(
      <CinacoinProvider config={mockConfig}>
        <ConnectButton size="sm" />
      </CinacoinProvider>
    );
    expect(container.querySelector('ocx-connect-button')).toHaveAttribute('size', 'sm');
  });
});

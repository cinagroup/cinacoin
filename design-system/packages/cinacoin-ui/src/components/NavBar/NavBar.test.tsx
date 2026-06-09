import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavBar } from './NavBar';

describe('NavBar', () => {
  it('renders with default props', () => {
    render(<NavBar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders logo slot', () => {
    render(<NavBar logo={<span>Logo</span>} />);
    expect(screen.getByText('Logo')).toBeInTheDocument();
  });

  it('renders nav items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
    ];
    render(<NavBar items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders actions slot', () => {
    render(<NavBar actions={<button>Sign Up</button>} />);
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('applies sticky class by default', () => {
    render(<NavBar />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('sticky');
  });

  it('removes sticky class when sticky=false', () => {
    render(<NavBar sticky={false} />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).not.toContain('sticky');
  });
});

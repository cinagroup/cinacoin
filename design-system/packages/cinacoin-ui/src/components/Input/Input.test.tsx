import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<Input description="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('applies size styles', () => {
    render(<Input size="lg" placeholder="Large" />);
    const input = screen.getByPlaceholderText('Large');
    expect(input.parentElement?.className).toContain('h-12');
  });

  it('applies error state styles', () => {
    render(<Input error placeholder="Error" />);
    const input = screen.getByPlaceholderText('Error');
    expect(input.parentElement?.className).toContain('border-red-500');
  });

  it('renders prefix', () => {
    render(<Input prefix={<span>@</span>} placeholder="Username" />);
    expect(screen.getByText('@')).toBeInTheDocument();
  });

  it('renders suffix', () => {
    render(<Input suffix={<span>.com</span>} placeholder="Domain" />);
    expect(screen.getByText('.com')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement>;
    render(<Input ref={ref} placeholder="Ref" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

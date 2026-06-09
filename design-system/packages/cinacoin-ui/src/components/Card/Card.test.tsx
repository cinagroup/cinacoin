import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies marketing variant by default', () => {
    render(<Card>Marketing</Card>);
    const card = screen.getByText('Marketing');
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('rounded-[8px]');
  });

  it('applies soft variant styles', () => {
    render(<Card variant="soft">Soft</Card>);
    const card = screen.getByText('Soft');
    expect(card.className).toContain('bg-[#fafafa]');
  });

  it('applies pricing-featured variant styles', () => {
    render(<Card variant="pricing-featured">Featured</Card>);
    const card = screen.getByText('Featured');
    expect(card.className).toContain('bg-[#171717]');
    expect(card.className).toContain('text-white');
  });

  it('renders sub-components', () => {
    render(
      <Card>
        <Card.Header>Header</Card.Header>
        <Card.Body>Body</Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card>,
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement>;
    render(<Card ref={ref}>Ref</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

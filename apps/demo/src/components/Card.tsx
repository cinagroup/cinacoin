import React, { useState, useCallback } from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  glowColor?: string;
  hoverLift?: boolean;
}

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  glowColor = 'from-[var(--cc-link)]/10 to-[var(--cc-violet)]/10',
  hoverLift = true,
}: CardProps) {
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      className={`relative bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[8px] overflow-hidden transition-all duration-300 ${
        hoverLift ? 'hover:-translate-y-0.5' : ''
      } ${className}`}
      style={{
        boxShadow: hovered && hoverLift 
          ? 'var(--cc-level4)'
          : 'var(--cc-level2)'
      }}
    >
      {/* Gradient glow on hover */}
      {hoverLift && (
        <div
          className="absolute inset-0 rounded-[var(--cc-radius-md)] opacity-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59,130,246,0.06), transparent 40%)`,
          }}
        />
      )}

      {/* Border shimmer */}
      {hoverLift && (
        <div
          className={`absolute -inset-px rounded-[var(--cc-radius-md)] bg-gradient-to-r ${glowColor} pointer-events-none transition-opacity duration-500`}
          style={{ opacity: hovered ? 1 : 0, mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', WebkitMaskComposite: 'xor', padding: 1 }}
        />
      )}

      {(title || subtitle) && (
        <div className="relative px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50">
          {title && <h2 className="cc-display-sm text-[var(--cc-ink)]">{title}</h2>}
          {subtitle && <p className="cc-caption text-[var(--cc-body)] mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="relative p-5">{children}</div>
    </div>
  );
}

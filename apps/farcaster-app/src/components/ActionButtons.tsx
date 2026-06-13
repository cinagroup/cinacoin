'use client';

import React from 'react';

export interface ActionButton {
  /** Button label */
  label: string;
  /** Button icon (emoji or SVG) */
  icon?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Link URL (renders as <a>) */
  href?: string;
}

interface ActionButtonsProps {
  /** Array of buttons to render */
  buttons: ActionButton[];
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[var(--cc-violet)] hover:bg-[var(--cc-violet-deep)] text-[var(--cc-on-primary)]',
  secondary: 'bg-[var(--cc-hairline-strong)] hover:bg-[var(--cc-mute)] text-[var(--cc-on-primary)]',
  success: 'bg-[var(--cc-success)] hover:bg-[var(--cc-success-deep)] text-[var(--cc-on-primary)]',
  danger: 'bg-[var(--cc-error)] hover:bg-[var(--cc-error-deep)] text-[var(--cc-on-primary)]',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-2 text-body-sm',
  md: 'px-4 py-3 text-body-md',
  lg: 'px-6 py-4 text-body-lg',
};

/**
 * ActionButtons - Render a set of interactive buttons for Frame actions.
 *
 * Supports multiple variants, sizes, and layouts. Can render as buttons or links.
 */
export const ActionButtons = React.memo(function ActionButtons({
  buttons,
  direction = 'horizontal',
  size = 'md',
}: ActionButtonsProps) {
  const layoutClass = direction === 'vertical'
    ? 'flex flex-col space-y-3'
    : 'grid gap-3';

  const gridCols = direction === 'horizontal'
    ? `grid-cols-${Math.min(buttons.length, 2)}`
    : '';

  return (
    <div className={`${layoutClass} ${gridCols}`} role="group" aria-label="Action buttons">
      {buttons.map((button, idx) => {
        const variant = button.variant ?? 'primary';
        const classes = `
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          rounded-sm font-medium transition-colors
          flex items-center justify-center space-x-2
          disabled:opacity-50 disabled:cursor-not-allowed
        `.trim();

        const content = (
          <>
            {button.loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : button.icon ? (
              <span aria-hidden="true">{button.icon}</span>
            ) : null}
            <span>{button.label}</span>
          </>
        );

        if (button.href) {
          return (
            <a
              key={idx}
              href={button.href}
              target="_blank"
              rel="noopener noreferrer"
              className={classes}
              aria-label={button.label}
            >
              {content}
            </a>
          );
        }

        return (
          <button
            key={idx}
            onClick={button.onClick}
            disabled={button.disabled || button.loading}
            className={classes}
            aria-label={button.label}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
});

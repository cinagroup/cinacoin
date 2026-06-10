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
  primary: 'bg-purple-600 hover:bg-purple-700 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
};

/**
 * ActionButtons - Render a set of interactive buttons for Frame actions.
 *
 * Supports multiple variants, sizes, and layouts. Can render as buttons or links.
 */
export function ActionButtons({
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
    <div className={`${layoutClass} ${gridCols}`}>
      {buttons.map((button, idx) => {
        const variant = button.variant ?? 'primary';
        const classes = `
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          rounded-xl font-medium transition-colors
          flex items-center justify-center space-x-2
          disabled:opacity-50 disabled:cursor-not-allowed
        `.trim();

        const content = (
          <>
            {button.loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : button.icon ? (
              <span>{button.icon}</span>
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
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

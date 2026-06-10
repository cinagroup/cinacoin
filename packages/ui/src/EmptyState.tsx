import React from 'react';

export interface EmptyStateProps {
  /** Optional icon/emoji rendered above the title */
  icon?: React.ReactNode;
  /** Primary heading text */
  title: string;
  /** Optional descriptive subtitle */
  description?: string;
  /** Optional action element (button, link, etc.) */
  action?: React.ReactNode;
}

const DefaultIcon = (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-muted-foreground opacity-50"
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
  </svg>
);

/**
 * Shared empty state component for data lists, tables, and views.
 *
 * Usage:
 * ```tsx
 * {items.length === 0 ? (
 *   <EmptyState icon="📭" title="No items yet" description="Add your first item." action={<Button>Add</Button>} />
 * ) : (
 *   items.map(...)
 * )}
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {(icon ?? DefaultIcon) && (
        <div className="mb-4 text-4xl" aria-hidden="true">
          {icon ?? DefaultIcon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

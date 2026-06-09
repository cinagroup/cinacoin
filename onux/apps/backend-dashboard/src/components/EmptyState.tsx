"use client";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const DefaultInboxIcon = (
  <svg className="w-12 h-12 text-[var(--cc-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
  </svg>
);

/**
 * Empty state component for tables, lists, and data views.
 * Follows DESIGN.md: body-sm text, canvas-soft background, canvas border.
 */
export default function EmptyState({
  title = "Nothing here yet",
  description = "No data available.",
  icon = DefaultInboxIcon,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="mb-4" aria-hidden="true">{icon}</span>
      <h3 className="cc-display-sm text-[var(--cc-ink)] mb-1">{title}</h3>
      <p className="cc-body-sm text-[var(--cc-body)] max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="cc-btn-primary-sm mt-5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

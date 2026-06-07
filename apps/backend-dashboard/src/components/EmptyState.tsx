"use client";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state component for tables, lists, and data views.
 * Follows DESIGN.md: body-sm text, canvas-soft background, canvas border.
 */
export default function EmptyState({
  title = "Nothing here yet",
  description = "No data available.",
  icon = "📭",
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-5xl mb-4" aria-hidden="true">{icon}</span>
      <h3 className="text-lg font-semibold text-[var(--cc-ink)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--cc-body)] max-w-sm">{description}</p>
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

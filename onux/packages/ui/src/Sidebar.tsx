import { useState, type ReactNode } from 'react';

export interface SidebarItem {
  /** Unique key for the item. */
  key: string;
  /** Display label. */
  label: string;
  /** Icon (optional). */
  icon?: ReactNode;
  /** Navigation href or action. */
  href?: string;
  /** Active state (highlighted). */
  active?: boolean;
  /** Nested items (collapsible). */
  children?: SidebarItem[];
  /** Disabled state. */
  disabled?: boolean;
  /** Badge or counter. */
  badge?: ReactNode;
}

export interface SidebarProps {
  /** Sidebar items. */
  items: SidebarItem[];
  /** Optional header (logo, title). */
  header?: ReactNode;
  /** Optional footer (user profile, settings). */
  footer?: ReactNode;
  /** Collapsed state (icon-only mode). */
  collapsed?: boolean;
  /** Callback when collapse toggles. */
  onToggleCollapse?: () => void;
  /** Current active item key. */
  activeKey?: string;
  /** Callback when item is clicked. */
  onItemClick?: (item: SidebarItem) => void;
  className?: string;
}

/**
 * Cinacoin Sidebar — collapsible navigation with nested items and active state tracking.
 */
export function Sidebar({
  items,
  header,
  footer,
  collapsed = false,
  onToggleCollapse,
  activeKey,
  onItemClick,
  className = '',
}: SidebarProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: collapsed ? '64px' : '240px',
    height: '100%',
    background: 'var(--cc-canvas)',
    borderRight: '1px solid var(--cc-hairline)',
    transition: 'width 0.2s ease',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: collapsed ? '16px 8px' : '16px',
    borderBottom: '1px solid var(--cc-hairline)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'space-between',
    minHeight: '64px',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: collapsed ? '8px' : '12px',
  };

  const footerStyle: React.CSSProperties = {
    padding: collapsed ? '12px 8px' : '16px',
    borderTop: '1px solid var(--cc-hairline)',
  };

  const renderItem = (item: SidebarItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.has(item.key);
    const isActive = item.active || activeKey === item.key;

    const itemStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: collapsed ? '10px' : '10px 12px',
      borderRadius: 'var(--cc-radius-sm)',
      color: item.disabled ? 'var(--cc-muted)' : isActive ? 'var(--cc-ink)' : 'var(--cc-body)',
      background: isActive ? 'var(--cc-canvas-soft-2)' : 'transparent',
      fontSize: '14px',
      fontWeight: isActive ? 500 : 400,
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      transition: 'background 0.15s ease, color 0.15s ease',
      textDecoration: 'none',
      marginLeft: `${depth * 12}px`,
      justifyContent: collapsed ? 'center' : 'flex-start',
    };

    const handleClick = (e: React.MouseEvent) => {
      if (item.disabled) {
        e.preventDefault();
        return;
      }
      if (hasChildren) {
        e.preventDefault();
        toggleExpand(item.key);
      }
      onItemClick?.(item);
    };

    const content = (
      <>
        {item.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>}
        {!collapsed && (
          <>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.label}
            </span>
            {item.badge && <span style={{ flexShrink: 0 }}>{item.badge}</span>}
            {hasChildren && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </>
        )}
      </>
    );

    const element = item.href && !hasChildren ? (
      <a
        key={item.key}
        href={item.href}
        onClick={handleClick}
        style={itemStyle}
        aria-disabled={item.disabled}
      >
        {content}
      </a>
    ) : (
      <button
        key={item.key}
        onClick={handleClick}
        disabled={item.disabled}
        style={{ ...itemStyle, border: 'none', background: isActive ? 'var(--cc-canvas-soft-2)' : 'transparent' }}
      >
        {content}
      </button>
    );

    return (
      <div key={item.key}>
        {element}
        {hasChildren && isExpanded && !collapsed && (
          <div style={{ marginTop: '4px' }}>
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={className} style={containerStyle} aria-label="Sidebar navigation">
      {header && <div style={headerStyle}>{header}</div>}
      <div style={contentStyle}>
        {items.map((item) => renderItem(item))}
      </div>
      {footer && <div style={footerStyle}>{footer}</div>}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          style={{
            position: 'absolute',
            top: '20px',
            right: collapsed ? '-12px' : '-12px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--cc-canvas)',
            border: '1px solid var(--cc-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </aside>
  );
}

import React, { forwardRef, useState, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface TabItem {
  id: string;
  label: string;
  content?: React.ReactNode;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  /** Tab items */
  items: TabItem[];
  /** Default active tab id */
  defaultTab?: string;
  /** Controlled active tab */
  activeTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ items, defaultTab, activeTab, onTabChange, className, children, ...props }, ref) => {
    const [internalTab, setInternalTab] = useState(defaultTab || items[0]?.id);
    const currentTab = activeTab !== undefined ? activeTab : internalTab;

    const handleTabClick = (tabId: string) => {
      if (activeTab === undefined) {
        setInternalTab(tabId);
      }
      onTabChange?.(tabId);
    };

    const activeContent = items.find((item) => item.id === currentTab)?.content;

    return (
      <div ref={ref} className={cn('flex flex-col', className)} {...props}>
        <div className="flex gap-1 mb-4 border-b border-[#ebebeb]">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={cn(
                'px-4 py-2 text-sm font-normal transition-colors rounded-t-[6px]',
                currentTab === item.id
                  ? 'bg-white text-[#171717] border-b-2 border-[#171717] -mb-px'
                  : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {activeContent && <div className="flex-1">{activeContent}</div>}
        {children}
      </div>
    );
  },
);

Tabs.displayName = 'Tabs';

"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { TimeRange } from "./TimeRangeSelector";

interface GridItem {
  id: string;
  component: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
}

interface DashboardGridProps {
  items: GridItem[];
  editable?: boolean;
  onLayoutChange?: (layout: GridItem[]) => void;
}

/**
 * Customizable grid layout system with drag-and-drop support.
 * Uses CSS Grid for responsive layout.
 */
export default function DashboardGrid({
  items,
  editable = false,
  onLayoutChange,
}: DashboardGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [layout, setLayout] = useState<GridItem[]>(items);

  const handleDragStart = useCallback(
    (id: string) => {
      if (!editable) return;
      setDraggedId(id);
    },
    [editable]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      if (!editable || !draggedId || draggedId === targetId) return;
      e.preventDefault();

      const newLayout = [...layout];
      const draggedIndex = newLayout.findIndex((item) => item.id === draggedId);
      const targetIndex = newLayout.findIndex((item) => item.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Swap items
      const [dragged] = newLayout.splice(draggedIndex, 1);
      newLayout.splice(targetIndex, 0, dragged);

      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    },
    [editable, draggedId, layout, onLayoutChange]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const colSpanClass = (span?: number) => {
    switch (span) {
      case 1:
        return "col-span-1";
      case 2:
        return "col-span-1 md:col-span-2";
      case 3:
        return "col-span-1 md:col-span-2 lg:col-span-3";
      case 4:
        return "col-span-1 md:col-span-2 lg:col-span-4";
      default:
        return "col-span-1";
    }
  };

  const rowSpanClass = (span?: number) => {
    return span === 2 ? "row-span-2" : "row-span-1";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {layout.map((item) => (
        <div
          key={item.id}
          className={cn(
            colSpanClass(item.colSpan),
            rowSpanClass(item.rowSpan),
            "transition-all duration-200",
            editable && "cursor-grab active:cursor-grabbing",
            draggedId === item.id && "opacity-50 scale-95"
          )}
          draggable={editable}
          onDragStart={() => handleDragStart(item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragEnd={handleDragEnd}
        >
          {item.component}
        </div>
      ))}
    </div>
  );
}

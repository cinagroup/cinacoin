"use client";

import { ReactNode } from "react";
import { MetricsProvider } from "./MetricsProvider";
import { NotificationProvider } from "./NotificationProvider";
import { WebSocketProvider } from "./WebSocketProvider";

/**
 * Root providers wrapper for the unified dashboard.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <WebSocketProvider>
      <MetricsProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </MetricsProvider>
    </WebSocketProvider>
  );
}

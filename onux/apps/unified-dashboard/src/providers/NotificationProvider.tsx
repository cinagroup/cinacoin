"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useWebSocket } from "./WebSocketProvider";

// ─── Types ─────────────────────────────────────────────────────────────

export type NotificationCategory = "system" | "project" | "team";

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  read: boolean;
  timestamp: number;
  href?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<Notification, "id" | "read" | "timestamp">) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

// ─── Initial Mock Data ─────────────────────────────────────────────────

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Deployment successful",
    message: "Backend service v2.4.1 deployed to production",
    category: "system",
    read: false,
    timestamp: Date.now() - 5 * 60 * 1000,
  },
  {
    id: "2",
    title: "New team member",
    message: "Alice joined the Core Platform team",
    category: "team",
    read: false,
    timestamp: Date.now() - 30 * 60 * 1000,
  },
  {
    id: "3",
    title: "API rate limit warning",
    message: "Project 'wallet-explorer' reached 80% of rate limit",
    category: "project",
    read: false,
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: "4",
    title: "SSL certificate renewed",
    message: "Certificate for *.cinacoin.com renewed successfully",
    category: "system",
    read: true,
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
  },
  {
    id: "5",
    title: "Weekly report ready",
    message: "Your weekly analytics report is available",
    category: "project",
    read: true,
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
  },
];

// ─── Provider ──────────────────────────────────────────────────────────

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS
  );
  const { connected, subscribe } = useWebSocket();

  // Subscribe to notification updates via WebSocket
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribe("notifications", (data: unknown) => {
      const msg = data as {
        type: string;
        payload: Omit<Notification, "id" | "read" | "timestamp">;
      };
      if (msg.type === "notification:new" && msg.payload) {
        const newNotif: Notification = {
          ...msg.payload,
          id: crypto.randomUUID?.() || String(Date.now()),
          read: false,
          timestamp: Date.now(),
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    });

    return unsubscribe;
  }, [connected, subscribe]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback(
    (notif: Omit<Notification, "id" | "read" | "timestamp">) => {
      const newNotif: Notification = {
        ...notif,
        id: crypto.randomUUID?.() || String(Date.now()),
        read: false,
        timestamp: Date.now(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

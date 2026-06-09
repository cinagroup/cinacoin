"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

interface WebSocketContextType {
  connected: boolean;
  lastMessage: unknown | null;
  sendMessage: (data: unknown) => void;
  subscribe: (channel: string, callback: (data: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
}

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

/**
 * WebSocket provider for real-time data updates.
 * Manages connection lifecycle and message routing.
 */
export function WebSocketProvider({
  children,
  url = process.env.NEXT_PUBLIC_WS_URL || "wss://api.cinacoin.com/ws",
}: WebSocketProviderProps) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(url);

        ws.onopen = () => {
          setConnected(true);
          console.log("[WebSocket] Connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);

            // Route to subscribers
            if (data.channel) {
              const callbacks = subscribersRef.current.get(data.channel);
              if (callbacks) {
                callbacks.forEach((cb) => cb(data));
              }
            }
          } catch (err) {
            console.error("[WebSocket] Parse error:", err);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          console.log("[WebSocket] Disconnected");
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.error("[WebSocket] Error:", err);
          ws.close();
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("[WebSocket] Connection failed:", err);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [url]);

  const sendMessage = (data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  const subscribe = (channel: string, callback: (data: unknown) => void) => {
    if (!subscribersRef.current.has(channel)) {
      subscribersRef.current.set(channel, new Set());
    }
    subscribersRef.current.get(channel)!.add(callback);

    // Subscribe on server
    sendMessage({ type: "subscribe", channel });

    // Return unsubscribe function
    return () => {
      subscribersRef.current.get(channel)?.delete(callback);
      sendMessage({ type: "unsubscribe", channel });
    };
  };

  return (
    <WebSocketContext.Provider
      value={{ connected, lastMessage, sendMessage, subscribe }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

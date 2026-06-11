"use client";
import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 bg-warning text-[var(--cc-ink)] text-center py-2 text-body-sm font-medium z-[100] flex items-center justify-center gap-2"
      role="alert"
    >
      <WifiOff className="w-4 h-4" aria-hidden="true" />
      You are offline. Some features may not work until connection is restored.
    </div>
  );
}

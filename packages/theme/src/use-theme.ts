/**
 * @cinacoin/theme — useTheme hook
 *
 * Provides dark-mode toggle, system-preference detection, and persistence.
 * Works in React 18+ and Next.js App Router (client components).
 */
import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "cinacoin-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* private browsing */
  }
  return null;
}

function resolveTheme(pref: Theme): "light" | "dark" {
  return pref === "system" ? getSystemTheme() : pref;
}

function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
}

export function useTheme() {
  const [preference, setPreference] = useState<Theme>(() => {
    return getStoredTheme() ?? "system";
  });
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    resolveTheme(getStoredTheme() ?? "system")
  );

  // Apply on mount and whenever preference changes
  useEffect(() => {
    const r = resolveTheme(preference);
    setResolved(r);
    applyTheme(r);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* ignore */
    }
  }, [preference]);

  // Listen for system theme changes when preference is "system"
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const r = e.matches ? "dark" : "light";
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setTheme = useCallback((t: Theme) => setPreference(t), []);
  const toggle = useCallback(
    () =>
      setPreference((prev) =>
        prev === "dark" ? "light" : prev === "light" ? "dark" : prev
      ),
    []
  );

  return { theme: preference, resolvedTheme: resolved, setTheme, toggle };
}

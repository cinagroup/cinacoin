/**
 * @cinacoin/theme — ThemeProvider
 *
 * React context provider for theme management.
 */
"use client";

import React, { createContext, useContext } from "react";
import { useTheme, type Theme } from "./use-theme";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeValue = useTheme();
  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}

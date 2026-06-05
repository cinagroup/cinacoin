"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Locale = "en" | "zh";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav-dashboard": "Dashboard",
    "nav-services": "Services",
    "nav-configuration": "Configuration",
    "nav-overview": "Overview",
    "nav-analytics": "Analytics",
    "nav-networks": "Networks",
    "nav-settings": "Settings",
    "nav-project": "Project",
    "nav-rpc-proxy": "RPC Proxy",
    "nav-keys-server": "Keys Server",
    "nav-relay-server": "Relay Server",
    "nav-notify-server": "Notify Server",
    "nav-push-server": "Push Server",
    "theme-light": "Light",
    "theme-dark": "Dark",
    "lang-en": "EN",
    "lang-zh": "\u4e2d\u6587",
    "login-title": "Sign in with Wallet",
    "login-desc": "Connect your Ethereum wallet to access the cinacoin Backend Dashboard.",
    "login-button": "Connect Wallet & Sign In",
    "login-connecting": "Connecting...",
    "login-signing": "Signing...",
    "login-wallet-missing": "No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.",
    "login-info-1": "You will be asked to sign a message to prove wallet ownership.",
    "login-info-2": "No gas fees \u2014 this is an off-chain signature.",
    "login-info-3": "Session expires after 24 hours.",
    "login-back": "Back to Dashboard",
    "logout": "Logout",
    "health-ok": "All Healthy",
    "health-degraded": "Degraded",
    "health-down": "Critical",
    "health-checking": "Checking",
    "refresh": "Refresh",
    "refresh-checking": "Checking...",
    "workers-health": "Workers Health",
    "total-requests": "Total Requests",
    "total-errors": "Total Errors",
    "avg-error-rate": "Avg Error Rate",
    "degraded": "Degraded",
    "down": "Down",
    "service-status": "Service Status",
    "demo-mode": "Demo Mode \u2014 Simulated metrics",
    "live-monitoring": "Live monitoring of Cloudflare Workers",
    "updated": "Updated",
    "saved": "Saved",
    "save-changes": "Save Changes",
    "back": "Back",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm",
  },
  zh: {
    "nav-dashboard": "\u4eea\u8868\u76d8",
    "nav-services": "\u670d\u52a1",
    "nav-configuration": "\u914d\u7f6e",
    "nav-overview": "\u6982\u89c8",
    "nav-analytics": "\u6570\u636e\u5206\u6790",
    "nav-networks": "\u7f51\u7edc",
    "nav-settings": "\u8bbe\u7f6e",
    "nav-project": "\u9879\u76ee",
    "nav-rpc-proxy": "RPC \u4ee3\u7406",
    "nav-keys-server": "\u5bc6\u94a5\u670d\u52a1\u5668",
    "nav-relay-server": "\u4e2d\u7ee7\u670d\u52a1\u5668",
    "nav-notify-server": "\u901a\u77e5\u670d\u52a1\u5668",
    "nav-push-server": "\u63a8\u9001\u670d\u52a1\u5668",
    "theme-light": "\u6d45\u8272",
    "theme-dark": "\u6df1\u8272",
    "lang-en": "EN",
    "lang-zh": "\u4e2d\u6587",
    "login-title": "\u94b1\u5305\u767b\u5f55",
    "login-desc": "\u8fde\u63a5\u60a8\u7684\u4ee5\u592a\u574a\u94b1\u5305\u4ee5\u8bbf\u95ee cinacoin \u540e\u53f0\u4eea\u8868\u677f\u3002",
    "login-button": "\u8fde\u63a5\u94b1\u5305\u5e76\u767b\u5f55",
    "login-connecting": "\u8fde\u63a5\u4e2d...",
    "login-signing": "\u7b7e\u540d\u4e2d...",
    "login-wallet-missing": "\u672a\u68c0\u6d4b\u5230\u4ee5\u592a\u574a\u94b1\u5305\u3002\u8bf7\u5b89\u88c5 MetaMask \u6216\u5176\u4ed6 Web3 \u94b1\u5305\u3002",
    "login-info-1": "\u60a8\u9700\u8981\u7b7e\u540d\u4e00\u6761\u6d88\u606f\u4ee5\u8bc1\u660e\u94b1\u5305\u6240\u6709\u6743\u3002",
    "login-info-2": "\u65e0\u9700 Gas \u8d39\u7528 \u2014 \u8fd9\u662f\u94fe\u4e0b\u7b7e\u540d\u3002",
    "login-info-3": "\u4f1a\u8bdd\u5c06\u5728 24 \u5c0f\u65f6\u540e\u8fc7\u671f\u3002",
    "login-back": "\u8fd4\u56de\u4eea\u8868\u677f",
    "logout": "\u9000\u51fa\u767b\u5f55",
    "health-ok": "\u5168\u90e8\u6b63\u5e38",
    "health-degraded": "\u6027\u80fd\u4e0b\u964d",
    "health-down": "\u4e25\u91cd\u6545\u969c",
    "health-checking": "\u68c0\u67e5\u4e2d",
    "refresh": "\u5237\u65b0",
    "refresh-checking": "\u68c0\u67e5\u4e2d...",
    "workers-health": "Worker \u5065\u5eb7\u72b6\u6001",
    "total-requests": "\u603b\u8bf7\u6c42\u6570",
    "total-errors": "\u603b\u9519\u8bef\u6570",
    "avg-error-rate": "\u5e73\u5747\u9519\u8bef\u7387",
    "degraded": "\u964d\u7ea7",
    "down": "\u505c\u673a",
    "service-status": "\u670d\u52a1\u72b6\u6001",
    "demo-mode": "\u6f14\u793a\u6a21\u5f0f \u2014 \u6a21\u62df\u6570\u636e",
    "live-monitoring": "\u5b9e\u65f6\u76d1\u63a7 Cloudflare Workers",
    "updated": "\u66f4\u65b0\u4e8e",
    "saved": "\u5df2\u4fdd\u5b58",
    "save-changes": "\u4fdd\u5b58\u66f4\u6539",
    "back": "\u8fd4\u56de",
    "cancel": "\u53d6\u6d88",
    "delete": "\u5220\u9664",
    "confirm": "\u786e\u8ba4",
  },
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
});

export function useI18n() {
  return useContext(LocaleContext);
}

function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("cc-locale") as Locale | null;
    if (stored === "en" || stored === "zh") return stored;
    if (navigator.language.startsWith("zh")) return "zh";
  }
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem("cc-locale", locale); } catch {}
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[locale]?.[key] ?? key;
    },
    [locale],
  );

  if (!mounted) return <>{children}</>;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

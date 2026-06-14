"use client";

import { useState, useEffect, useCallback } from "react";
import { getEnv } from "@/env";

interface OAuthSetting {
  key: string;
  value: string;
  description: string;
  isMasked: boolean;
  updatedAt: number;
  updatedBy: string;
}

interface Toast {
  message: string;
  type: "success" | "error" | "info";
}

export default function AdminOAuthPage() {
  const env = getEnv();
  const AUTH_BASE = env.NEXT_PUBLIC_AUTH_URL;

  const [settings, setSettings] = useState<Record<string, string>>({
    oauth_github_client_id: "",
    oauth_github_client_secret: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const showToast = (message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null;
      if (!token) {
        showToast("请先登录", "error");
        setLoading(false);
        return;
      }

      const res = await fetch(`${AUTH_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        showToast("需要管理员权限", "error");
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const settingsMap: Record<string, string> = {};
      for (const s of data.settings) {
        settingsMap[s.key] = s.value;
      }
      setSettings((prev) => ({
        ...prev,
        ...settingsMap,
      }));
      setIsConfigured(!!settingsMap["oauth_github_client_id"] && !!settingsMap["oauth_github_client_secret"]);
    } catch {
      showToast("获取配置失败", "error");
    } finally {
      setLoading(false);
    }
  }, [AUTH_BASE]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null;
      if (!token) {
        showToast("请先登录", "error");
        return;
      }

      // Save each setting
      for (const [key, value] of Object.entries(settings)) {
        if (!value) continue;
        const res = await fetch(`${AUTH_BASE}/api/admin/settings`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ key, value }),
        });
        if (!res.ok) throw new Error(`Failed to save ${key}`);
      }

      showToast("GitHub OAuth 配置已保存");
      setIsConfigured(!!settings.oauth_github_client_id && !!settings.oauth_github_client_secret);
      fetchSettings();
    } catch {
      showToast("保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除 GitHub OAuth 配置吗？用户将无法使用 GitHub 登录。")) return;

    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null;
      if (!token) return;

      for (const key of ["oauth_github_client_id", "oauth_github_client_secret"]) {
        await fetch(`${AUTH_BASE}/api/admin/settings/${key}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setSettings({ oauth_github_client_id: "", oauth_github_client_secret: "" });
      setIsConfigured(false);
      showToast("GitHub OAuth 配置已删除", "info");
    } catch {
      showToast("删除失败", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--cc-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="cc-display-sm text-[var(--cc-ink)]">OAuth 配置</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">
            管理第三方登录提供商的 OAuth 凭证
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 cc-badge text-xs ${
            isConfigured
              ? "text-[var(--cc-success)] border border-[var(--cc-success)]/30"
              : "text-[var(--cc-warning)] border border-[var(--cc-warning)]/30"
          }`}
        >
          {isConfigured ? "✓ 已配置" : "⚠ 未配置"}
        </span>
      </div>

      {/* GitHub OAuth */}
      <div className="cc-card">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <h3 className="cc-body-md-strong text-[var(--cc-ink)]">GitHub OAuth</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="github-client-id" className="cc-body-sm-strong text-[var(--cc-ink)] block mb-1">
              Client ID
            </label>
            <input
              id="github-client-id"
              type="text"
              value={settings.oauth_github_client_id}
              onChange={(e) => setSettings((s) => ({ ...s, oauth_github_client_id: e.target.value }))}
              placeholder="Iv1.xxxxxxxxxxxxxxxx"
              className="cc-form-input w-full font-mono text-sm"
            />
            <p className="cc-caption text-[var(--cc-muted)] mt-1">
              在 GitHub Settings → Developer settings → OAuth Apps 中创建
            </p>
          </div>

          <div>
            <label htmlFor="github-client-secret" className="cc-body-sm-strong text-[var(--cc-ink)] block mb-1">
              Client Secret
            </label>
            <input
              id="github-client-secret"
              type="password"
              value={settings.oauth_github_client_secret}
              onChange={(e) => setSettings((s) => ({ ...s, oauth_github_client_secret: e.target.value }))}
              placeholder="********************************"
              className="cc-form-input w-full font-mono text-sm"
            />
          </div>

          <div className="p-3 bg-[var(--cc-surface)] border border-[var(--cc-hairline)] rounded-lg">
            <p className="cc-body-sm-strong text-[var(--cc-ink)] mb-1">回调 URL</p>
            <code className="cc-caption text-code text-[var(--cc-muted)] break-all">
              {typeof window !== "undefined" ? window.location.origin : "https://backend.cinacoin.com"}/oauth/callback
            </code>
            <p className="cc-caption text-[var(--cc-muted)] mt-1">
              将此 URL 添加到 GitHub OAuth App 的 Authorization callback URL 中
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {isConfigured && (
          <button onClick={handleDelete} className="cc-btn-secondary-sm text-[var(--cc-danger)]">
            删除配置
          </button>
        )}
        <button onClick={handleSave} disabled={saving} className="cc-btn-primary-sm">
          {saving ? "保存中..." : "保存配置"}
        </button>
      </div>

      {/* Help */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-3">配置步骤</h3>
        <ol className="space-y-2 cc-body-sm text-[var(--cc-muted)]">
          <li className="flex gap-2">
            <span className="text-[var(--cc-primary)]">1.</span>
            访问 <a href="https://github.com/settings/developers" target="_blank" rel="noopener" className="text-[var(--cc-link)] underline">GitHub Developer Settings</a>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--cc-primary)]">2.</span>
            点击 "New OAuth App" 创建新应用
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--cc-primary)]">3.</span>
            填写 Application name 和 Homepage URL
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--cc-primary)]">4.</span>
            将上方回调 URL 填入 Authorization callback URL
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--cc-primary)]">5.</span>
            注册后复制 Client ID 和 Client Secret 填入上方表单
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--cc-primary)]">6.</span>
            点击 "保存配置"
          </li>
        </ol>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === "success"
              ? "bg-[var(--cc-success)] text-white"
              : toast.type === "error"
              ? "bg-[var(--cc-danger)] text-white"
              : "bg-[var(--cc-primary)] text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

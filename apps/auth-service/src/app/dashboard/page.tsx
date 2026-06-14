'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: string;
  email: string;
  name?: string;
  mfa_enabled: boolean;
  settings: {
    theme: string;
    locale: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/auth/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="auth-container">
        <p style={{ color: 'var(--cc-muted)' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>CinaCoin Auth</h1>
          <p>统一认证中心</p>
        </div>

        {user && (
          <div style={{ marginBottom: 'var(--cc-lg)' }}>
            <p><strong>姓名:</strong> {user.name || '未设置'}</p>
            <p><strong>邮箱:</strong> {user.email}</p>
            <p><strong>MFA:</strong> {user.mfa_enabled ? '已启用 ✅' : '未启用'}</p>
            <p><strong>主题:</strong> {user.settings.theme}</p>
            <p><strong>语言:</strong> {user.settings.locale}</p>
          </div>
        )}

        <button onClick={handleLogout} className="auth-btn auth-btn-primary">
          登出
        </button>
      </div>
    </div>
  );
}

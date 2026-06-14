import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CinaCoin Auth - 统一认证中心',
  description: 'CinaCoin 平台统一登录和注册服务',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" data-theme="dark">
      <body className="min-h-screen bg-[var(--cc-canvas)] text-[var(--cc-ink)] antialiased">
        {children}
      </body>
    </html>
  );
}

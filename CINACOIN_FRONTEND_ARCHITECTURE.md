# Cinacoin 统一前端架构

> **版本**: 1.0.0 | **日期**: 2026-06-08 | **状态**: 设计阶段

---

## 1. 架构概述

### 1.1 设计目标

Cinacoin 前端架构旨在为 7 个核心应用提供**统一、可扩展、高性能**的用户体验：

| # | 应用 | 域名 | 技术栈 | 用途 |
|---|------|------|--------|------|
| 1 | Website | cinacoin.com | Next.js 15 + React 19 | 官方门户、产品介绍 |
| 2 | Cloud Dashboard | cloud.cinacoin.com | Next.js 15 + React 19 | 用户控制台、项目管理 |
| 3 | Backend Dashboard | dash.cinacoin.com | Next.js 15 + React 19 | 后台管理、运维监控 |
| 4 | Analytics Dashboard | analytics.cinacoin.com | Next.js 15 + React 19 | 数据分析、链上指标 |
| 5 | Wallet Explorer | wallet.cinacoin.com | Next.js 15 + React 19 | 钱包浏览、资产查询 |
| 6 | Demo | demo.cinacoin.com | Next.js 15 / Vite + React | SDK 演示、开发者体验 |
| 7 | Docs & Status | docs/status.cinacoin.com | Docusaurus / Next.js 15 | 文档中心、服务状态 |

### 1.2 架构原则

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cinacoin Frontend Architecture               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Monorepo First        — Turborepo 管理，共享依赖和构建缓存    │
│  2. Shared by Default     — 组件/工具/样式 100% 可跨应用复用      │
│  3. App Autonomy          — 各应用独立部署、独立路由               │
│  4. Progressive Enhancement — 渐进式 SSR/SSG/ISR 策略            │
│  5. Type Safety           — 端到端 TypeScript，零 any            │
│  6. Performance Budget    — LCP < 2.5s, FID < 100ms, CLS < 0.1 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo 结构

### 2.1 目录布局

```
onux/
├── apps/                          # 应用层
│   ├── website/                   # 官方门户
│   ├── cloud-dashboard/           # 用户控制台
│   ├── backend-dashboard/         # 后台管理
│   ├── analytics-dashboard/       # 数据分析
│   ├── wallet-explorer/           # 钱包浏览器
│   ├── demo/                      # SDK 演示 (Next.js)
│   ├── demo-react/                # SDK 演示 (Vite)
│   ├── docs-site/                 # 文档中心
│   ├── health-status/             # 服务状态
│   └── ...
│
├── packages/                      # 共享包层
│   ├── config/                    # 共享配置
│   │   ├── tailwind-preset.ts     # 统一 Tailwind 预设
│   │   ├── tsconfig/              # TypeScript 配置集
│   │   ├── eslint/                # ESLint 规则集
│   │   └── vitest/                # 测试配置
│   │
│   ├── ui/                        # 共享 UI 组件库 (@cinacoin/ui)
│   │   ├── components/            # 基础组件
│   │   ├── layouts/               # 布局组件
│   │   ├── hooks/                 # 共享 Hooks
│   │   └── index.ts
│   │
│   ├── ui-theme/                  # 主题系统 (@cinacoin/ui-theme)
│   │   ├── tokens/                # Design Tokens
│   │   ├── themes/                # 亮/暗主题定义
│   │   └── css-variables.css      # CSS 变量输出
│   │
│   ├── core-sdk/                  # 核心 SDK
│   ├── core-ui/                   # 核心 UI 逻辑
│   ├── cinacoin-i18n/             # 国际化
│   ├── cinacoin-ui-theme/         # UI 主题包
│   └── ...                        # 其他 SDK/适配器
│
├── turbo.json                     # Turborepo 配置
├── pnpm-workspace.yaml            # 工作区定义
└── package.json                   # 根配置
```

### 2.2 依赖关系图

```
                    ┌──────────────┐
                    │   apps/*     │
                    │  (7 应用)    │
                    └──────┬───────┘
                           │ depends on
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌──────────────┐
     │ @cinacoin  │ │ @cinacoin │ │ @cinacoin    │
     │ /ui        │ │ /ui-theme │ │ /i18n        │
     └─────┬──────┘ └─────┬─────┘ └──────────────┘
           │               │
           ▼               ▼
     ┌────────────┐ ┌───────────┐
     │ @cinacoin  │ │ Tailwind  │
     │ /config    │ │ Preset    │
     └────────────┘ └───────────┘
```

---

## 3. 统一布局系统

### 3.1 全局布局架构

```
┌────────────────────────────────────────────────────────────┐
│                    GlobalShell                               │
├──────────┬─────────────────────────────────────────────────┤
│          │  ┌──────────────────────────────────────────┐   │
│  Global  │  │           GlobalHeader                    │   │
│  Sidebar │  ├──────────────────────────────────────────┤   │
│          │  │                                           │   │
│  (可选)  │  │           PageContent                     │   │
│          │  │                                           │   │
│  240px   │  │                                           │   │
│ collaps- │  │                                           │   │
│  ible    │  ├──────────────────────────────────────────┤   │
│          │  │           Footer (可选)                    │   │
└──────────┴──────────────────────────────────────────────┘───┘
```

### 3.2 布局组件层级

```typescript
// packages/ui/layouts/GlobalShell.tsx
<ThemeProvider>                    // 主题上下文
  <AuthProvider>                   // 认证上下文
    <I18nProvider>                 // 国际化上下文
      <NavigationProvider>         // 导航状态
        <NotificationProvider>     // 通知中心
          <Layout>                 // 实际布局
            <GlobalHeader />
            <GlobalSidebar />
            <main>{children}</main>
            <Footer />
          </Layout>
        </NotificationProvider>
      </NavigationProvider>
    </I18nProvider>
  </AuthProvider>
</ThemeProvider>
```

### 3.3 响应式断点

| 断点 | 宽度 | 布局行为 |
|------|------|----------|
| `xs` | < 640px | 单列，侧边栏隐藏为抽屉 |
| `sm` | ≥ 640px | 单列，紧凑头部 |
| `md` | ≥ 768px | 侧边栏可折叠，双列可选 |
| `lg` | ≥ 1024px | 完整侧边栏 + 内容区 |
| `xl` | ≥ 1280px | 最大内容宽度 1200px |
| `2xl` | ≥ 1536px | 最大内容宽度 1440px |

---

## 4. 导航和路由系统

### 4.1 统一路由结构

```typescript
// 各应用共享路由命名空间
const routes = {
  // 全局路由
  home: '/',
  login: '/login',
  settings: '/settings',
  profile: '/profile',

  // Cloud Dashboard
  cloud: {
    base: '/cloud',
    projects: '/cloud/projects',
    apiKeys: '/cloud/api-keys',
    billing: '/cloud/billing',
  },

  // Backend Dashboard
  backend: {
    base: '/backend',
    users: '/backend/users',
    system: '/backend/system',
    logs: '/backend/logs',
  },

  // Analytics
  analytics: {
    base: '/analytics',
    realtime: '/analytics/realtime',
    reports: '/analytics/reports',
  },

  // Wallet Explorer
  explorer: {
    base: '/explorer',
    wallets: '/explorer/wallets',
    transactions: '/explorer/transactions',
  },

  // Docs
  docs: {
    base: '/docs',
    api: '/docs/api',
    guides: '/docs/guides',
  },
};
```

### 4.2 应用间切换机制

```typescript
// packages/ui/components/AppSwitcher.tsx
// 统一的应用切换器，支持键盘快捷键

interface AppDefinition {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
  description: string;
  permissions?: string[];
  badge?: 'new' | 'beta';
}

const apps: AppDefinition[] = [
  { id: 'cloud', name: 'Cloud', icon: <CloudIcon />, url: 'https://cloud.cinacoin.com', ... },
  { id: 'backend', name: 'Backend', icon: <ServerIcon />, url: 'https://dash.cinacoin.com', ... },
  { id: 'analytics', name: 'Analytics', icon: <ChartIcon />, url: 'https://analytics.cinacoin.com', ... },
  { id: 'explorer', name: 'Explorer', icon: <SearchIcon />, url: 'https://wallet.cinacoin.com', ... },
  { id: 'demo', name: 'Demo', icon: <CodeIcon />, url: 'https://demo.cinacoin.com', ... },
  { id: 'docs', name: 'Docs', icon: <BookIcon />, url: 'https://docs.cinacoin.com', ... },
  { id: 'status', name: 'Status', icon: <ActivityIcon />, url: 'https://status.cinacoin.com', ... },
];
```

### 4.3 权限控制导航

```typescript
// packages/ui/hooks/useNavigation.ts
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
  permission?: string;       // 权限标识
  roles?: string[];          // 允许的角色
  badge?: number | string;   // 角标
  hidden?: boolean;          // 动态隐藏
}

// 权限解析流程
// 1. 用户登录 → 获取 JWT（含 roles + permissions）
// 2. NavigationProvider 根据权限过滤菜单项
// 3. 路由守卫验证访问权限
// 4. 无权限 → 重定向至 403 或登录页
```

---

## 5. 状态管理架构

### 5.1 分层状态策略

```
┌─────────────────────────────────────────────────────────┐
│                    State Layers                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: Server State     → TanStack Query (SWR)       │
│    - API 数据缓存                                          │
│    - 自动重新获取                                            │
│    - 乐观更新                                              │
│                                                          │
│  Layer 2: Client State     → Zustand                     │
│    - UI 状态 (侧边栏开关、主题)                             │
│    - 用户偏好设置                                          │
│    - 临时表单状态                                          │
│                                                          │
│  Layer 3: URL State        → Next.js searchParams        │
│    - 分页、筛选、排序                                      │
│    - 可分享的应用状态                                      │
│                                                          │
│  Layer 4: Persistent State → localStorage + IndexedDB    │
│    - 用户设置                                              │
│    - 离线缓存                                              │
│    - 最近访问记录                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 全局 Store 设计

```typescript
// packages/ui/stores/globalStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalState {
  // 主题
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: GlobalState['theme']) => void;

  // 侧边栏
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // 语言
  locale: 'en' | 'zh' | 'ja' | 'ko';
  setLocale: (locale: GlobalState['locale']) => void;

  // 通知
  unreadCount: number;
  markAllRead: () => void;

  // 当前应用上下文
  activeApp: string | null;
  setActiveApp: (app: string) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      locale: 'en',
      setLocale: (locale) => set({ locale }),
      unreadCount: 0,
      markAllRead: () => set({ unreadCount: 0 }),
      activeApp: null,
      setActiveApp: (app) => set({ activeApp: app }),
    }),
    { name: 'cinacoin-global' }
  )
);
```

---

## 6. 数据获取层

### 6.1 API 客户端架构

```typescript
// packages/ui/lib/api-client.ts
// 统一的 API 客户端，所有应用共享

class CinacoinApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;

  constructor(config: ApiClientConfig) { ... }

  // 自动注入认证头
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await this.getToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        'X-App-Id': this.appId,
        'X-Request-Id': crypto.randomUUID(),
      },
    });
    // 统一错误处理
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }
}
```

### 6.2 React Query 配置

```typescript
// packages/ui/providers/QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 分钟
      gcTime: 30 * 60 * 1000,         // 30 分钟
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

## 7. 实时数据更新机制

### 7.1 WebSocket 架构

```typescript
// packages/ui/lib/realtime.ts
class RealtimeClient {
  private ws: WebSocket | null;
  private subscriptions: Map<string, Set<(data: any) => void>>;

  // 自动重连 + 指数退避
  connect() { ... }

  // 订阅频道
  subscribe(channel: string, callback: (data: any) => void) { ... }

  // 取消订阅
  unsubscribe(channel: string, callback: (data: any) => void) { ... }
}

// 使用示例
const { data: liveMetrics } = useRealtime('analytics:metrics', {
  enabled: isAnalyticsPage,
  onData: (data) => queryClient.setQueryData(['metrics'], data),
});
```

### 7.2 Server-Sent Events (SSE)

```typescript
// 用于单向数据流（通知、日志流）
const useSSE = (url: string, options?: SSEOptions) => {
  // 自动管理 EventSource 生命周期
  // 集成 React Query 缓存
};
```

---

## 8. 认证与安全

### 8.1 认证流程

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Auth    │────▶│  Token   │
│  (App)   │     │  Service │     │  Store   │
└──────────┘     └──────────┘     └──────────┘
      │                                  │
      │  1. Login (SIWX/Email/Passkey)   │
      │◀─────────────────────────────────│
      │  2. JWT + Refresh Token          │
      │                                  │
      │  3. API Request + Bearer Token   │
      │─────────────────────────────────▶│
      │  4. Response                     │
      │◀─────────────────────────────────│
```

### 8.2 多认证方式支持

| 方式 | 场景 | 实现 |
|------|------|------|
| SIWX (跨链签名) | Web3 用户登录 | `@cinacoin/siwx` |
| Email + Magic Link | 传统用户 | `@cinacoin/social-login` |
| Passkey (WebAuthn) | 生物识别 | 原生 WebAuthn API |
| Social OAuth | 社交登录 | Google/GitHub/Discord |
| API Key | 服务间调用 | Header 注入 |

---

## 9. 性能优化策略

### 9.1 代码分割

```typescript
// 路由级代码分割 (Next.js App Router 自动)
// 组件级代码分割 (手动 lazy)
const AnalyticsChart = lazy(() => import('@cinacoin/ui/charts'));
const WalletTable = lazy(() => import('@cinacoin/ui/tables'));
```

### 9.2 资源优化

| 策略 | 实现 | 目标 |
|------|------|------|
| 图片优化 | Next.js Image + AVIF/WebP | LCP < 2s |
| 字体优化 | `next/font` + 子集化 | FCP < 1s |
| JS 压缩 | Turbopack + Tree-shaking | Bundle < 200KB |
| CSS 优化 | Tailwind JIT + PurgeCSS | CSS < 50KB |
| 预加载 | `<link rel="prefetch">` | 导航即时 |
| 缓存 | Service Worker + HTTP Cache | 重复访问 < 500ms |

### 9.3 Bundle 预算

| 类型 | 预算 | 警告阈值 |
|------|------|----------|
| Initial JS | ≤ 200KB | 180KB |
| Initial CSS | ≤ 50KB | 40KB |
| Per-route JS | ≤ 100KB | 80KB |
| Total JS | ≤ 500KB | 400KB |
| Images (LCP) | ≤ 100KB | 80KB |

---

## 10. 部署架构

### 10.1 部署拓扑

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │      CDN        │
                    │   (Global Edge) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼───┐  ┌──────▼──────┐  ┌───▼─────────┐
    │  CF Pages   │  │ CF Workers  │  │   Vercel    │
    │  (静态站点) │  │  (API/边缘) │  │  (SSR 应用) │
    └─────────────┘  └─────────────┘  └─────────────┘
          │                │                │
    ┌─────┴─────┐    ┌────┴────┐     ┌─────┴─────┐
    │ website   │    │ rpc     │     │ cloud     │
    │ status    │    │ keys    │     │ backend   │
    │ docs      │    │ relay   │     │ analytics │
    │ demo-react│    │ notify  │     │ explorer  │
    └───────────┘    └─────────┘     └───────────┘
```

### 10.2 CI/CD 流水线

```yaml
# turbo.json 增量构建配置
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"],
      "inputs": ["src/**", "public/**", "next.config.*", "tsconfig.*"]
    },
    "lint": {
      "inputs": ["src/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.*"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "tests/**"]
    }
  }
}
```

---

## 11. 监控与可观测性

### 11.1 前端监控栈

| 层级 | 工具 | 用途 |
|------|------|------|
| 性能 | Web Vitals API | LCP/FID/CLS 上报 |
| 错误 | Sentry (自建) | 异常追踪 + SourceMap |
| 分析 | `@cinacoin/analytics` | 隐私合规的用户行为 |
| 日志 | `@cinacoin/analytics-server` | 结构化日志聚合 |
| 状态 | `health-status` 应用 | 服务可用性监控 |

### 11.2 错误边界

```typescript
// packages/ui/components/ErrorBoundary.tsx
// 分层错误处理：
// 1. 全局错误边界 → 500 页面
// 2. 路由错误边界 → 路由级降级
// 3. 组件错误边界 → 局部降级 (skeleton)
// 4. API 错误处理 → Toast 通知
```

---

## 12. 国际化 (i18n)

### 12.1 架构

```typescript
// packages/cinacoin-i18n/
// 统一的国际化方案

// 支持的语言
const locales = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'] as const;

// 翻译文件结构
// locales/
//   en/
//     common.json      # 通用文本
//     nav.json         # 导航文本
//     cloud.json       # Cloud 应用文本
//     backend.json     # Backend 应用文本
//     ...

// 使用方式
const { t } = useTranslation('cloud');
t('projects.title'); // "My Projects"
```

---

## 附录 A: 技术栈总结

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 15.x |
| UI 库 | React | 19.x |
| 样式 | Tailwind CSS + CSS Variables | 4.x |
| 状态 | Zustand + TanStack Query | 5.x / 5.x |
| 路由 | Next.js App Router | 15.x |
| 构建 | Turborepo + pnpm | Latest |
| 类型 | TypeScript (strict) | 5.x |
| 测试 | Vitest + Playwright | Latest |
| 部署 | Cloudflare + Vercel | - |
| 监控 | Sentry + Web Vitals | - |

---

*文档维护: Cinacoin Frontend Team | 最后更新: 2026-06-08*

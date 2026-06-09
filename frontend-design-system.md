# Cinacoin 前端设计系统 (Design System)

> **版本**: 1.0.0 | **日期**: 2026-06-08 | **状态**: 设计阶段

---

## 1. 设计原则

### 1.1 核心理念

| 原则 | 描述 | 实践 |
|------|------|------|
| **清晰优先** | 信息层次分明，减少认知负担 | 大量留白、清晰排版、语义化色彩 |
| **一致性** | 跨应用视觉和交互统一 | 共享 Design Tokens、组件库 |
| **高效** | 减少操作步骤，加速任务完成 | 键盘快捷键、批量操作、智能默认值 |
| **可及** | 面向所有用户，包括残障人士 | WCAG 2.1 AA、屏幕阅读器支持 |
| **品牌感** | 专业而不冰冷，现代而不花哨 | 克制的动效、精选的排版 |

### 1.2 设计价值观

```
Professional  ───  专业可靠，企业级品质
Minimal       ───  少即是多，聚焦核心功能
Accessible    ───  人人可用，无门槛体验
Responsive    ───  全设备适配，无缝体验
```

---

## 2. Design Tokens

### 2.1 颜色系统

#### 2.1.1 品牌色

```css
/* packages/ui-theme/tokens/colors.css */
:root {
  /* Brand Blue — 品牌标识色，用于链接、徽章、渐变 */
  --brand-50:  #eff6ff;
  --brand-100: #dbeafe;
  --brand-200: #bfdbfe;
  --brand-300: #93c5fd;
  --brand-400: #60a5fa;
  --brand-500: #3b82f6;  /* 主品牌色 */
  --brand-600: #2563eb;
  --brand-700: #1d4ed8;
  --brand-800: #1e40af;
  --brand-900: #1e3a8a;
}
```

#### 2.1.2 语义色

```css
:root {
  /* Ink — 主文字/CTA 色 (per DESIGN.md) */
  --ink:        #171717;
  --ink-soft:   #4d4d4d;
  --ink-mute:   #888888;

  /* Canvas — 表面/背景色 */
  --canvas:     #ffffff;
  --canvas-soft:  #fafafa;
  --canvas-soft2: #f5f5f5;

  /* Hairline — 边框色 */
  --hairline:       #ebebeb;
  --hairline-strong: #a1a1a1;

  /* 功能色 */
  --success: #16a34a;
  --warning: #f5a623;
  --danger:  #ee0000;
  --info:    #0070f3;
}

/* 暗色主题 */
[data-theme="dark"] {
  --ink:        #fafafa;
  --ink-soft:   #a1a1a1;
  --ink-mute:   #666666;

  --canvas:     #0a0a0a;
  --canvas-soft:  #141414;
  --canvas-soft2: #1a1a1a;

  --hairline:       #262626;
  --hairline-strong: #404040;

  --success: #22c55e;
  --warning: #fbbf24;
  --danger:  #ef4444;
  --info:    #3b82f6;
}
```

#### 2.1.3 渐变色

```css
:root {
  /* Hero 网格渐变 (per DESIGN.md) */
  --gradient-develop: linear-gradient(135deg, #007cf0 0%, #00dfd8 100%);
  --gradient-preview: linear-gradient(135deg, #7928ca 0%, #ff0080 100%);
  --gradient-ship:    linear-gradient(135deg, #ff4d4d 0%, #f9cb28 100%);

  /* 通用渐变 */
  --gradient-primary: linear-gradient(135deg, var(--brand-500) 0%, var(--brand-700) 100%);
  --gradient-surface: linear-gradient(180deg, var(--canvas) 0%, var(--canvas-soft) 100%);
}
```

### 2.2 排版系统

#### 2.2.1 字体

```css
:root {
  /* 主字体 — Inter (已优化子集化) */
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* 等宽字体 — JetBrains Mono */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* 字体权重 */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;
}
```

#### 2.2.2 字号阶梯

| Token | 大小 | 行高 | 用途 |
|-------|------|------|------|
| `text-xs` | 12px | 16px | 辅助文本、标签 |
| `text-sm` | 14px | 20px | 次要文本、表格 |
| `text-base` | 16px | 24px | 正文默认 |
| `text-lg` | 18px | 28px | 小标题 |
| `text-xl` | 20px | 28px | 页面标题 |
| `text-2xl` | 24px | 32px | 区域标题 |
| `text-3xl` | 30px | 36px | 大标题 |
| `text-4xl` | 36px | 40px | Hero 标题 |
| `text-5xl` | 48px | 48px | 超大标题 |

#### 2.2.3 排版层级

```css
/* 页面标题 */
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--ink);
}

/* 区域标题 */
.heading-2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--ink);
}

/* 正文 */
.body-large {
  font-size: var(--text-lg);
  line-height: 1.6;
  color: var(--ink-soft);
}

.body-default {
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--ink);
}

.body-small {
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--ink-soft);
}

/* 代码 */
.code {
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: var(--canvas-soft2);
  padding: 0.125em 0.375em;
  border-radius: 4px;
}
```

### 2.3 间距系统

```css
:root {
  /* 4px 基准网格 */
  --space-0:  0;
  --space-1:  4px;    /* 0.25rem */
  --space-2:  8px;    /* 0.5rem */
  --space-3:  12px;   /* 0.75rem */
  --space-4:  16px;   /* 1rem */
  --space-5:  20px;   /* 1.25rem */
  --space-6:  24px;   /* 1.5rem */
  --space-8:  32px;   /* 2rem */
  --space-10: 40px;   /* 2.5rem */
  --space-12: 48px;   /* 3rem */
  --space-16: 64px;   /* 4rem */
  --space-20: 80px;   /* 5rem */
  --space-24: 96px;   /* 6rem */
}
```

### 2.4 圆角系统

```css
:root {
  --radius-none: 0;
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  24px;
  --radius-full: 9999px;
}
```

### 2.5 阴影系统

```css
:root {
  --shadow-xs:  0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm:  0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* 暗色主题阴影 */
[data-theme="dark"] {
  --shadow-xs:  0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-sm:  0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
}
```

### 2.6 动效系统

```css
:root {
  /* 时长 */
  --duration-instant: 50ms;
  --duration-fast:    100ms;
  --duration-normal:  200ms;
  --duration-slow:    300ms;
  --duration-slower:  500ms;

  /* 缓动 */
  --ease-default:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce:   cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* 过渡 */
  --transition-colors: color var(--duration-fast) var(--ease-default),
                       background-color var(--duration-fast) var(--ease-default),
                       border-color var(--duration-fast) var(--ease-default);
  --transition-transform: transform var(--duration-normal) var(--ease-default);
  --transition-opacity: opacity var(--duration-normal) var(--ease-default);
}

/* 减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant: 0ms;
    --duration-fast:    0ms;
    --duration-normal:  0ms;
    --duration-slow:    0ms;
  }
}
```

---

## 3. 组件设计规范

### 3.1 按钮 (Button)

#### 变体

```
┌─────────────────────────────────────────────────────────┐
│  Button Variants                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Primary    [████████ Submit ████████]                   │
│             bg: ink → ink-soft on hover                  │
│             text: canvas                                 │
│                                                          │
│  Secondary  [──── Outline Button ────]                   │
│             border: hairline-strong                      │
│             text: ink                                    │
│                                                          │
│  Ghost      [  Text Button  ]                            │
│             bg: transparent → canvas-soft on hover       │
│             text: ink                                    │
│                                                          │
│  Danger     [████ Delete ████]                           │
│             bg: danger                                   │
│             text: white                                  │
│                                                          │
│  Brand      [████ Connect ████]                          │
│             bg: brand-500 → brand-600 on hover           │
│             text: white                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 尺寸

| 尺寸 | 高度 | 内边距 | 字号 | 用途 |
|------|------|--------|------|------|
| `xs` | 24px | 8px 12px | 12px | 表格内操作 |
| `sm` | 32px | 8px 16px | 14px | 次要操作 |
| `md` | 40px | 10px 20px | 14px | 默认 |
| `lg` | 48px | 12px 24px | 16px | 主要 CTA |
| `xl` | 56px | 16px 32px | 18px | Hero CTA |

#### 状态

```
Normal → Hover → Active → Focus → Disabled → Loading
  │         │        │        │        │          │
  │      bg加深   scale(.98)  ring   opacity    spinner
  │               )         2px     .5        + text
```

### 3.2 输入框 (Input)

```
┌─────────────────────────────────────────────────────────┐
│  Input States                                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Default    [  Placeholder text...          ]            │
│             border: hairline                             │
│                                                          │
│  Hover      [  Placeholder text...          ]            │
│             border: hairline-strong                      │
│                                                          │
│  Focus      [  Typed text here              ]            │
│             border: brand-500                            │
│             ring: brand-100 (2px)                        │
│                                                          │
│  Error      [  Invalid input                ]            │
│             border: danger                               │
│             icon: ⚠️ (right)                             │
│             message: "Please enter a valid email"        │
│                                                          │
│  Disabled   [  Disabled text                ]            │
│             bg: canvas-soft2                             │
│             opacity: 0.5                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 3.3 卡片 (Card)

```css
.card {
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-xs);
  transition: var(--transition-colors), var(--transition-transform);
}

.card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--hairline-strong);
}

.card-interactive:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

### 3.4 表格 (Table)

```
┌─────────────────────────────────────────────────────────────────┐
│  Header Row (bg: canvas-soft, font-weight: medium)              │
├──────────┬──────────────┬──────────────┬──────────────┬────────┤
│  Name    │  Address     │  Balance     │  Status      │  Actions│
├──────────┼──────────────┼──────────────┼──────────────┼────────┤
│  Row 1   │  0x1234...   │  1,234.56    │  ● Active    │  ⋯    │  ← hover: canvas-soft
│  Row 2   │  0x5678...   │  789.00      │  ● Inactive  │  ⋯    │
│  Row 3   │  0x9abc...   │  42,000.00   │  ● Active    │  ⋯    │
├──────────┴──────────────┴──────────────┴──────────────┴────────┤
│  Footer: Showing 1-10 of 104 results    [< 1 2 3 ... 11 >]    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 导航组件

#### Sidebar 导航项

```
┌────────────────────────────────────┐
│  📊 Dashboard                      │  ← 默认: ink-soft
│                                    │
│  💰 Wallets              [12]      │  ← hover: ink + canvas-soft bg
│                                    │
│  ▸ 📈 Analytics                    │  ← active: ink + brand-50 bg + 左边框
│     ├─ Overview                    │     (brand-500, 3px)
│     ├─ Realtime                    │
│     └─ Reports                     │
│                                    │
│  ⚙️ Settings                       │  ← disabled: ink-mute
└────────────────────────────────────┘
```

---

## 4. 图标系统

### 4.1 图标规范

| 属性 | 值 |
|------|-----|
| 库 | Lucide React |
| 默认尺寸 | 20px (stroke-width: 1.5) |
| 小尺寸 | 16px (stroke-width: 1.5) |
| 大尺寸 | 24px (stroke-width: 1.5) |
| 颜色 | `currentColor` (继承文字色) |

### 4.2 图标使用原则

- 功能图标：始终配文字标签（不单独使用）
- 导航图标：可单独使用（侧边栏已展开时）
- 状态图标：用颜色区分语义（绿=成功，红=错误，黄=警告）

---

## 5. 布局模式

### 5.1 页面布局模板

#### 仪表板布局 (Dashboard)

```
┌──────────────────────────────────────────────────────────┐
│  Header (h: 64px, border-bottom: hairline)               │
├──────────┬───────────────────────────────────────────────┤
│          │  Breadcrumb: Dashboard > Overview             │
│ Sidebar  ├───────────────────────────────────────────────┤
│ (w:240)  │                                               │
│          │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ 固定     │  │ Stat    │ │ Stat    │ │ Stat    │        │
│          │  │ Card 1  │ │ Card 2  │ │ Card 3  │        │
│ 可折叠   │  └─────────┘ └─────────┘ └─────────┘        │
│          │                                               │
│ (xs:隐藏)│  ┌──────────────────────────────────────┐    │
│          │  │           Main Content Area           │    │
│          │  │           (Charts/Tables)             │    │
│          │  └──────────────────────────────────────┘    │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘
```

#### 内容页布局 (Content)

```
┌──────────────────────────────────────────────────────────┐
│  Header                                                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Page Title                            [Action]    │  │
│  │  Subtitle / Description                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  Content (max-width: 800px, centered)              │  │
│  │                                                    │  │
│  │  Prose typography for docs/articles                │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

#### 列表页布局 (List)

```
┌──────────────────────────────────────────────────────────┐
│  Header                                                   │
├──────────┬───────────────────────────────────────────────┤
│ Sidebar  │  Title              [Filter] [Sort] [+ New]   │
│          ├───────────────────────────────────────────────┤
│          │  Search: [___________________________] 🔍     │
│          ├───────────────────────────────────────────────┤
│          │  ┌─────────────────────────────────────────┐  │
│          │  │  List Item 1                   →        │  │
│          │  ├─────────────────────────────────────────┤  │
│          │  │  List Item 2                   →        │  │
│          │  ├─────────────────────────────────────────┤  │
│          │  │  List Item 3                   →        │  │
│          │  └─────────────────────────────────────────┘  │
│          │                                               │
│          │  Pagination: [< 1 2 3 ... >]                  │
└──────────┴───────────────────────────────────────────────┘
```

### 5.2 栅格系统

```css
/* 12 列栅格 */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

/* 响应式列数 */
.col-12 { grid-column: span 12; }  /* 全宽 */
.col-8  { grid-column: span 8; }   /* 2/3 */
.col-6  { grid-column: span 6; }   /* 1/2 */
.col-4  { grid-column: span 4; }   /* 1/3 */
.col-3  { grid-column: span 3; }   /* 1/4 */

/* 响应式 */
@media (max-width: 768px) {
  .col-md-12 { grid-column: span 12; }
  .col-md-6  { grid-column: span 6; }
}

@media (max-width: 640px) {
  .col-sm-12 { grid-column: span 12; }
}
```

---

## 6. 交互模式

### 6.1 反馈系统

#### Toast 通知

```
┌─────────────────────────────────────────────────┐
│  ✅  Success   Operation completed successfully │  ← 自动消失 (5s)
│  ⚠️  Warning   API rate limit approaching       │  ← 自动消失 (8s)
│  ❌  Error     Failed to save changes           │  ← 需手动关闭
│  ℹ️  Info      New version available             │  ← 自动消失 (5s)
└─────────────────────────────────────────────────┘
位置: 右上角，堆叠显示
最大同时显示: 3 个
```

#### 加载状态

```
1. 页面加载 → Skeleton (骨架屏)
2. 按钮操作 → Spinner + disabled
3. 列表加载 → Skeleton rows
4. 图表加载 → Pulse animation
5. 无限滚动 → Spinner at bottom
```

### 6.2 空状态设计

```
┌─────────────────────────────────────┐
│                                      │
│           [  Illustration  ]         │
│                                      │
│        No projects yet               │
│                                      │
│   Create your first project to       │
│   get started with Cinacoin.         │
│                                      │
│        [+ Create Project]            │
│                                      │
│   📖 Read the guide →                │
│                                      │
└─────────────────────────────────────┘
```

### 6.3 确认对话框

```
┌─────────────────────────────────────────┐
│  ⚠️  Delete Project                     │
├─────────────────────────────────────────┤
│                                          │
│  Are you sure you want to delete        │
│  "My Project"? This action cannot       │
│  be undone.                              │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  Type "My Project" to confirm    │   │
│  └──────────────────────────────────┘   │
│                                          │
│              [Cancel]  [🗑 Delete]        │
│                         (danger button)   │
└─────────────────────────────────────────┘
```

---

## 7. 暗色/亮色主题

### 7.1 主题切换机制

```typescript
// 三种模式: light / dark / system
// system 模式跟随操作系统偏好

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useGlobalStore(s => [s.theme, s.setTheme]);
  const systemTheme = useMediaQuery('(prefers-color-scheme: dark)');
  const resolved = theme === 'system' ? (systemTheme ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  return <ThemeContext.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeContext.Provider>;
};
```

### 7.2 主题对比度要求

| 组合 | 最低对比度 | 目标 |
|------|-----------|------|
| 正文文字/背景 | 4.5:1 | 7:1 |
| 大标题/背景 | 3:1 | 4.5:1 |
| UI 组件/背景 | 3:1 | 4.5:1 |
| 禁用状态 | 不要求 | 仍可辨识 |

---

## 8. 统一搜索功能

### 8.1 全局搜索 (Command Palette)

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search...                            ⌘K             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Recent                                                   │
│    📄 API Documentation                     ⌘D          │
│    💰 Wallet 0x1234...                      ⌘W          │
│    📊 Analytics Dashboard                   ⌘A          │
│                                                          │
│  Actions                                                  │
│    🌙 Toggle Dark Mode                    ⌘⇧D          │
│    🌐 Switch Language                     ⌘⇧L          │
│    📋 Copy API Key                        ⌘⇧C          │
│                                                          │
│  Navigation                                               │
│    → Cloud Dashboard                                     │
│    → Backend Dashboard                                   │
│    → Analytics                                           │
│    → Wallet Explorer                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 8.2 搜索实现

```typescript
// packages/ui/components/CommandPalette.tsx
// 基于 cmdk 库实现

const CommandPalette = () => {
  const [open, setOpen] = useState(false);

  // 全局快捷键 ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Search everything..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {/* 跨应用导航结果 */}
          </CommandGroup>
          <CommandGroup heading="Actions">
            {/* 快捷操作 */}
          </CommandGroup>
          <CommandGroup heading="Recent">
            {/* 最近访问 */}
          </CommandGroup>
        </CommandList>
      </Command>
    </Dialog>
  );
};
```

---

## 9. 通知中心

### 9.1 设计

```
┌─────────────────────────────────────────────────────────┐
│  🔔 Notifications                         [Mark all read]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Today                                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🔵  New deployment successful                    │   │
│  │      Cloud Dashboard v2.1.0 deployed              │   │
│  │      2 minutes ago                                │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  🟡  API rate limit warning                       │   │
│  │      Project "MyApp" at 80% of quota              │   │
│  │      1 hour ago                                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Yesterday                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🔴  Payment failed                               │   │
│  │      Invoice #1234 payment declined               │   │
│  │      Yesterday at 14:30                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [View all notifications →]                              │
└─────────────────────────────────────────────────────────┘
```

---

## 10. 用户个人资料和设置

### 10.1 设置页面结构

```
┌──────────────────────────────────────────────────────────┐
│  Settings                                                 │
├────────────┬─────────────────────────────────────────────┤
│            │                                              │
│  Profile   │  Profile Settings                            │
│  Account   │                                              │
│  Security  │  Avatar:  [📷 Upload]                        │
│  Appearance│  Name:    [John Doe            ]             │
│  Notifications│ Email:  [john@example.com    ]            │
│  API Keys  │  Bio:     [____________________]             │
│            │                                              │
│            │              [Save Changes]                   │
│            │                                              │
└────────────┴─────────────────────────────────────────────┘
```

---

## 11. 可访问性 (Accessibility)

### 11.1 WCAG 2.1 AA 合规清单

| 要求 | 实现方式 |
|------|----------|
| 键盘导航 | 所有交互元素可 Tab 聚焦 |
| 焦点可见 | 2px brand-500 ring |
| 色彩对比 | 文字 ≥ 4.5:1，UI ≥ 3:1 |
| 屏幕阅读器 | ARIA 标签 + 语义化 HTML |
| 动效减少 | `prefers-reduced-motion` 支持 |
| 表单错误 | 关联 `<label>` + `aria-describedby` |
| 图片替代 | `alt` 文本或 `aria-label` |
| 跳转链接 | Skip to content 链接 |

### 11.2 ARIA 模式

```typescript
// 侧边栏
<nav aria-label="Main navigation" role="navigation">
  <button aria-expanded={isOpen} aria-controls="sidebar-menu">
    Menu
  </button>
  <ul id="sidebar-menu" role="menu">
    <li role="menuitem">...</li>
  </ul>
</nav>

// 通知
<div role="status" aria-live="polite" aria-atomic="true">
  {unreadCount} unread notifications
</div>

// 加载
<div role="progressbar" aria-valuenow={progress} aria-label="Loading">
  <Skeleton />
</div>
```

---

## 附录: Design Token 导出格式

| 格式 | 用途 | 文件 |
|------|------|------|
| CSS Variables | Web 应用 | `tokens.css` |
| Tailwind Preset | Tailwind 项目 | `tailwind-preset.ts` |
| JSON | 设计工具同步 | `tokens.json` |
| TypeScript | 类型安全引用 | `tokens.ts` |

---

*文档维护: Cinacoin Design Team | 最后更新: 2026-06-08*

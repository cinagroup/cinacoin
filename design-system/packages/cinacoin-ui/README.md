# @cinacoin/ui

Cinacoin UI 组件库 — 基于 Vercel/geist 设计系统的 React 组件库。

## 特性

- 🎨 **Vercel 风格设计** — 极简、精确、工程感
- 📦 **TypeScript 优先** — 完整的类型定义
- 🌳 **Tree-shaking 支持** — 只打包你使用的组件
- ♿ **可访问性** — 遵循 WAI-ARIA 最佳实践
- 🎯 **forwardRef 支持** — 所有组件都支持 ref 转发
- 🎭 **Compound Components** — 灵活的组合模式

## 安装

```bash
npm install @cinacoin/ui
# or
yarn add @cinacoin/ui
# or
pnpm add @cinacoin/ui
```

### Peer Dependencies

确保已安装以下依赖：

```bash
npm install react react-dom tailwindcss
```

## 快速开始

### 1. 导入样式

在你的应用入口导入全局样式：

```tsx
import '@cinacoin/ui/styles';
import './globals.css'; // 你的全局样式
```

### 2. 使用组件

```tsx
import { Button, Card, Input } from '@cinacoin/ui';

export default function Page() {
  return (
    <div className="p-8">
      <Card variant="marketing">
        <Card.Header>
          <h2 className="text-xl font-semibold">Welcome</h2>
        </Card.Header>
        <Card.Body>
          <Input 
            label="Email" 
            placeholder="Enter your email"
            size="lg"
          />
        </Card.Body>
        <Card.Footer>
          <Button variant="primary">Get Started</Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
```

## 组件文档

### Button

按钮组件，支持多种变体和尺寸。

```tsx
<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'primary-sm' \| 'secondary-sm' \| 'nav-cta' \| 'tab-ghost'` | `'primary'` | 按钮样式变体 |
| `size` | `'sm' \| 'md' \| 'lg'` | - | 按钮尺寸（覆盖 variant 默认值） |
| `asChild` | `boolean` | `false` | Radix UI 风格的子元素渲染 |
| `loading` | `boolean` | `false` | 显示加载状态 |
| `disabled` | `boolean` | `false` | 禁用状态 |

### Card

卡片组件，支持多种变体和子组件。

```tsx
<Card variant="marketing" hover>
  <Card.Header>Header</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Footer</Card.Footer>
</Card>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'marketing' \| 'marketing-large' \| 'soft' \| 'template' \| 'pricing' \| 'pricing-featured'` | `'marketing'` | 卡片样式变体 |
| `hover` | `boolean` | `false` | 启用悬停效果 |
| `asChild` | `boolean` | `false` | Radix UI 风格的子元素渲染 |

### Input

输入框组件，支持标签、描述、前缀/后缀。

```tsx
<Input
  label="Email"
  placeholder="Enter your email"
  description="We'll never share your email"
  prefix={<MailIcon />}
  size="md"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 输入框尺寸 |
| `error` | `boolean` | `false` | 错误状态 |
| `label` | `string` | - | 标签文本 |
| `description` | `string` | - | 描述文本 |
| `prefix` | `ReactNode` | - | 前缀图标或文本 |
| `suffix` | `ReactNode` | - | 后缀图标或文本 |

### NavBar

导航栏组件，响应式设计。

```tsx
<NavBar
  logo={<Logo />}
  items={[
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
  ]}
  actions={
    <>
      <Button variant="nav-cta">Login</Button>
      <Button variant="primary">Sign Up</Button>
    </>
  }
  sticky
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logo` | `ReactNode` | - | Logo 插槽 |
| `items` | `NavItem[]` | `[]` | 导航项数组 |
| `actions` | `ReactNode` | - | CTA 按钮插槽 |
| `sticky` | `boolean` | `true` | 粘性定位 |

### PricingCard

定价卡片组件。

```tsx
<PricingCard
  name="Pro"
  price="$29"
  period="/month"
  description="For growing teams"
  features={['Unlimited projects', 'Priority support', 'Advanced analytics']}
  cta={<Button>Get Started</Button>}
  badge="Most Popular"
  featured
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `featured` | `boolean` | `false` | 反色高亮样式 |
| `name` | `string` | - | 套餐名称 |
| `price` | `string` | - | 价格显示 |
| `period` | `string` | - | 价格周期 |
| `description` | `string` | - | 描述文本 |
| `features` | `string[]` | `[]` | 功能列表 |
| `cta` | `ReactNode` | - | CTA 按钮 |
| `badge` | `string` | - | 徽章文本 |

### HeroBand

英雄区域组件。

```tsx
<HeroBand
  eyebrow="New Feature"
  headline="Build faster with Cinacoin"
  body="The modern platform for building web applications"
  primaryCTA={<Button variant="primary">Get Started</Button>}
  secondaryCTA={<Button variant="secondary">Learn More</Button>}
  background={<MeshGradient />}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `eyebrow` | `string` | - | 顶部徽章文本 |
| `headline` | `ReactNode` | - | 标题（display-xl） |
| `body` | `string` | - | 正文文本 |
| `primaryCTA` | `ReactNode` | - | 主要 CTA 按钮 |
| `secondaryCTA` | `ReactNode` | - | 次要 CTA 按钮 |
| `background` | `ReactNode` | - | 背景元素 |

### MeshGradient

网格渐变背景组件。

```tsx
<MeshGradient
  animated
  duration={8}
  opacity={0.4}
  colors={['cyan', 'blue', 'magenta', 'amber']}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animated` | `boolean` | `true` | 启用动画 |
| `duration` | `number` | `8` | 动画时长（秒） |
| `opacity` | `number` | `0.4` | 透明度 |
| `colors` | `MeshGradientColor[]` | `['cyan', 'blue', 'magenta', 'amber']` | 颜色组合 |

## 设计原则

### 1. 极简主义

遵循 Vercel/geist 的设计哲学：

- **少即是多** — 去除不必要的装饰
- **精确对齐** — 使用 8px 网格系统
- **留白呼吸** — 充足的间距和留白

### 2. 颜色系统

```css
/* 前景色 */
--color-fg: #171717;

/* 背景色 */
--color-bg: #ffffff;
--color-bg-soft: #fafafa;

/* 边框色 */
--color-border: #ebebeb;

/* 次要文本 */
--color-text-secondary: #4d4d4d;

/* 链接色 */
--color-link: #0070f3;
```

### 3. 阴影系统

5 级阴影层次：

- **Level 0**: 无阴影
- **Level 1**: 内嵌细线（hairline）
- **Level 2**: 轻微浮起
- **Level 3**: 卡片默认
- **Level 4**: 大卡片/悬停
- **Level 5**: 模态框/弹出层

### 4. 字体系统

- **Display XL**: 48px/600 — 英雄标题
- **Display LG**: 32px/600 — 章节标题
- **Display MD**: 24px/600 — 子标题
- **Body MD**: 16px/400 — 正文
- **Body SM**: 14px/400 — 次要文本
- **Caption**: 12px/400 — 说明文字

## 工具函数

### cn()

合并 className，防止 Tailwind 类冲突。

```tsx
import { cn } from '@cinacoin/ui';

const className = cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  className
);
```

### useTheme()

主题管理 hook。

```tsx
import { useTheme } from '@cinacoin/ui';

function ThemeToggle() {
  const { theme, setTheme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme.mode === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### useMediaQuery()

响应式媒体查询 hook。

```tsx
import { useMediaQuery } from '@cinacoin/ui';

function Component() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 开发设置

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 构建
pnpm build
```

### 代码规范

- 使用 TypeScript 严格模式
- 所有组件使用 `forwardRef`
- 遵循 ESLint 配置
- 编写单元测试
- 添加 Storybook stories

## 许可证

MIT © Cinacoin

## 链接

- [文档](https://docs.cinacoin.com)
- [示例](https://examples.cinacoin.com)
- [问题反馈](https://github.com/cinacoin/ui/issues)

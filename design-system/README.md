# @cinacoin/design-system

CINAcoin 共享设计系统 — 基于 Vercel 风格的单色设计规范。

## 安装

### 方式 1：npm 包（推荐用于 monorepo）

```bash
# 从 workspace 根目录
npm install @cinacoin/design-system@file:./design-system
```

### 方式 2：直接复制

将 `design-system/` 目录复制到项目中的 `src/design-system/`。

## 使用

### CSS 变量 + 组件（完整引入）

```css
/* 在你的入口 CSS 中 */
@import '@cinacoin/design-system';
```

### 按需引入

```css
@import '@cinacoin/design-system/tokens';
@import '@cinacoin/design-system/components/button';
@import '@cinacoin/design-system/components/card';
```

### Tailwind CSS

```js
// tailwind.config.js
const cinacoinPreset = require('@cinacoin/design-system/tailwind');

module.exports = {
  presets: [cinacoinPreset],
  content: ['./src/**/*.{html,jsx,tsx,vue}'],
};
```

## 组件

### Button

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-danger">Danger</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Card

```html
<div class="card card-e1">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-description">Card description text</p>
  </div>
  <div class="card-body">Content here</div>
  <div class="card-footer">Footer</div>
</div>

<!-- Interactive card -->
<div class="card card-e2 card-interactive">Hover me</div>

<!-- Feature card (larger radius) -->
<div class="card card-e3 card-feature">Feature</div>
```

### Input

```html
<div class="input-group">
  <label class="input-label">Email</label>
  <input class="input" type="email" placeholder="you@example.com" />
  <span class="input-helper">We'll never share your email</span>
</div>

<!-- Error state -->
<input class="input input-error" type="email" />
<span class="input-helper-error">Invalid email address</span>
```

### Badge / Tag

```html
<span class="badge">Default</span>
<span class="badge badge-pill">Pill</span>
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success badge-dot-success badge-dot">Active</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-mono">0x1234</span>
```

### Typography

```html
<h1 class="display-1">Hero Headline</h1>
<h2 class="display-2">Section Headline</h2>
<h3 class="display-3">Sub-section</h3>
<h4 class="title">Card Title</h4>
<p class="body-lg">Lead paragraph</p>
<p class="body">Default body text</p>
<p class="body-sm">Secondary text</p>
<span class="caption">LABEL</span>
<code class="mono">const x = 42;</code>
```

## 设计令牌

所有值通过 CSS 自定义属性暴露，前缀 `--color-`, `--space-`, `--radius-`, `--shadow-`, `--text-`, `--font-` 等。

```css
.my-element {
  color: var(--color-ink);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: var(--shadow-1-border);
}
```

## 规范

完整设计规范见 [DESIGN.md](./DESIGN.md)。

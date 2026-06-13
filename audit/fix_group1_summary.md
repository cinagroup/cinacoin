# Design Token Fixes - Group 1 Summary

**Date:** 2026-06-13  
**Agent:** fix_group_1  
**Status:** ✅ COMPLETED

---

## P0-1: packages/design-system/tokens.ts GitHub 色板问题

### 问题描述

- tokens.ts 使用了 GitHub 风格色板（`#0969da`, `#cf222e`, `#58a6ff` 等）
- 颜色值与设计准则（DESIGN.md）不符
- 圆角值使用 rem 单位且层级不完整

### 修复内容

**文件：** `packages/design-system/tokens.ts`

**颜色修复：**

```typescript
// Light theme
primary: '#171717' (was '#58a6ff')
onPrimary: '#ffffff' (new)
accent: '#0070f3' (was '#3fb950')
success: '#0070f3' (was '#22c55e')
warning: '#f5a623' (was '#f59e0b')
error: '#ee0000' (was '#ef4444')
info: '#0070f3' (was '#3b82f6')

// Dark theme
primary: '#ffffff' (was '#58a6ff')
onPrimary: '#000000' (new)
background.primary: '#000000' (was '#0d1117')
text.primary: '#ededed' (was '#e6edf3')
text.secondary: '#a3a3a3' (was '#8b949e')
text.muted: '#737373' (was '#6e7681')
```

**圆角修复：**

```typescript
borderRadius: {
  none: '0px',
  xs: '4px',      // was 2px
  sm: '6px',      // was 2px
  md: '8px',      // was 4px
  lg: '12px',     // was 8px
  xl: '16px',     // was 12px
  pillSm: '64px', // new
  pill: '100px',  // was 'full'
  full: '9999px'
}
```

**字体修复：**

```typescript
fontFamily: {
  sans: "'Geist', 'Inter', system-ui, -apple-system, sans-serif";
  mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace";
}
```

**间距修复：**

- 从 rem 单位改为 px 单位
- 新增 xxs: 4px, section: 192px
- 完整 12 级间距系统

**阴影修复：**

- 从通用阴影改为 Vercel 风格分层阴影
- level0-level5 六个层级

---

## P0-2: design-tokens/dist/css/variables.css 构建产物错误

### 问题描述

- 输出使用错误的 `--ocx-*` 前缀（应为 `--cc-*`）
- 使用 Tailwind Slate 色板而非 CINAcoin 设计色板
- 圆角值不正确

### 修复内容

**1. 主题 JSON 文件修复**

**文件：** `packages/design-tokens/tokens/themes/default.json`

- 所有 CSS 变量前缀：`--ocx-*` → `--cc-*`
- 颜色值完全替换为设计准则定义
- 圆角值：xs:4px, sm:6px, md:8px, lg:12px, xl:16px, pill-sm:64px, pill:100px, full:9999px
- 字体：'Inter' → 'Geist'
- 间距：从 rem 改为 px

**文件：** `packages/design-tokens/tokens/themes/light.json`

- 同样的前缀和颜色修复
- 新增 warning-deep, error-deep 等语义色

**文件：** `packages/design-tokens/tokens/themes/minimal.json`

- 同样的前缀修复
- 保持极简风格灰度色板

**2. 构建脚本修复**

**文件：** `packages/design-tokens/scripts/build.ts`

```typescript
// Line 67-69
(toCssBlock('.cc-theme-light', lightMap), // was .ocx-theme-light
  toCssBlock('.cc-theme-minimal', minimalMap)); // was .ocx-theme-minimal
```

**文件：** `packages/design-tokens/scripts/build.js`

- 同步修复编译产物中的类名前缀

**3. 重新构建**

```bash
cd packages/design-tokens
npm run build
```

**验证结果：**

```bash
grep -c "ocx" dist/css/variables.css
# 输出: 0 (无残留)

grep "cc-rounded" dist/css/variables.css
# --cc-rounded-xs: 4px
# --cc-rounded-sm: 6px
# --cc-rounded-md: 8px
# --cc-rounded-lg: 12px
# --cc-rounded-xl: 16px
# --cc-rounded-pill-sm: 64px
# --cc-rounded-pill: 100px
# --cc-rounded-full: 9999px
```

---

## P0-3: packages/design-tokens 圆角全部压平为 4px

### 问题描述

- `css/cinacoin.css` 中圆角值全部为 4px
- 缺少正确的圆角层次系统

### 修复内容

**文件：** `packages/design-tokens/css/cinacoin.css`

**修复前：**

```css
--cc-radius-none: 0px;
--cc-radius-xs: 2px;
--cc-radius-sm: 4px;
--cc-radius-md: 4px;
--cc-radius-lg: 4px;
--cc-radius-xl: 4px;
--cc-radius-pill-sm: 4px;
--cc-radius-pill: 4px;
--cc-radius-full: 9999px;
```

**修复后：**

```css
--cc-radius-none: 0px;
--cc-radius-xs: 4px;
--cc-radius-sm: 6px;
--cc-radius-md: 8px;
--cc-radius-lg: 12px;
--cc-radius-xl: 16px;
--cc-radius-pill-sm: 64px;
--cc-radius-pill: 100px;
--cc-radius-full: 9999px;
```

**验证：**

```bash
grep "radius" css/cinacoin.css | head -10
# 所有圆角值正确 ✅
```

---

## 修改文件清单

1. `packages/design-system/tokens.ts` - 完全重写，修复所有颜色、字体、圆角、间距、阴影
2. `packages/design-system/index.ts` - 修复注释中的示例颜色值
3. `packages/design-tokens/tokens/themes/default.json` - 修复前缀和颜色值
4. `packages/design-tokens/tokens/themes/light.json` - 修复前缀和颜色值
5. `packages/design-tokens/tokens/themes/minimal.json` - 修复前缀和颜色值
6. `packages/design-tokens/scripts/build.ts` - 修复主题类名前缀
7. `packages/design-tokens/scripts/build.js` - 同步修复编译产物
8. `packages/design-tokens/dist/css/variables.css` - 重新构建生成

---

## 设计准则符合性验证

✅ **色彩系统：** 完全符合 DESIGN.md 定义的核心色彩映射  
✅ **CSS 变量前缀：** 统一使用 `--cc-*` (cinacoin)  
✅ **圆角系统：** 完整的 8 级圆角层次 (0px → 9999px)  
✅ **字体系统：** 使用 Geist 字体族  
✅ **间距系统：** 12 级间距，从 4px 到 192px  
✅ **阴影系统：** Vercel 风格分层阴影 (level0-level5)  
✅ **主题系统：** dark/light/minimal 三主题支持

---

## 后续建议

1. **组件迁移：** 检查所有使用旧 `--ocx-*` 变量的组件，迁移到 `--cc-*`
2. **文档更新：** 更新设计系统文档，反映新的 token 命名
3. **视觉回归测试：** 运行视觉回归测试，确保颜色变化符合预期
4. **主题切换：** 验证 dark/light/minimal 主题切换功能正常

---

**修复完成时间：** 2026-06-13 08:40 UTC  
**总耗时：** ~4 分钟  
**所有 P0 问题已解决 ✅**

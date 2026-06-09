# Cinacoin 共享组件清单

> **版本**: 1.0.0 | **日期**: 2026-06-08 | **包名**: `@cinacoin/ui`

---

## 1. 组件库概述

`@cinacoin/ui` 是 Cinacoin 的统一共享组件库，为 7 个应用提供一致的 UI 构建块。

### 1.1 设计原则

| 原则 | 描述 |
|------|------|
| **Composable** | 组件可自由组合，不强制布局 |
| **Accessible** | 内置 ARIA 属性，键盘可操作 |
| **Themeable** | 通过 CSS Variables 支持主题切换 |
| **Typed** | 完整 TypeScript 类型导出 |
| **Tree-shakeable** | 按需导入，不增加无用体积 |
| **Tested** | 每个组件 ≥ 80% 测试覆盖率 |

### 1.2 导入方式

```typescript
// 按需导入 (推荐)
import { Button, Card, Input } from '@cinacoin/ui';

// 子路径导入 (更精确)
import { Button } from '@cinacoin/ui/button';
import { Card } from '@cinacoin/ui/card';

// 类型导入
import type { ButtonProps, CardProps } from '@cinacoin/ui';
```

---

## 2. 基础组件 (Primitives)

### 2.1 按钮 — `Button`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'brand'` | `'primary'` | 按钮变体 |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 按钮尺寸 |
| `loading` | `boolean` | `false` | 加载状态 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `icon` | `ReactNode` | — | 左侧图标 |
| `iconRight` | `ReactNode` | — | 右侧图标 |
| `fullWidth` | `boolean` | `false` | 全宽 |
| `asChild` | `boolean` | `false` | 渲染为子元素 |

**使用场景**: 所有应用  
**依赖**: 无  
**状态**: ✅ 已有基础实现，需统一变体

---

### 2.2 输入框 — `Input`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `'default' \| 'filled' \| 'flushed'` | `'default'` | 输入框变体 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸 |
| `error` | `boolean` | `false` | 错误状态 |
| `leftIcon` | `ReactNode` | — | 左侧图标 |
| `rightIcon` | `ReactNode` | — | 右侧图标 |
| `helperText` | `string` | — | 辅助文本 |
| `errorMessage` | `string` | — | 错误消息 |

**使用场景**: 所有应用  
**依赖**: 无  
**状态**: ✅ 已有基础实现，需添加变体

---

### 2.3 文本域 — `Textarea`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | 调整方向 |
| `autoSize` | `boolean` | `false` | 自动高度 |
| `minRows` | `number` | `3` | 最小行数 |
| `maxRows` | `number` | `10` | 最大行数 |

**使用场景**: 所有应用  
**状态**: 🔨 待创建

---

### 2.4 选择器 — `Select`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `options` | `SelectOption[]` | — | 选项列表 |
| `placeholder` | `string` | `'Select...'` | 占位文本 |
| `searchable` | `boolean` | `false` | 可搜索 |
| `multiple` | `boolean` | `false` | 多选 |
| `clearable` | `boolean` | `false` | 可清除 |
| `loading` | `boolean` | `false` | 加载中 |

**使用场景**: 所有应用  
**依赖**: Radix UI Select  
**状态**: 🔨 待创建

---

### 2.5 复选框 — `Checkbox`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `checked` | `boolean \| 'indeterminate'` | `false` | 选中状态 |
| `label` | `string` | — | 标签文本 |
| `disabled` | `boolean` | `false` | 禁用 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸 |

**使用场景**: 所有应用  
**依赖**: Radix UI Checkbox  
**状态**: 🔨 待创建

---

### 2.6 单选按钮 — `RadioGroup`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `options` | `RadioOption[]` | — | 选项列表 |
| `value` | `string` | — | 当前值 |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | 方向 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸 |

**使用场景**: 所有应用  
**依赖**: Radix UI RadioGroup  
**状态**: 🔨 待创建

---

### 2.7 开关 — `Switch`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `checked` | `boolean` | `false` | 开关状态 |
| `label` | `string` | — | 标签 |
| `disabled` | `boolean` | `false` | 禁用 |
| `size` | `'sm' \| 'md'` | `'md'` | 尺寸 |

**使用场景**: 设置页面、筛选器  
**依赖**: Radix UI Switch  
**状态**: 🔨 待创建

---

### 2.8 徽章 — `Badge`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `'default' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'brand'` | `'default'` | 变体 |
| `size` | `'sm' \| 'md'` | `'md'` | 尺寸 |
| `dot` | `boolean` | `false` | 仅显示圆点 |
| `removable` | `boolean` | `false` | 可移除 |

**使用场景**: 所有应用  
**状态**: ✅ 已有基础实现

---

### 2.9 头像 — `Avatar`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `src` | `string` | — | 图片地址 |
| `alt` | `string` | — | 替代文本 |
| `fallback` | `string` | — | 回退文字 (首字母) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 尺寸 |
| `status` | `'online' \| 'offline' \| 'busy' \| 'away'` | — | 在线状态 |

**使用场景**: 用户资料、团队成员  
**依赖**: Radix UI Avatar  
**状态**: 🔨 待创建

---

### 2.10 工具提示 — `Tooltip`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `content` | `ReactNode` | — | 提示内容 |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | 位置 |
| `delay` | `number` | `300` | 延迟 (ms) |
| `maxWidth` | `number` | `250` | 最大宽度 |

**使用场景**: 所有应用  
**依赖**: Radix UI Tooltip  
**状态**: 🔨 待创建

---

## 3. 数据展示组件

### 3.1 卡片 — `Card`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `'default' \| 'outlined' \| 'elevated' \| 'filled'` | `'default'` | 变体 |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | 内边距 |
| `interactive` | `boolean` | `false` | 可交互 (hover 效果) |
| `header` | `ReactNode` | — | 卡片头部 |
| `footer` | `ReactNode` | — | 卡片底部 |

**子组件**: `Card.Header`, `Card.Body`, `Card.Footer`  
**使用场景**: 所有应用  
**状态**: ✅ 已有基础实现，需添加子组件

---

### 3.2 数据表格 — `DataTable`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `columns` | `ColumnDef[]` | — | 列定义 |
| `data` | `T[]` | — | 数据 |
| `sortable` | `boolean` | `true` | 可排序 |
| `filterable` | `boolean` | `false` | 可筛选 |
| `selectable` | `boolean` | `false` | 可选择 |
| `paginated` | `boolean` | `true` | 分页 |
| `pageSize` | `number` | `10` | 每页行数 |
| `loading` | `boolean` | `false` | 加载状态 |
| `emptyMessage` | `string` | `'No data'` | 空状态消息 |
| `onRowClick` | `(row: T) => void` | — | 行点击回调 |

**子组件**: `DataTable.Toolbar`, `DataTable.Pagination`, `DataTable.Empty`  
**使用场景**: Backend Dashboard, Analytics, Wallet Explorer  
**依赖**: TanStack Table  
**状态**: 🔨 待创建 (各应用有独立实现)

---

### 3.3 统计卡片 — `StatCard`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `title` | `string` | — | 指标名称 |
| `value` | `string \| number` | — | 当前值 |
| `change` | `number` | — | 变化百分比 |
| `changeType` | `'increase' \| 'decrease' \| 'neutral'` | — | 变化方向 |
| `icon` | `ReactNode` | — | 图标 |
| `sparkline` | `number[]` | — | 迷你图数据 |
| `format` | `'number' \| 'currency' \| 'percent'` | `'number'` | 格式化方式 |

**使用场景**: Dashboard 概览  
**状态**: 🔨 待创建

---

### 3.4 列表 — `List`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `items` | `ListItem[]` | — | 列表项 |
| `variant` | `'default' \| 'bordered' \| 'divided'` | `'divided'` | 变体 |
| `interactive` | `boolean` | `false` | 可交互 |
| `loading` | `boolean` | `false` | 加载状态 |
| `skeletonCount` | `number` | `5` | 骨架屏行数 |

**子组件**: `List.Item`, `List.Item.Title`, `List.Item.Description`, `List.Item.Action`  
**使用场景**: 所有应用  
**状态**: 🔨 待创建

---

### 3.5 描述列表 — `DescriptionList`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `items` | `{ label: string; value: ReactNode }[]` | — | 键值对 |
| `layout` | `'horizontal' \| 'vertical' \| 'grid'` | `'horizontal'` | 布局 |
| `columns` | `number` | `2` | 网格列数 (grid 模式) |

**使用场景**: 详情页面  
**状态**: 🔨 待创建

---

### 3.6 时间线 — `Timeline`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `items` | `TimelineItem[]` | — | 时间线条目 |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 方向 |
| `size` | `'sm' \| 'md'` | `'md'` | 节点尺寸 |

**使用场景**: 活动日志、部署历史  
**状态**: 🔨 待创建

---

### 3.7 空状态 — `EmptyState`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `icon` | `ReactNode` | — | 图标/插图 |
| `title` | `string` | — | 标题 |
| `description` | `string` | — | 描述 |
| `action` | `ReactNode` | — | 操作按钮 |
| `secondaryAction` | `ReactNode` | — | 次要操作 |

**使用场景**: 所有应用 (列表为空、搜索无结果)  
**状态**: 🔨 待创建

---

## 4. 反馈组件

### 4.1 Toast — `Toast` / `useToast`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `title` | `string` | — | 标题 |
| `description` | `string` | — | 描述 |
| `variant` | `'success' \| 'warning' \| 'error' \| 'info'` | `'info'` | 变体 |
| `duration` | `number` | `5000` | 持续时间 (ms) |
| `action` | `{ label: string; onClick: () => void }` | — | 操作按钮 |
| `dismissible` | `boolean` | `true` | 可关闭 |

**Hook**: `useToast()` — 命令式调用  
**使用场景**: 所有应用  
**依赖**: Radix UI Toast / Sonner  
**状态**: 🔨 待创建

---

### 4.2 对话框 — `Dialog`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `open` | `boolean` | — | 打开状态 |
| `onOpenChange` | `(open: boolean) => void` | — | 状态变更回调 |
| `title` | `string` | — | 标题 |
| `description` | `string` | — | 描述 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | 尺寸 |
| `closeOnOverlay` | `boolean` | `true` | 点击遮罩关闭 |
| `closeOnEsc` | `boolean` | `true` | ESC 关闭 |

**子组件**: `Dialog.Header`, `Dialog.Body`, `Dialog.Footer`  
**变体**: `AlertDialog` (确认对话框)  
**使用场景**: 所有应用  
**依赖**: Radix UI Dialog  
**状态**: 🔨 待创建

---

### 4.3 抽屉 — `Drawer`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `open` | `boolean` | — | 打开状态 |
| `side` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | 滑出方向 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | 尺寸 |
| `title` | `string` | — | 标题 |

**使用场景**: 详情面板、筛选器、移动端菜单  
**依赖**: Radix UI Dialog + 自定义动画  
**状态**: 🔨 待创建

---

### 4.4 骨架屏 — `Skeleton`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `'text' \| 'circular' \| 'rectangular' \| 'rounded'` | `'text'` | 形状 |
| `width` | `string \| number` | `'100%'` | 宽度 |
| `height` | `string \| number` | — | 高度 |
| `animation` | `'pulse' \| 'wave'` | `'pulse'` | 动画类型 |
| `count` | `number` | `1` | 重复数量 |

**预设**: `Skeleton.Table`, `Skeleton.Card`, `Skeleton.List`, `Skeleton.Chart`  
**使用场景**: 所有应用  
**状态**: 🔨 待创建

---

### 4.5 进度条 — `Progress`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `value` | `number` | `0` | 当前值 (0-100) |
| `variant` | `'default' \| 'success' \| 'warning' \| 'danger'` | `'default'` | 变体 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸 |
| `label` | `string` | — | 标签 |
| `showValue` | `boolean` | `false` | 显示数值 |
| `indeterminate` | `boolean` | `false` | 不确定进度 |

**使用场景**: 上传、部署、加载  
**状态**: 🔨 待创建

---

## 5. 导航组件

### 5.1 全局头部 — `GlobalHeader`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `logo` | `ReactNode` | `<CinacoinLogo />` | Logo |
| `searchable` | `boolean` | `true` | 显示搜索 |
| `notifications` | `boolean` | `true` | 显示通知 |
| `userMenu` | `boolean` | `true` | 显示用户菜单 |
| `appSwitcher` | `boolean` | `true` | 显示应用切换器 |
| `sticky` | `boolean` | `true` | 固定顶部 |

**子组件**: `GlobalHeader.Search`, `GlobalHeader.Notifications`, `GlobalHeader.UserMenu`, `GlobalHeader.AppSwitcher`  
**使用场景**: Cloud Dashboard, Backend Dashboard, Analytics, Wallet Explorer  
**状态**: 🔨 待创建

---

### 5.2 全局侧边栏 — `GlobalSidebar`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `items` | `NavItem[]` | — | 导航项 |
| `collapsed` | `boolean` | `false` | 折叠状态 |
| `collapsible` | `boolean` | `true` | 可折叠 |
| `width` | `number` | `240` | 展开宽度 |
| `collapsedWidth` | `number` | `64` | 折叠宽度 |
| `footer` | `ReactNode` | — | 底部内容 |

**子组件**: `GlobalSidebar.Item`, `GlobalSidebar.Group`, `GlobalSidebar.Divider`  
**使用场景**: Dashboard 类应用  
**状态**: 🔨 待创建

---

### 5.3 面包屑 — `Breadcrumb`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `items` | `{ label: string; href?: string }[]` | — | 面包屑项 |
| `separator` | `ReactNode` | `'/'` | 分隔符 |
| `maxItems` | `number` | — | 最大显示项数 |

**使用场景**: 所有 Dashboard 应用  
**状态**: 🔨 待创建

---

### 5.4 标签页 — `Tabs`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `items` | `TabItem[]` | — | 标签项 |
| `variant` | `'default' \| 'pills' \| 'underline'` | `'default'` | 变体 |
| `size` | `'sm' \| 'md'` | `'md'` | 尺寸 |
| `fullWidth` | `boolean` | `false` | 全宽 |

**子组件**: `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`  
**使用场景**: 所有应用  
**依赖**: Radix UI Tabs  
**状态**: 🔨 待创建

---

### 5.5 分页 — `Pagination`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `total` | `number` | — | 总条目数 |
| `page` | `number` | `1` | 当前页 |
| `pageSize` | `number` | `10` | 每页条数 |
| `onPageChange` | `(page: number) => void` | — | 页码变更 |
| `showPageSize` | `boolean` | `false` | 显示每页条数选择 |
| `showInfo` | `boolean` | `true` | 显示条目信息 |

**使用场景**: 所有列表页  
**状态**: 🔨 待创建

---

### 5.6 应用切换器 — `AppSwitcher`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `apps` | `AppDefinition[]` | 内置 7 应用 | 应用列表 |
| `currentApp` | `string` | — | 当前应用 |
| `onAppChange` | `(appId: string) => void` | — | 切换回调 |

**使用场景**: GlobalHeader 内  
**状态**: 🔨 待创建

---

## 6. 表单组件

### 6.1 表单容器 — `Form`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `schema` | `ZodSchema` | — | 验证 Schema |
| `defaultValues` | `object` | — | 默认值 |
| `onSubmit` | `(data: T) => void` | — | 提交回调 |
| `loading` | `boolean` | `false` | 提交中 |

**子组件**: `Form.Field`, `Form.Label`, `Form.Control`, `Form.ErrorMessage`, `Form.HelperText`  
**使用场景**: 所有应用  
**依赖**: React Hook Form + Zod  
**状态**: 🔨 待创建

---

### 6.2 文件上传 — `FileUpload`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `accept` | `string` | — | 接受的文件类型 |
| `maxSize` | `number` | `10 * 1024 * 1024` | 最大文件大小 |
| `multiple` | `boolean` | `false` | 多文件 |
| `maxFiles` | `number` | `1` | 最大文件数 |
| `preview` | `boolean` | `true` | 预览 |
| `dragDrop` | `boolean` | `true` | 拖拽上传 |

**使用场景**: 头像上传、文档上传  
**状态**: 🔨 待创建

---

### 6.3 搜索输入 — `SearchInput`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `value` | `string` | — | 搜索值 |
| `onChange` | `(value: string) => void` | — | 变更回调 |
| `placeholder` | `string` | `'Search...'` | 占位文本 |
| `debounce` | `number` | `300` | 防抖 (ms) |
| `loading` | `boolean` | `false` | 搜索中 |
| `clearable` | `boolean` | `true` | 可清除 |

**使用场景**: 表格筛选、全局搜索  
**状态**: 🔨 待创建

---

### 6.4 日期选择器 — `DatePicker`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `value` | `Date` | — | 选中日期 |
| `onChange` | `(date: Date) => void` | — | 变更回调 |
| `min` | `Date` | — | 最小日期 |
| `max` | `Date` | — | 最大日期 |
| `range` | `boolean` | `false` | 范围选择 |
| `time` | `boolean` | `false` | 包含时间 |

**使用场景**: Analytics, Reports  
**依赖**: React Day Picker  
**状态**: 🔨 待创建

---

## 7. 图表组件

### 7.1 折线图 — `LineChart`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `data` | `ChartData[]` | — | 数据 |
| `xKey` | `string` | — | X 轴字段 |
| `yKeys` | `string[]` | — | Y 轴字段 |
| `height` | `number` | `300` | 高度 |
| `legend` | `boolean` | `true` | 图例 |
| `tooltip` | `boolean` | `true` | 工具提示 |
| `area` | `boolean` | `false` | 面积填充 |

**使用场景**: Analytics Dashboard  
**依赖**: Recharts / Visx  
**状态**: 🔨 待创建

---

### 7.2 柱状图 — `BarChart`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `data` | `ChartData[]` | — | 数据 |
| `xKey` | `string` | — | X 轴字段 |
| `yKeys` | `string[]` | — | Y 轴字段 |
| `stacked` | `boolean` | `false` | 堆叠 |
| `horizontal` | `boolean` | `false` | 水平方向 |

**使用场景**: Analytics Dashboard  
**状态**: 🔨 待创建

---

### 7.3 饼图 — `PieChart`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `data` | `PieData[]` | — | 数据 |
| `dataKey` | `string` | — | 数值字段 |
| `nameKey` | `string` | — | 名称字段 |
| `donut` | `boolean` | `false` | 环形图 |
| `innerRadius` | `number` | `60` | 内径 (环形) |

**使用场景**: Analytics Dashboard  
**状态**: 🔨 待创建

---

### 7.4 迷你图 — `Sparkline`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `data` | `number[]` | — | 数据 |
| `width` | `number` | `100` | 宽度 |
| `height` | `number` | `32` | 高度 |
| `color` | `string` | `'brand-500'` | 颜色 |
| `fill` | `boolean` | `false` | 填充 |

**使用场景**: StatCard 内  
**状态**: 🔨 待创建

---

## 8. 布局组件

### 8.1 全局 Shell — `GlobalShell`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `sidebar` | `ReactNode` | — | 侧边栏内容 |
| `header` | `ReactNode` | `<GlobalHeader />` | 头部内容 |
| `footer` | `ReactNode` | — | 底部内容 |
| `sidebarWidth` | `number` | `240` | 侧边栏宽度 |
| `sidebarCollapsed` | `boolean` | `false` | 侧边栏折叠 |

**使用场景**: Dashboard 应用  
**状态**: 🔨 待创建

---

### 8.2 页面容器 — `PageContainer`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `maxWidth` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'xl'` | 最大宽度 |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | 内边距 |
| `centered` | `boolean` | `false` | 居中 |

**使用场景**: 所有应用  
**状态**: 🔨 待创建

---

### 8.3 网格布局 — `Grid`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `columns` | `number \| ResponsiveValue` | `12` | 列数 |
| `gap` | `number \| ResponsiveValue` | `6` | 间距 |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | 对齐 |

**使用场景**: 所有应用  
**状态**: 🔨 待创建

---

### 8.4 堆叠布局 — `Stack`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `direction` | `'row' \| 'column'` | `'column'` | 方向 |
| `gap` | `number` | `4` | 间距 |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | 对齐 |
| `justify` | `'start' \| 'center' \| 'end' \| 'between'` | `'start'` | 分配 |
| `wrap` | `boolean` | `false` | 换行 |

**使用场景**: 所有应用  
**状态**: 🔨 待创建

---

## 9. 数据输入/展示混合组件

### 9.1 代码块 — `CodeBlock`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `code` | `string` | — | 代码内容 |
| `language` | `string` | `'typescript'` | 语言 |
| `showLineNumbers` | `boolean` | `true` | 行号 |
| `highlightLines` | `number[]` | — | 高亮行 |
| `copyable` | `boolean` | `true` | 可复制 |
| `maxHeight` | `number` | `400` | 最大高度 |

**使用场景**: Demo, Docs  
**依赖**: Shiki / Prism  
**状态**: 🔨 待创建

---

### 9.2 地址显示 — `AddressDisplay`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `address` | `string` | — | 地址 |
| `chain` | `string` | — | 链标识 |
| `truncate` | `boolean` | `true` | 截断显示 |
| `copyable` | `boolean` | `true` | 可复制 |
| `explorerLink` | `boolean` | `true` | 浏览器链接 |
| `avatar` | `boolean` | `true` | 地址头像 |

**使用场景**: Wallet Explorer, Cloud Dashboard  
**状态**: 🔨 待创建

---

### 9.3 金额显示 — `AmountDisplay`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `value` | `string \| number` | — | 金额 |
| `symbol` | `string` | — | 代币符号 |
| `decimals` | `number` | `2` | 小数位 |
| `fiat` | `boolean` | `false` | 法币模式 |
| `fiatCurrency` | `string` | `'USD'` | 法币类型 |
| `change` | `number` | — | 变化百分比 |

**使用场景**: Wallet Explorer, Analytics  
**状态**: 🔨 待创建

---

### 9.4 状态指示器 — `StatusIndicator`

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `status` | `'healthy' \| 'degraded' \| 'down' \| 'unknown'` | — | 状态 |
| `label` | `string` | — | 标签 |
| `pulse` | `boolean` | `true` | 脉冲动画 |
| `size` | `'sm' \| 'md'` | `'md'` | 尺寸 |

**使用场景**: Health Status, Backend Dashboard  
**状态**: 🔨 待创建

---

## 10. Provider 组件

### 10.1 主题 Provider — `ThemeProvider`

```typescript
// 提供主题上下文，管理亮/暗/系统模式
<ThemeProvider defaultTheme="system" storageKey="cinacoin-theme">
  {children}
</ThemeProvider>
```

---

### 10.2 认证 Provider — `AuthProvider`

```typescript
// 提供认证状态和方法
<AuthProvider>
  {children}
</AuthProvider>

// 使用
const { user, login, logout, isAuthenticated } = useAuth();
```

---

### 10.3 国际化 Provider — `I18nProvider`

```typescript
// 提供翻译函数和语言切换
<I18nProvider defaultLocale="en" locales={['en', 'zh-CN', 'ja']}>
  {children}
</I18nProvider>

// 使用
const { t, locale, setLocale } = useI18n();
```

---

### 10.4 查询 Provider — `QueryProvider`

```typescript
// 封装 TanStack Query Client
<QueryProvider>
  {children}
</QueryProvider>
```

---

### 10.5 通知 Provider — `NotificationProvider`

```typescript
// 提供全局通知管理
<NotificationProvider>
  {children}
</NotificationProvider>

// 使用
const { notifications, addNotification, markRead } = useNotifications();
```

---

### 10.6 命令面板 Provider — `CommandProvider`

```typescript
// 提供全局搜索/命令面板
<CommandProvider>
  {children}
  <CommandPalette />
</CommandProvider>
```

---

## 11. Hooks 清单

| Hook | 描述 | 使用场景 |
|------|------|----------|
| `useAuth()` | 认证状态和方法 | 所有应用 |
| `useTheme()` | 主题切换 | 所有应用 |
| `useI18n()` | 国际化 | 所有应用 |
| `useToast()` | Toast 通知 | 所有应用 |
| `useMediaQuery()` | 媒体查询 | 响应式逻辑 |
| `useClickOutside()` | 点击外部检测 | 下拉菜单、弹窗 |
| `useDebounce()` | 防抖值 | 搜索输入 |
| `useLocalStorage()` | 本地存储 | 用户偏好 |
| `useCopyToClipboard()` | 复制到剪贴板 | 地址、API Key |
| `useIntersectionObserver()` | 交叉观察 | 无限滚动 |
| `useKeyboardShortcut()` | 键盘快捷键 | 全局快捷键 |
| `useRealtime()` | WebSocket 订阅 | 实时数据 |
| `usePagination()` | 分页逻辑 | 列表页 |
| `useSort()` | 排序逻辑 | 数据表格 |
| `useFilter()` | 筛选逻辑 | 数据表格 |
| `useBreakpoint()` | 当前断点 | 响应式布局 |
| `useScrollPosition()` | 滚动位置 | 头部固定 |
| `usePrevious()` | 前一个值 | 动画、对比 |

---

## 12. 组件依赖关系

```
@cinacoin/ui
├── @radix-ui/react-dialog        # Dialog, Drawer
├── @radix-ui/react-dropdown-menu # DropdownMenu
├── @radix-ui/react-select        # Select
├── @radix-ui/react-tabs          # Tabs
├── @radix-ui/react-toast         # Toast
├── @radix-ui/react-tooltip       # Tooltip
├── @radix-ui/react-checkbox      # Checkbox
├── @radix-ui/react-radio-group   # RadioGroup
├── @radix-ui/react-switch        # Switch
├── @radix-ui/react-avatar        # Avatar
├── @radix-ui/react-popover       # Popover, DatePicker
├── @tanstack/react-query         # QueryProvider
├── @tanstack/react-table         # DataTable
├── react-hook-form               # Form
├── zod                           # Form validation
├── cmdk                          # CommandPalette
├── recharts                      # Charts
├── sonner                        # Toast (替代方案)
├── lucide-react                  # Icons
├── date-fns                      # Date formatting
├── zustand                       # Global store
└── @cinacoin/ui-theme            # Design tokens
```

---

## 13. 组件状态总览

| 状态 | 数量 | 说明 |
|------|------|------|
| ✅ 已有 | 4 | Button, Input, Badge, Card (需统一) |
| 🔨 待创建 | 40+ | 其余所有组件 |
| 📋 计划中 | 18 | Hooks |
| **总计** | **62+** | 完整组件库 |

---

## 14. 优先级排序

### P0 — 基础设施 (Week 1-2)

- [ ] ThemeProvider + CSS Variables 迁移
- [ ] Button 统一 (所有变体)
- [ ] Input + Textarea
- [ ] Card + 子组件
- [ ] GlobalShell 布局
- [ ] GlobalHeader
- [ ] GlobalSidebar

### P1 — 核心组件 (Week 3-4)

- [ ] Select, Checkbox, Radio, Switch
- [ ] Dialog + AlertDialog
- [ ] Toast / useToast
- [ ] DataTable
- [ ] Pagination
- [ ] Tabs
- [ ] Breadcrumb
- [ ] Skeleton

### P2 — 业务组件 (Week 5-6)

- [ ] StatCard
- [ ] AddressDisplay
- [ ] AmountDisplay
- [ ] StatusIndicator
- [ ] CodeBlock
- [ ] AppSwitcher
- [ ] CommandPalette

### P3 — 高级组件 (Week 7-8)

- [ ] Charts (Line, Bar, Pie, Sparkline)
- [ ] DatePicker
- [ ] FileUpload
- [ ] Timeline
- [ ] Drawer

---

*文档维护: Cinacoin Frontend Team | 最后更新: 2026-06-08*

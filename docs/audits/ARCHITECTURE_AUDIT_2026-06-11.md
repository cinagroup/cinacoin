# 架构规范审计报告

**审计日期**: 2026-06-11  
**审计范围**: Cinacoin Monorepo 架构（101 packages, 20 apps）  
**审计人**: OpenClaw Architecture Auditor  

---

## 执行摘要

Cinacoin Monorepo 是一个大型 pnpm workspace 项目，包含 **101 个 packages** 和 **20 个 apps**，总计约 **293,000 行 TypeScript 代码**。项目整体架构设计合理，采用了现代化的 ESM-first 策略，使用 Changesets 管理版本，Turborepo 编排构建。

主要发现：
- ✅ 模块职责划分清晰，按功能域拆分
- ✅ 无循环依赖（logger 作为基础设施层被广泛引用）
- ✅ 无 .env 文件泄露到 Git
- ✅ 无 TODO/FIXME 技术债标记
- ⚠️ tsconfig 配置不一致（ES2020 vs ES2022 混用）
- ⚠️ React 版本约束不统一（>=17 到 19.2.6 混用）
- ⚠️ core-sdk 存在 God Module 倾向（单文件 2162 行）
- ⚠️ 105 处内部依赖未使用 `workspace:` 协议
- ⚠️ 25 个 packages 缺少 `"type": "module"` 声明

---

## 高危问题 🔴

### 1. core-sdk God Module 倾向
**位置**: `packages/core-sdk/src/adapters/`  
**问题**: 多个适配器文件超过 1000 行，最大文件 2162 行

| 文件 | 行数 |
|------|------|
| near.ts | 2,162 |
| xrpl.ts | 1,924 |
| sui.ts | 1,701 |
| starknet.ts | 1,496 |
| hedera.ts | 1,338 |
| cosmos.ts | 1,268 |
| polkadot.ts | 1,064 |

**影响**: 可维护性差，代码审查困难，测试复杂度高  
**建议**: 将每个适配器拆分为 `connectors/` + `service/` + `types/` 子模块

### 2. 内部依赖未使用 workspace: 协议
**问题**: 105 处 `@cinacoin/*` 依赖使用版本号（如 `>=0.2.0`、`^0.2.0`）而非 `workspace:^`  
**示例**:
```json
// ❌ 当前
"@cinacoin/core-sdk": ">=0.2.0"
// ✅ 应该
"@cinacoin/core-sdk": "workspace:^"
```
**影响**: 可能导致发布时版本解析不一致，本地开发可能链接到 npm 版本而非本地  
**建议**: 运行 `pnpm sync-versions` 或手动替换所有内部依赖为 `workspace:` 协议

### 3. React 版本约束严重不统一
**问题**: 各 package 对 React 的 peerDependency 约束差异巨大

| 约束版本 | 使用位置 |
|---------|---------|
| `19.2.6` (exact) | packages/ui |
| `^18.3.0` | packages/react, packages/react-native, packages/pay-ui |
| `^18.2.0` | packages/blockchain-api, packages/explorer, packages/i18n 等 |
| `>=18.0.0` | packages/cross-chain-sync, packages/kyc, packages/multiwallet 等 |
| `>=17.0.0` | packages/explorer |
| `^18.0.0 \|\| ^19.0.0` | packages/appkit, packages/next, packages/embedded-wallet |
| `^18 \|\| ^19` | packages/theme |

**影响**: 消费者可能遇到版本冲突或意外行为  
**建议**: 统一为 `^18.3.0 || ^19.0.0`，根 package.json 已有 override `react: 18.3.1`

---

## 中危问题 🟡

### 4. tsconfig target 不一致
**问题**: 编译目标混用 ES2020 和 ES2022

| Target | 包数量 |
|--------|--------|
| ES2022 | 54 |
| ES2020 | 37 |
| extends (继承) | 3 |
| ESNext | 1 |
| ES2021 | 1 |

**影响**: 输出代码特性不一致（如 top-level await、class fields 支持差异）  
**建议**: 统一为 ES2022（现代浏览器/Node 20+ 完全支持）

### 5. 25 个 Packages 缺少 `"type": "module"` 声明
**问题**: 以下包未声明 ESM 类型，可能导致 Node.js 按 CJS 解析 `.js` 文件

<details>
<summary>缺少 "type": "module" 的包列表</summary>

- packages/analytics-server
- packages/angular
- packages/blockchain-api
- packages/cinacoin-i18n
- packages/cinacoin-ui-theme
- packages/codemod
- packages/cross-chain-contracts
- packages/dotnet
- packages/embedded-wallet
- packages/ens-resolver
- packages/gas-sponsorship
- packages/monitoring
- packages/onramp-sdk
- packages/payment-flow
- packages/react-native
- packages/release-tools
- packages/session-keys
- packages/swap-sdk
- packages/testing
- packages/travel-rule
- packages/travel-rule-demo
- packages/ui-theme
- packages/unity-csharp
- packages/verify-sdk
- packages/wallet-buttons

</details>

**建议**: 为所有纯 ESM 包添加 `"type": "module"`

### 6. 14 个 Packages 为 ESM-only（无 CJS 输出）
**问题**: 以下包 exports 中无 `require` 条件，CJS 消费者无法使用

- packages/adapters, packages/caip, packages/chain-registry, packages/cli
- packages/core-ui, packages/design-system, packages/logger, packages/next
- packages/nuxt, packages/pay-ui, packages/react, packages/svelte
- packages/universal-connector, packages/vue

**影响**: 限制了在 CJS 项目中的使用  
**建议**: 如果是有意设计（如 React Server Components only），在 README 中明确说明；否则添加 CJS 构建

### 7. 8 个 Packages 缺少 exports 字段
**问题**: 以下包未定义 `exports` 字段，无法控制子路径导出

- packages/analytics-server, packages/cross-chain-contracts
- packages/integration-tests, packages/monitoring
- packages/perf-benchmarks, packages/release-tools
- packages/unity-csharp, packages/verify-sdk

**建议**: 添加 `exports` 字段以明确公共 API 边界

### 8. 8 个 Packages 缺少 build 脚本
**问题**: 以下包无 `build` 脚本，Turborepo 构建流水线可能跳过

- packages/config, packages/cross-chain-contracts
- packages/integration-tests, packages/monitoring
- packages/perf-benchmarks, packages/release-tools
- packages/theme, packages/unity-csharp

**建议**: 添加 `build` 脚本（即使只是 `tsc` 或 `echo "no build"`）

### 9. TypeScript 版本不一致
**问题**: 绝大多数包使用 `^5.8.3`，但 `packages/logger` 使用 `5.5.4`（exact pin）  
**影响**: 可能导致类型定义不兼容  
**建议**: 统一为 `^5.8.3`，根 package.json override 已设为 `5.8.3`

---

## 低危问题 🟢

### 10. 2 个 Packages 缺少 description
- packages/config（@cinacoin/eslint-config）
- packages/logger（@cinacoin/logger）

**建议**: 添加描述以提升 npm 可读性

### 11. 1 个 Deprecated Package 仍存在
- `packages/cinacoin-ui-theme` — 标记为 DEPRECATED，建议使用 `@cinacoin/ui-theme`

**建议**: 设置 `deprecated` 字段并在下个 major 版本移除

### 12. 5 个 Packages 缺少 src/ 目录
- packages/adapters（使用根目录 .ts 文件）
- packages/cross-chain-contracts
- packages/design-system
- packages/integration-tests
- packages/release-tools

**建议**: 统一为 `src/` 结构，或在 README 中说明特殊布局原因

### 13. 仅 1/101 包有独立 CHANGELOG
**问题**: 只有根目录有 CHANGELOG.md，各包无独立变更记录  
**建议**: Changesets 可自动生成 per-package CHANGELOG，确认配置正确

### 14. core-sdk tsconfig 严格模式不完整
**问题**: core-sdk 禁用了多项严格检查：
```json
"noImplicitAny": false,
"strictFunctionTypes": false,
"strictPropertyInitialization": false,
"noUnusedLocals": false,
"noUnusedParameters": false
```
**影响**: 可能隐藏类型安全问题  
**建议**: 逐步启用严格选项

---

## 优化建议 💡

### 架构层面

1. **引入依赖边界规则**  
   使用 `nx` 或 `turbo` 的 `implicitDependencies` 或 `eslint-plugin-import` 的 `no-restricted-paths` 防止架构腐化

2. **建立分层架构**  
   ```
   Layer 0: logger, caip, design-tokens (基础设施)
   Layer 1: core-sdk, chain-registry, wallet-registry (核心)
   Layer 2: adapters/*, siwe, siwx (协议适配)
   Layer 3: appkit, react, vue, angular (框架集成)
   Layer 4: apps/* (应用层)
   ```
   禁止低层依赖高层

3. **拆分 core-sdk**  
   core-sdk 有 68 个源文件、25,689 行代码。建议拆分为：
   - `@cinacoin/core` — 核心类型和接口
   - `@cinacoin/evm-adapters` — EVM 链适配器
   - `@cinacoin/non-evm-adapters` — 非 EVM 链适配器

### 依赖管理

4. **统一 React 版本策略**  
   在根 `package.json` 的 `pnpm.overrides` 中固定 React 版本，所有包使用宽泛 peerDependency

5. **启用 workspace: 协议强制**  
   在 `.npmrc` 中添加 `link-workspace-packages=true` 并使用 `workspace:` 前缀

### 构建系统

6. **统一 tsconfig 继承**  
   创建 `tsconfig.base.json`，所有包继承，确保一致性

7. **添加构建产物验证**  
   CI 中检查每个包的 `dist/` 是否包含 `.js`, `.d.ts`, `.d.ts.map`

### 代码质量

8. **引入 madge 检测循环依赖**  
   ```bash
   npx madge packages/*/src/index.ts --circular
   ```

9. **添加 bundle size 预算**  
   使用 `size-limit` 或 `bundlewatch` 防止包体积膨胀

---

## 检查清单总结

### 1. 模块设计
- [x] 包职责是否清晰 — ✅ 按功能域清晰拆分
- [x] 是否有过大模块（God Module） — ⚠️ core-sdk 及其适配器文件过大
- [x] 模块边界是否清晰 — ✅ exports 字段大部分定义良好
- [x] 是否有循环依赖 — ✅ 未发现

### 2. 依赖管理
- [x] 依赖版本是否统一 — ⚠️ React、TypeScript 版本不一致
- [x] 是否有冗余依赖 — ✅ pnpm overrides 控制良好
- [x] peerDependencies 是否正确 — ⚠️ React peerDep 约束混乱
- [x] 是否有未使用的依赖 — ✅ 未发现明显冗余

### 3. 代码组织
- [x] 目录结构是否合理 — ⚠️ 5 个包缺少 src/ 目录
- [x] 文件命名是否一致 — ✅ 统一使用 camelCase
- [x] 导出结构是否清晰 — ⚠️ 8 个包缺少 exports 字段
- [x] 是否有死代码 — ✅ 无 TODO/FIXME，0 处技术债标记

### 4. 构建系统
- [x] tsconfig 配置是否一致 — ⚠️ target 混用 ES2020/ES2022
- [x] 构建输出格式是否正确 — ⚠️ 14 个包 ESM-only，25 个缺 type:module
- [x] 是否有构建缓存问题 — ✅ Turborepo 配置合理
- [x] CI/CD 配置是否完整 — ✅ 34 个 workflow 文件覆盖全面

### 5. 配置管理
- [x] 环境变量是否集中管理 — ✅ .env.example 模板完整
- [x] 配置是否有默认值 — ✅ 大部分有合理默认值
- [x] 敏感配置是否外部化 — ✅ 无 .env 文件提交到 Git
- [x] 多环境配置是否完整 — ✅ 各 app 有 .env.production

### 6. 文档规范
- [x] README 是否完整 — ✅ 根 README 307 行，各包基本有 README
- [x] API 文档是否生成 — ✅ typedoc.json 配置 9 个入口点
- [x] 代码注释是否充分 — ✅ JSDoc 注释丰富
- [x] CHANGELOG 是否维护 — ⚠️ 仅根目录有，包级缺失

---

## 附录

### A. 项目规模统计
| 指标 | 数值 |
|------|------|
| Packages 总数 | 101 |
| Apps 总数 | 20 |
| TypeScript 总行数 | ~293,000 |
| 源文件总数 | ~2,500+ |
| 测试文件数 | 222 |
| 导出总数 | 4,605 |
| CI Workflows | 34 |

### B. 依赖关系图（简化）
```
logger (基础设施层 - 被 60+ 包引用)
  ↓
core-sdk (核心层 - 类型、接口、基础适配器)
  ↓
adapters/* (协议层 - 各链适配器)
  ↓
appkit, react, vue, angular (框架层 - UI 集成)
  ↓
apps/* (应用层 - 演示和应用)
```

### C. 建议优先级
1. 🔴 **P0** — 统一 React 版本约束（影响消费者）
2. 🔴 **P0** — 启用 workspace: 协议（影响开发体验）
3. 🟡 **P1** — 统一 tsconfig target（影响输出一致性）
4. 🟡 **P1** — 拆分 core-sdk 大文件（影响可维护性）
5. 🟡 **P1** — 补充 exports 字段（影响 API 边界）
6. 🟢 **P2** — 添加 type: module（影响 Node 解析）
7. 🟢 **P2** — 补充包 description（影响可读性）

---

*报告生成时间: 2026-06-11T11:36:00Z*  
*审计工具: OpenClaw Architecture Auditor*

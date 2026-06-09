# 配置/依赖/DevOps 审计报告

**项目:** Cinacoin (onux)  
**审计日期:** 2026-06-08  
**审计范围:** 配置文件、依赖管理、CI/CD、Docker、Helm、安全  

---

## 严重问题 (Critical)

### [C-001] .env 文件包含真实 Cloudflare API Token
- **文件:** `.env` (L1)
- **描述:** `.env` 文件包含明文 Cloudflare API Token：`CF_API_TOKEN=cfut_[REDACTED]`。虽然 `.env` 已在 `.gitignore` 中且未被 git 追踪，但该文件存在于磁盘上，任何有文件系统访问权限的人/进程都可读取。
- **风险:** API Token 泄露可导致 Cloudflare 资源被未授权操作（DNS 修改、Worker 部署、R2 存储访问等）。
- **修复建议:**
  1. 立即在 Cloudflare Dashboard 撤销该 Token 并生成新 Token
  2. 使用 `1password-cli`、`vault`、`age` 等加密存储管理 secrets
  3. 确保 CI/CD 使用 GitHub Secrets 而非文件传递

### [C-002] Helm secrets.yaml 包含可部署的弱默认凭据
- **文件:** `deploy/helm/cinacoin/templates/secrets.yaml` (全文)
- **描述:** Helm 模板中所有 secrets 使用 base64 编码的占位符值（如 `redis-password: cmVkaXMtcGFzc3dvcmQ=` = "redis-password"，`master-key: bWFzdGVyLWtleQ=` = "master-key"，`bundler-wallet.private-key: YnVuZGxlci1wcml2YXRlLWtleQ=` = "bundler-private-key"）。如果直接 `helm install` 部署，生产环境将使用这些弱凭据。
- **风险:** 生产环境使用已知弱密码/密钥，攻击者可完全接管数据库、Redis、加密密钥和区块链钱包私钥。
- **修复建议:**
  1. 将 secrets.yaml 改为纯模板，使用 `{{ required "..." .Values.xxx }}` 强制要求提供真实值
  2. 集成 External Secrets Operator / Sealed Secrets / Vault
  3. 添加 Helm pre-install hook 验证所有 secret 非占位符值

### [C-003] 根 Dockerfile 无功能且误导
- **文件:** `Dockerfile` (L14-L16)
- **描述:** 根 Dockerfile 的 runtime stage CMD 为 `["node", "--version"]`，仅打印 Node 版本号后退出，不运行任何服务。构建也只包含 core-sdk 和 react 两个包的 dist。
- **风险:** 如果有人使用此 Dockerfile 部署"服务"，容器将立即退出。docker-compose.yml 引用 `Dockerfile.demo`（不存在），同样无法工作。
- **修复建议:**
  1. 删除根 Dockerfile（它没有实际用途）或改为实际服务入口
  2. 创建缺失的 `Dockerfile.demo` 或修复 docker-compose.yml 引用

---

## 高危问题 (High)

### [H-001] docker-compose.yml 引用不存在的 Dockerfile.demo
- **文件:** `docker-compose.yml` (L7)
- **描述:** demo 服务的 build 配置引用 `Dockerfile.demo`，但该文件不存在于项目根目录。
- **风险:** `docker-compose up` 会直接失败，本地开发环境无法启动。
- **修复建议:** 创建 `Dockerfile.demo` 或修改 docker-compose.yml 使用 apps/demo 目录下的 Dockerfile。

### [H-002] 区块链节点镜像使用 `latest` tag
- **文件:** `deploy/helm/cinacoin/values.yaml` (L190, L231, L256)
- **描述:** Erigon 和 Solana 节点镜像使用 `tag: "latest"`：
  ```yaml
  repository: thorax/erigon
  tag: "latest"
  ```
- **风险:** `latest` 不可复现、不可回滚，可能导致不可预期的链客户端升级和网络分叉风险。
- **修复建议:** 锁定到具体版本 tag（如 `v2.60.0`），使用 image digest 固定。

### [H-003] CI pnpm 版本管理不一致
- **文件:** 多个 `.github/workflows/*.yml`
- **描述:** CI 中存在两种 pnpm 安装方式混用：
  - 部分 workflow 使用 `corepack enable`（不指定版本，依赖 packageManager 字段）
  - 部分使用 `pnpm/action-setup@v4`（指定 version: 9）
  - `package.json` 锁定 `pnpm@9.15.0`
  
  涉及文件：ci.yml, security-scan.yml, deploy-demo.yml, test.yml, release.yml, monitoring.yml, quality.yaml 等
- **风险:** 不同 workflow 可能使用不同 pnpm 版本，导致 lockfile 解析差异和构建不一致。
- **修复建议:** 统一使用 `pnpm/action-setup@v4` + `packageManager` 字段，或全部使用 corepack（确保 Node 22+ 的 corepack 支持 pnpm 9.15）。

### [H-004] CI 安全扫描 job 使用 continue-on-error，漏洞可能被忽略
- **文件:** `.github/workflows/ci.yml` (L107-L119)
- **描述:** Security scan job 中 `pnpm audit` 使用 `continue-on-error: true`，且仅在检测到 "critical" 字符串时才失败。grep 计数方式不可靠（JSON 格式变化可能导致误判）。
- **风险:** 已知漏洞不会阻断 CI 流水线，高危/严重漏洞可能被持续忽略。
- **修复建议:**
  1. 移除 `continue-on-error: true`
  2. 使用 `pnpm audit --audit-level=high` 直接以非零退出码失败
  3. 或使用专门的 audit 工具（如 `better-npm-audit`）

### [H-005] apps/demo 禁用 TypeScript strict 模式
- **文件:** `apps/demo/tsconfig.json` (L11)
- **描述:** Demo 应用设置 `"strict": false`，是唯一禁用严格模式的 app。
- **风险:** 可能隐藏类型错误，降低代码质量，与 monorepo 其他项目标准不一致。
- **修复建议:** 设置 `"strict": true` 并修复由此暴露的类型问题。

### [H-006] Renovate 自动合并安全更新存在风险
- **文件:** `renovate.json` (L41-L44)
- **描述:** 
  ```json
  "vulnerabilityAlerts": {
    "labels": ["security"],
    "automerge": true
  }
  ```
  安全漏洞更新自动合并，无需人工审查。
- **风险:** 恶意或破坏性的"修复"版本可能自动进入 main 分支。部分 CVE 修复可能引入 breaking changes。
- **修复建议:** 移除 vulnerabilityAlerts 的 `automerge: true`，安全更新应人工审查后合并。

### [H-007] docker-compose Redis 无认证
- **文件:** `docker-compose.yml` (L48-L59)
- **描述:** Redis 服务未配置密码认证，且端口 6379 暴露到宿主机。
- **风险:** 宿主机上的任何进程或同网络攻击者可直接访问 Redis，读写缓存数据。
- **修复建议:** 添加 `--requirepass` 参数，移除宿主机端口映射（仅内部网络访问）。

### [H-008] docker-compose PostgreSQL 端口暴露到宿主机
- **文件:** `docker-compose.yml` (L107)
- **描述:** PostgreSQL 端口 5432 直接映射到宿主机 `ports: - "5432:5432"`。
- **风险:** 数据库直接暴露，增加攻击面。
- **修复建议:** 移除宿主机端口映射，仅通过 Docker 内部网络访问。

---

## 中等问题 (Medium)

### [M-001] 根 Dockerfile runtime stage 不必要地安装 pnpm
- **文件:** `Dockerfile` (L16)
- **描述:** Runtime stage 执行 `RUN npm install -g pnpm`，但 CMD 只是 `node --version`，完全不需要 pnpm。
- **风险:** 增大镜像体积，增加攻击面。
- **修复建议:** 移除不必要的 pnpm 安装。

### [M-002] pnpm-workspace.yaml 包含不存在的 examples/* 路径
- **文件:** `pnpm-workspace.yaml` (L4)
- **描述:** 配置了 `examples/*` 作为 workspace 包，但 examples/ 目录下包含 android, ios, react-native, web, headless-ui 等非 npm 包。
- **风险:** pnpm 会尝试处理这些非 npm 目录，可能导致 warning 或错误。
- **修复建议:** 排除 examples/ 下的非 npm 包，或从 workspace 中移除 `examples/*`。

### [M-003] Node.js 引擎版本不一致
- **文件:** `package.json` (L66), 多个 CI workflow
- **描述:**
  - `package.json` engines: `>=18.0.0`
  - CI ci.yml: `NODE_VERSION: "22"`
  - CI build.yaml, deploy-cloudflare.yml 等: `node-version: "20"`
  - security-scan.yml: `node-version: "20"`
- **风险:** 开发和 CI 环境 Node 版本不一致可能导致运行时行为差异。
- **修复建议:** 统一 Node.js 版本策略，建议使用 `.nvmrc` 或 `engines.strict` 锁定。

### [M-004] vitest.config.ts 排除所有 packages 测试
- **文件:** `vitest.config.ts` (L6)
- **描述:** 配置 `exclude: ['**/node_modules/**', '**/dist/**', 'packages/**']`，排除了 packages/ 下所有测试。
- **风险:** 根级 vitest 不会运行任何 packages 测试，可能导致测试覆盖率假象。
- **修复建议:** 使用 vitest.workspace.ts 管理多包测试，或修改 exclude 规则仅排除特定包。

### [M-005] 存在重复/冲突的 release 工作流
- **文件:** `.github/workflows/release.yaml` 和 `.github/workflows/release.yml`
- **描述:** 两个 release 工作流同时存在：
  - `release.yaml`: 使用 semantic-release，基于 push to main 触发
  - `release.yml`: 使用 tag 触发，构建并发布到 npm/Maven/CocoaPods/NuGet
- **风险:** 可能产生版本冲突、重复发布、changelog 覆盖。
- **修复建议:** 合并为单一 release 工作流，明确触发条件和职责。

### [M-006] 编译后的 JS 文件提交到源码目录
- **文件:** 根目录和 scripts/ 下的 `.js`, `.d.ts`, `.js.map`, `.d.ts.map` 文件
- **描述:** 多个编译产物直接存在于源码中：
  - `run-tests.mjs`, `run-tests.d.mts`, `run-tests.mjs.map`
  - `vitest.config.js`, `vitest.config.d.ts`, `vitest.config.js.map`
  - `scripts/check-bundle-size.js`, `scripts/check-bundle-size.d.ts`
- **风险:** 编译产物与源码不同步，可能导致运行过时/错误代码。.gitignore 已配置排除 `**/src/**/*.js` 但这些文件在根目录和 scripts/ 下。
- **修复建议:** 将编译产物输出到 dist/ 或 build/ 目录，添加到 .gitignore。

### [M-007] PagerDuty service_key 使用占位符
- **文件:** `deploy/helm/cinacoin/values.yaml` (L449)
- **描述:** `service_key: "PD_SERVICE_KEY"` 是明文字符串占位符。
- **风险:** 如果部署后未替换，告警不会发送到 PagerDuty，生产事故可能被遗漏。
- **修复建议:** 通过 values override 或 External Secrets 注入，添加 Helm 验证。

### [M-008] 缺少 .dockerignore 文件
- **文件:** 根目录
- **描述:** 项目根目录无 `.dockerignore` 文件。
- **风险:** Docker build context 包含 node_modules、.git、.env 等不必要/敏感文件，增大构建时间、镜像体积，可能泄露敏感信息。
- **修复建议:** 创建 `.dockerignore` 排除 `node_modules`, `.git`, `.env`, `.turbo`, `coverage` 等。

### [M-009] core-ui Dockerfile 路径错误
- **文件:** `deploy/docker/core-ui/Dockerfile` (L11-L14)
- **描述:** COPY 指令使用 `core-ui/package.json` 和 `core-ui/package-lock.json`，但构建 context 是项目根目录。实际路径应为 `packages/core-ui/package.json`。且使用 `npm ci` 而非 pnpm。
- **风险:** Docker build 会因找不到文件而失败。
- **修复建议:** 修正路径为 `packages/core-ui/`，统一使用 pnpm。

### [M-010] wrangler.toml 配置过于简单
- **文件:** `wrangler.toml`
- **描述:** 根 wrangler.toml 仅包含 name 和 compatibility_date，无实际 Worker 配置。实际配置分散在 `packages/*/cloudflare/wrangler.toml`。
- **风险:** 根配置无实际作用，可能造成混淆。
- **修复建议:** 删除根 wrangler.toml 或添加注释说明仅为 Cloudflare Pages 占位。

---

## 低危问题 (Low)

### [L-001] .npmrc 配置为默认值
- **文件:** `.npmrc`
- **描述:** `link-workspace-packages=true` 和 `prefer-workspace-packages=true` 是 pnpm 默认行为。
- **风险:** 无直接风险，但冗余配置增加维护成本。
- **修复建议:** 可删除或保留作为显式声明。

### [L-002] turbo.json globalDependencies 包含整个 .env
- **文件:** `turbo.json` (L3)
- **描述:** `"globalDependencies": [".env"]` 意味着 .env 任何变化都会使所有缓存失效。
- **风险:** 不必要的缓存失效导致 CI 构建时间增加。
- **修复建议:** 如不需要 env 驱动缓存失效，移除此配置。

### [L-003] 多个 deploy workflow 存在大量重复
- **文件:** `.github/workflows/deploy-*.yml` (13 个文件)
- **描述:** 13 个独立的 deploy workflow 文件，大部分结构相似（setup node, install wrangler, deploy, health check）。
- **风险:** 维护成本高，修改需同步到所有文件。
- **修复建议:** 使用 reusable workflow 或 matrix strategy 合并。

### [L-004] LICENSE 和 LICENSE.md 重复
- **文件:** `LICENSE` 和 `LICENSE.md`
- **描述:** 两个许可证文件内容基本相同（MIT），但版权名称略有不同（"OnChainUX Contributors" vs "Cinacoin Contributors"）。
- **风险:** 法律歧义。
- **修复建议:** 统一为一个 LICENSE 文件，确认正确的版权名称。

### [L-005] pnpm overrides 固定 @types/react 版本
- **文件:** `package.json` (L69-L72)
- **描述:** `pnpm.overrides` 强制 `@types/react: 18.3.12` 和 `@types/react-dom: 18.3.1`，但部分 apps 使用 React 19。
- **风险:** React 19 项目使用 React 18 类型定义可能导致类型不匹配。
- **修复建议:** 评估是否需要 override，或按 React 版本分组管理。

### [L-006] docker-compose 使用旧版 compose spec
- **文件:** `docker-compose.yml` (L1)
- **描述:** `version: '3.8'` 是旧版 Docker Compose 格式。
- **风险:** 新版 Docker Compose (v2) 不再需要 version 字段，可能产生 deprecation warning。
- **修复建议:** 移除 `version` 字段，使用 Compose Specification 格式。

### [L-007] deploy/.wrangler-state 可能包含敏感状态
- **文件:** `deploy/.wrangler-state`
- **描述:** Wrangler 状态文件存在于 deploy/ 目录。
- **风险:** 可能包含部署状态/元数据。
- **修复建议:** 添加到 .gitignore，使用 `.wrangler` 标准路径。

---

## 总结

| 级别 | 数量 | 关键主题 |
|------|------|----------|
| Critical | 3 | 密钥泄露、弱默认凭据、无效 Dockerfile |
| High | 8 | CI 不一致、安全扫描失效、TypeScript 配置、数据库暴露 |
| Medium | 10 | 配置冗余、路径错误、重复 workflow |
| Low | 7 | 代码质量、维护性 |

### 优先修复顺序

1. **立即:** 撤销并轮换 `.env` 中的 Cloudflare API Token (C-001)
2. **立即:** 修复 Helm secrets 模板，防止弱凭据部署 (C-002)
3. **本周:** 修复/删除无效根 Dockerfile (C-003)，创建缺失的 Dockerfile.demo (H-001)
4. **本周:** 统一 CI pnpm 版本管理 (H-003)，修复安全扫描 job (H-004)
5. **Sprint 内:** 锁定区块链节点镜像版本 (H-002)，修复 docker-compose 网络暴露 (H-007, H-008)
6. **Sprint 内:** 合并重复 release workflow (M-005)，清理编译产物 (M-006)

### 正面发现

- ✅ Rust/Go Dockerfile 使用 distroless/scratch 基础镜像，安全性良好
- ✅ Helm 部署模板包含完善的 securityContext（runAsNonRoot, readOnlyRootFilesystem）
- ✅ NetworkPolicy 默认拒绝 + 白名单模式
- ✅ 大部分项目启用 TypeScript strict 模式
- ✅ Dependabot + Renovate 双重依赖更新监控
- ✅ CodeQL + Trivy + npm audit 多层安全扫描
- ✅ 金丝雀部署策略含自动回滚

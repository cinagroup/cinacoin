# 🚀 ICS-DNS 快速开始指南

## ✅ 模块已创建

ICS-DNS 模块已创建在 `/home/cina/.openclaw/workspace/cina/x/icsdns/`

## 📋 下一步

### 1. 编译二进制文件

```bash
cd /home/cina/.openclaw/workspace/cina
export PATH=$PATH:$HOME/go/bin:$HOME/.local/bin
export GOPROXY=https://goproxy.cn,direct

# 构建
$HOME/go/bin/go build -o ./cinad ./cmd/cinad
```

### 2. 重启区块链节点

```bash
# 停止当前节点
pkill cinad

# 重新启动
./cinad start
```

### 3. 测试域名注册

```bash
# 注册域名 alice.cina
cinad tx icsdns register-domain \
  --domain alice \
  --admin cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp \
  --from alice \
  --amount 100stake \
  --chain-id cina \
  --yes

# 查询域名
cinad query icsdns domain alice

# 设置地址映射
cinad tx icsdns set-address \
  --domain alice \
  --chain-id cosmoshub-4 \
  --address cosmos1... \
  --from alice \
  --chain-id cina \
  --yes

# 解析域名
cinad query icsdns resolve alice.cina cosmoshub-4
```

## 🌐 功能特性

- ✅ 注册 `.cina` 顶级域名
- ✅ 多链地址映射
- ✅ 域名过期管理
- ✅ IBC 兼容
- ✅ Keplr 钱包支持

## 📝 API 端点

### 交易

- `MsgRegisterDomain` - 注册域名
- `MsgSetAddress` - 设置地址映射
- `MsgTransferDomain` - 转让域名（待实现）
- `MsgRenewDomain` - 续费域名（待实现）

### 查询

- `Domain` - 查询域名信息
- `Resolve` - 解析域名到地址
- `Domains` - 查询所有域名

## 🔧 配置

### 域名规则

- 最小长度：3 字符
- 最大长度：64 字符
- 允许字符：a-z, 0-9, -
- 默认有效期：1 年
- 注册费用：100 stake
- 续费费用：50 stake/年

### 示例域名

- `alice.cina`
- `bob.cina`
- `project.cina`
- `dao.cina`

## 🌟 与 Keplr 集成

```javascript
// 注册域名
await window.CinaChain.registerDomain("myname")

// 通过域名发送
await window.CinaChain.sendViaDomain("alice.cina", 1000000)
```

## 📚 完整文档

- `ICS_COMPLETE_SETUP.md` - 完整配置指南
- `ICS_DNS_SETUP.md` - ICS-DNS 标准文档
- `IBC_BROWSER_SETUP.md` - IBC 和浏览器部署

---

**模块路径**: `/home/cina/.openclaw/workspace/cina/x/icsdns`
**创建时间**: 2026-03-26 13:02 UTC

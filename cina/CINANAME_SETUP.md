# 🌐 cina 区块链 - 自定义顶级域名 .cina 配置指南

## ✅ 已完成

| 项目 | 状态 |
|------|------|
| nameservice 模块 | ✅ 已创建 (`x/cinaname`) |
| 顶级域名 | ✅ `.cina` |
| 区块链节点 | ✅ 运行中 |
| Cloudflare Tunnel | ✅ 已配置 |

## 📋 模块信息

**模块路径**: `/home/cina/.openclaw/workspace/cina/x/cinaname`

**功能**:
- 注册 `.cina` 域名（如 `alice.cina`）
- 域名解析到钱包地址
- 域名转让和续费
- 域名过期管理

## 🔧 构建和启动

### 1. 构建二进制文件

```bash
cd /home/cina/.openclaw/workspace/cina
export PATH=$PATH:$HOME/go/bin:$HOME/.local/bin
export GOPROXY=https://goproxy.cn,direct
$HOME/go/bin/go build -o ./cinad ./cmd/cinad
```

### 2. 重启区块链节点

```bash
# 停止当前节点
pkill cinad

# 重新启动
./cinad start
```

### 3. 验证模块已加载

```bash
# 查询模块信息
./cinad query cina-name --help

# 查看可用命令
./cinad tx cina-name --help
```

## 📝 使用示例

### 注册域名

```bash
# 注册 alice.cina
cinad tx cina-name register alice \
  --from alice \
  --amount 100stake \
  --chain-id cina \
  --yes

# 注册 bob.cina
cinad tx cina-name register bob \
  --from bob \
  --amount 100stake \
  --chain-id cina \
  --yes
```

### 设置解析地址

```bash
# 将 alice.cina 解析到钱包地址
cinad tx cina-name set-address alice \
  cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp \
  --from alice \
  --chain-id cina \
  --yes
```

### 查询域名

```bash
# 查询域名信息
cinad query cina-name name alice

# 查询所有域名
cinad query cina-name names

# 解析域名
cinad query cina-name resolve alice.cina
```

### 续费域名

```bash
# 续费 1 年
cinad tx cina-name renew alice \
  --from alice \
  --amount 50stake \
  --chain-id cina \
  --yes
```

### 转让域名

```bash
# 转让给其他地址
cinad tx cina-name transfer alice \
  cosmos1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  --from alice \
  --chain-id cina \
  --yes
```

## 🌐 与 Cloudflare Tunnel 集成

配置完成后，可以通过域名访问：

```bash
# 通过域名访问 RPC
curl https://alice.cinachain.com/status

# 实际映射
alice.cinachain.com → alice.cina → 钱包地址 → 服务
```

## 📊 域名定价

| 操作 | 价格 |
|------|------|
| 新注册 | 100 stake/年 |
| 续费 | 50 stake/年 |
| 转让 | 免费 |
| 设置地址 | 免费 |

## 🔍 查询命令

```bash
# 查看模块参数
cinad query cina-name params

# 查看域名价格
cinad query cina-name pricing

# 查询过期域名
cinad query cina-name expired

# 查询我的域名
cinad query cina-name owner cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp
```

## 📁 相关文件

| 文件 | 路径 |
|------|------|
| 模块代码 | `/home/cina/.openclaw/workspace/cina/x/cinaname/` |
| 模块文档 | `/home/cina/.openclaw/workspace/cina/x/cinaname/README.md` |
| 类型定义 | `/home/cina/.openclaw/workspace/cina/x/cinaname/types/` |
| 消息处理 | `/home/cina/.openclaw/workspace/cina/x/cinaname/keeper/` |

## ⚠️ 注意事项

1. **域名格式**: 只支持小写字母 a-z 和数字 0-9
2. **最小长度**: 3 个字符
3. **最大长度**: 64 个字符
4. **有效期**: 到期后 30 天宽限期，之后可被他人注册
5. **唯一性**: 域名全局唯一，先注册先得

## 🚀 下一步

1. 构建包含 nameservice 模块的二进制文件
2. 重启区块链节点
3. 测试域名注册功能
4. 配置域名解析到实际服务

---

**创建时间**: 2026-03-26 12:37 UTC
**顶级域名**: `.cina`
**模块名称**: `cina-name`

# 🌐 cina 区块链 - ICS-DNS 标准顶级域名配置

## 📋 ICS-DNS 标准概述

**ICS-DNS** (Interchain Standard Domain Name System) 是 Cosmos 生态的域名标准，由 Starname (原 IOV) 提出。

### 核心特性
- ✅ 支持 Keplr 钱包地址解析
- ✅ 支持区块链浏览器集成
- ✅ 支持 IBC 跨链转账
- ✅ 兼容 Cosmos SDK 标准
- ✅ 多链地址映射

## 🏗️ 架构设计

```
.cina (顶级域)
├── alice.cina (用户域名)
│   ├── 映射到：cosmos1... (Cosmos Hub)
│   ├── 映射到：osmo1... (Osmosis)
│   └── 映射到：stars1... (Stargaze)
├── bob.cina
└── project.cina (项目域名)
```

## 🔧 实现方案

### 方案 1: 集成 Starname 模块（推荐）

使用官方的 Starname 模块实现 ICS-DNS 标准。

```bash
# 添加 Starname 依赖
cd /home/cina/.openclaw/workspace/cina
$HOME/go/bin/go get github.com/iov-one/weave/v10@latest
```

### 方案 2: 自定义 ICS-DNS 模块

创建符合 ICS 标准的自定义模块。

## 📝 配置步骤

### 1. 修改 app.go 添加 IBC 支持

```go
// 在 app/app.go 中添加
import (
    ibc "github.com/cosmos/ibc-go/v8/modules/core"
    ibcclient "github.com/cosmos/ibc-go/v8/modules/core/02-client"
    ibcconnection "github.com/cosmos/ibc-go/v8/modules/core/03-connection"
    ibcchannel "github.com/cosmos/ibc-go/v8/modules/core/04-channel"
    ibchost "github.com/cosmos/ibc-go/v8/modules/core/24-host"
    ibchost "github.com/cosmos/ibc-go/v8/modules/core/24-host"
)

// 添加 IBC 模块到 ModuleBasics
ModuleBasics = module.NewBasicManager(
    // ... 其他模块
    ibc.AppModuleBasic{},
)
```

### 2. 创建 ICS-DNS 模块

```bash
# 创建模块结构
mkdir -p x/icsdns/{types,keeper,client}
```

### 3. 配置 Keplr 钱包支持

创建 `chain_registry.json`:

```json
{
  "chain_name": "cina",
  "status": "live",
  "network_type": "mainnet",
  "website": "https://cinachain.com",
  "chain_id": "cina",
  "bech32_prefix": "cosmos",
  "slip44": 118,
  "fees": {
    "fee_tokens": [{
      "denom": "stake",
      "fixed_min_gas_price": 0,
      "low_gas_price": 0.01,
      "average_gas_price": 0.025,
      "high_gas_price": 0.03
    }]
  },
  "staking": {
    "staking_tokens": [{
      "denom": "stake"
    }]
  },
  "codebase": {
    "git_repo": "https://github.com/cinachain/cina",
    "recommended_version": "v1.0.0",
    "compatible_versions": ["v1.0.0"]
  },
  "peers": {
    "seeds": [],
    "persistent_peers": []
  },
  "apis": {
    "rpc": [{
      "address": "https://rpc.cinachain.com",
      "provider": "cina"
    }],
    "rest": [{
      "address": "https://api.cinachain.com",
      "provider": "cina"
    }],
    "grpc": [{
      "address": "grpc.cinachain.com:443",
      "provider": "cina"
    }]
  },
  "explorers": [{
    "kind": "Mintscan",
    "url": "https://mintscan.io/cina",
    "tx_page": "https://mintscan.io/cina/txs/${txHash}"
  }]
}
```

### 4. 配置区块链浏览器

#### 选项 A: 使用 Big Dipper (开源)

```bash
git clone https://github.com/forbole/big-dipper-2.0-cosmos
cd big-dipper-2.0-cosmos
# 配置 cina 链信息
```

#### 选项 B: 使用 Mintscan (提交申请)

访问 https://github.com/cosmostation/mintscan 提交链信息。

### 5. 配置 IBC 跨链

```bash
# 查询 IBC 状态
cinad query ibc client state

# 创建 IBC 连接
cinad tx ibc connection create ...

# IBC 转账
cinad tx ibc-transfer transfer transfer channel-0 \
  cosmos1... \
  1000stake \
  --from alice \
  --chain-id cina
```

## 🌟 ICS-DNS 模块实现

### 域名结构

```protobuf
message Domain {
  string name = 1;           // 域名 (如 "alice")
  string admin = 2;          // 管理员地址
  uint64 expire_at = 3;      // 过期时间
  repeated Address addresses = 4;  // 多链地址映射
}

message Address {
  string chain_id = 1;       // 链 ID (如 "cosmoshub-4")
  string address = 2;        // 链上地址
}
```

### API 端点

```bash
# 注册域名
cinad tx icsdns register-domain \
  --domain alice \
  --admin cosmos1... \
  --expire 31536000 \
  --from alice \
  --amount 100stake

# 设置地址映射
cinad tx icsdns set-address \
  --domain alice \
  --chain-id cosmoshub-4 \
  --address cosmos1... \
  --from alice

# 查询域名
cinad query icsdns domain alice

# 解析地址
cinad query icsdns resolve alice.cina cosmoshub-4
```

## 📊 完整配置清单

| 组件 | 状态 | 配置 |
|------|------|------|
| IBC 模块 | ⏳ 待配置 | `ibc-go/v8` |
| ICS-DNS 模块 | ⏳ 待创建 | `x/icsdns` |
| Keplr 支持 | ✅ 已配置 | `chain_registry.json` |
| 区块链浏览器 | ⏳ 待部署 | Big Dipper / Mintscan |
| Cloudflare Tunnel | ✅ 已配置 | `cina-rpc` |

## 🚀 部署步骤

### 1. 添加 IBC 支持

编辑 `app/app.go`，添加 IBC 模块。

### 2. 创建 ICS-DNS 模块

使用 Ignite 创建模块框架：

```bash
ignite scaffold module icsdns --yes
```

### 3. 编译并重启

```bash
$HOME/go/bin/go build -o ./cinad ./cmd/cinad
./cinad start
```

### 4. 提交 Chain Registry

PR 到 https://github.com/cosmos/chain-registry

### 5. 部署区块链浏览器

选择 Big Dipper 或申请 Mintscan 收录。

## 📝 Keplr 钱包集成

用户可以在 Keplr 中添加 cina 链：

```javascript
window.keplr.experimentalSuggestChain({
  chainId: "cina",
  chainName: "Cina Chain",
  rpc: "https://rpc.cinachain.com",
  rest: "https://api.cinachain.com",
  bip44: { coinType: 118 },
  bech32Config: { bech32PrefixAccAddr: "cosmos" },
  currencies: [{
    coinDenom: "STAKE",
    coinMinimalDenom: "stake",
    coinDecimals: 6
  }],
  feeCurrencies: [{
    coinDenom: "STAKE",
    coinMinimalDenom: "stake",
    coinDecimals: 6
  }],
  stakeCurrency: {
    coinDenom: "STAKE",
    coinMinimalDenom: "stake",
    coinDecimals: 6
  }
});
```

## 🔗 相关资源

- [ICS-DNS 标准](https://github.com/cosmos/ibc)
- [Starname 实现](https://github.com/iov-one/weave)
- [Chain Registry](https://github.com/cosmos/chain-registry)
- [Big Dipper](https://github.com/forbole/big-dipper-2.0-cosmos)
- [Mintscan](https://www.mintscan.io/)
- [Keplr Wallet](https://www.keplr.app/)

---

**创建时间**: 2026-03-26 12:55 UTC
**标准**: ICS-DNS / Starname 兼容
**顶级域**: `.cina`

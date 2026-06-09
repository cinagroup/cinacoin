# 🌐 cina 区块链 - IBC 跨链配置指南

## 📋 IBC 配置

### 1. 添加 IBC 模块到应用

编辑 `app/app.go`:

```go
import (
    ibc "github.com/cosmos/ibc-go/v8/modules/core"
    ibcclient "github.com/cosmos/ibc-go/v8/modules/core/02-client"
    ibcconnection "github.com/cosmos/ibc-go/v8/modules/core/03-connection"
    ibcchannel "github.com/cosmos/ibc-go/v8/modules/core/04-channel"
    ibchost "github.com/cosmos/ibc-go/v8/modules/core/24-host"
    ibctm "github.com/cosmos/ibc-go/v8/modules/light-clients/07-tendermint"
)

// 添加 IBC 模块到 ModuleBasics
ModuleBasics = module.NewBasicManager(
    // ... 其他模块
    ibc.AppModuleBasic{},
)

// 在应用初始化中添加 IBC Keeper
app.IBCKeeper = ibc.NewKeeper(
    appCodec,
    storeKeys[ibchost.StoreKey],
    app.GetSubspace(ibchost.ModuleName),
    app.StakingKeeper,
    app.UpgradeKeeper,
    scopedIBCKeeper,
)
```

### 2. 配置 IBC 通道

#### 连接到 Cosmos Hub

```bash
# 查询 Cosmos Hub 客户端状态
cinad query ibc client state

# 创建连接
cinad tx ibc connection create \
  <client-id-on-cosmos> \
  <client-id-on-cina> \
  --from alice \
  --chain-id cina

# 创建通道
cinad tx ibc channel open-init \
  <connection-id> \
  <port-id> \
  <counterparty-port-id> \
  --order ORDERED \
  --version ics20-1 \
  --from alice \
  --chain-id cina
```

### 3. IBC 转账

```bash
# 从 cina 发送到 Cosmos Hub
cinad tx ibc-transfer transfer \
  transfer \
  channel-0 \
  cosmos1... \
  1000stake \
  --from alice \
  --chain-id cina \
  --packet-timeout-height 0-0-0-0 \
  --fees 200stake

# 从 Cosmos Hub 发送到 cina
gaiad tx ibc-transfer transfer \
  transfer \
  channel-XXX \
  cosmos1... \
  1000stake \
  --from alice \
  --chain-id cosmoshub-4
```

### 4. 查询 IBC 状态

```bash
# 查询客户端
cinad query ibc client clients

# 查询连接
cinad query ibc connection connections

# 查询通道
cinad query ibc channel channels

# 查询 IBC 余额
cinad query ibc-transfer denom-traces
```

## 🔗 已知 IBC 连接

| 链 | Chain ID | 状态 | Channel |
|---|----------|------|---------|
| Cosmos Hub | cosmoshub-4 | ⏳ 待配置 | - |
| Osmosis | osmosis-1 | ⏳ 待配置 | - |
| Stargaze | stargaze-1 | ⏳ 待配置 | - |
| Juno | juno-1 | ⏳ 待配置 | - |

## 📊 区块链浏览器部署

### 选项 1: Big Dipper (开源推荐)

#### 部署步骤

```bash
# 1. 克隆仓库
git clone https://github.com/forbole/big-dipper-2.0-cosmos
cd big-dipper-2.0-cosmos

# 2. 配置 cina 链
cp .env.example .env
vim .env

# 修改配置:
REACT_APP_APP_NAME=Cina
REACT_APP_CHAIN_ID=cina
REACT_APP_RPC_URL=https://rpc.cinachain.com
REACT_APP_LCD_URL=https://api.cinachain.com
REACT_APP_WEBSOCKET=wss://rpc.cinachain.com/websocket

# 3. 安装依赖
yarn install

# 4. 构建
yarn build

# 5. 部署
yarn start
```

#### Docker 部署

```bash
docker run -d \
  -p 3000:3000 \
  -e REACT_APP_CHAIN_ID=cina \
  -e REACT_APP_RPC_URL=https://rpc.cinachain.com \
  -e REACT_APP_LCD_URL=https://api.cinachain.com \
  forbole/big-dipper-2.0-cosmos
```

### 选项 2: Mintscan (申请收录)

1. 访问 https://github.com/cosmostation/mintscan
2. 提交 Issue 申请添加 cina 链
3. 提供链信息和 RPC/API 端点
4. 等待审核通过

### 选项 3: Ping.pub

```bash
git clone https://github.com/ping-pub/explorer
cd explorer
# 配置 cina 链信息
# 部署
```

## 🌟 ICS-DNS 模块实现

### 创建模块

```bash
cd /home/cina/.openclaw/workspace/cina
ignite scaffold module icsdns --yes
```

### 定义 Protobuf

```protobuf
// proto/cina/icsdns/v1/domain.proto
syntax = "proto3";
package cina.icsdns.v1;

import "gogoproto/gogo.proto";

message Domain {
  string name = 1;
  string admin = 2;
  uint64 expire_at = 3;
  repeated ChainAddress addresses = 4;
}

message ChainAddress {
  string chain_id = 1;
  string address = 2;
}
```

### 实现 Keeper

```go
// x/icsdns/keeper/domain.go
func (k Keeper) RegisterDomain(ctx sdk.Context, domain string, admin sdk.AccAddress) error {
    // 检查域名是否已存在
    if k.HasDomain(ctx, domain) {
        return types.ErrDomainAlreadyExists
    }
    
    // 创建域名
    d := types.Domain{
        Name: domain,
        Admin: admin.String(),
        ExpireAt: uint64(ctx.BlockTime().Add(365*24*time.Hour).Unix()),
        Addresses: []types.ChainAddress{},
    }
    
    k.SetDomain(ctx, d)
    return nil
}

func (k Keeper) SetAddress(ctx sdk.Context, domain string, chainID string, address string) error {
    d, found := k.GetDomain(ctx, domain)
    if !found {
        return types.ErrDomainNotFound
    }
    
    // 添加或更新地址映射
    // ...
    
    k.SetDomain(ctx, d)
    return nil
}
```

## 📝 完整部署清单

| 任务 | 状态 | 说明 |
|------|------|------|
| IBC 模块集成 | ⏳ 待完成 | 添加 ibc-go 依赖 |
| ICS-DNS 模块 | ⏳ 待创建 | 创建域名系统模块 |
| Chain Registry | ✅ 已配置 | `chain_registry.json` |
| Keplr 集成 | ✅ 已配置 | `keplr_integration.js` |
| 区块链浏览器 | ⏳ 待部署 | Big Dipper / Mintscan |
| IBC 连接 | ⏳ 待配置 | 连接其他 Cosmos 链 |

## 🔧 测试命令

```bash
# 测试 IBC 功能
cinad query ibc client clients

# 测试域名注册
cinad tx icsdns register-domain \
  --domain test \
  --admin cosmos1... \
  --from alice \
  --amount 100stake

# 测试域名解析
cinad query icsdns resolve test.cina
```

## 📚 相关资源

- [IBC 协议文档](https://ibc.cosmos.network/)
- [ibc-go 仓库](https://github.com/cosmos/ibc-go)
- [Big Dipper 文档](https://docs.bigdipper.live/)
- [Chain Registry](https://github.com/cosmos/chain-registry)
- [Keplr 文档](https://docs.keplr.app/)

---

**创建时间**: 2026-03-26 12:55 UTC
**标准**: ICS / IBC / ICS-DNS
**顶级域**: `.cina`

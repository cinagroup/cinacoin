# 🌐 cina 区块链浏览器部署指南

## ✅ 功能测试完成

| 功能 | 状态 | 说明 |
|------|------|------|
| 转账 | ✅ 成功 | 10000 stake 转账测试通过 |
| 质押 | ✅ 成功 | 5000 stake 委托测试通过 |
| 治理提案 | ✅ 成功 | 提案 ID: 1 |
| 治理投票 | ✅ 成功 | 投票：yes |

## 📊 区块链浏览器选项

### 选项 1: Big Dipper 2.0 (开源推荐)

#### Docker 部署（最简单）

```bash
# 创建配置文件
mkdir -p ~/big-dipper
cat > ~/big-dipper/docker-compose.yml << 'EOF'
version: '3'
services:
  frontend:
    image: forbole/big-dipper-2.0-cosmos:latest
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_APP_NAME=Cina
      - REACT_APP_CHAIN_ID=cina
      - REACT_APP_RPC_URL=https://rpc.cinachain.com
      - REACT_APP_LCD_URL=https://api.cinachain.com
      - REACT_APP_WEBSOCKET=wss://rpc.cinachain.com/websocket
    restart: unless-stopped
EOF

# 启动
cd ~/big-dipper
docker-compose up -d

# 访问
# http://localhost:3000
```

#### 源码部署

```bash
# 克隆仓库
git clone https://github.com/forbole/big-dipper-2.0-cosmos.git
cd big-dipper-2.0-cosmos

# 安装依赖
yarn install

# 配置
cp .env.example .env
vim .env

# 修改配置:
REACT_APP_APP_NAME=Cina
REACT_APP_CHAIN_ID=cina
REACT_APP_RPC_URL=https://rpc.cinachain.com
REACT_APP_LCD_URL=https://api.cinachain.com
REACT_APP_WEBSOCKET=wss://rpc.cinachain.com/websocket

# 构建
yarn build

# 启动
yarn start
```

### 选项 2: Ping.pub (轻量级)

```bash
# 克隆仓库
git clone https://github.com/ping-pub/explorer.git
cd explorer

# 配置 cina 链
cat > config/cina.yaml << 'EOF'
name: cina
title: Cina Chain
rpc: https://rpc.cinachain.com
lcd: https://api.cinachain.com
chainId: cina
coin: stake
prefix: cosmos
EOF

# Docker 部署
docker run -d \
  -p 8080:80 \
  -v $(pwd)/config:/usr/share/nginx/html/config \
  pingpub/explorer
```

### 选项 3: Mintscan (申请收录)

1. 访问 https://github.com/cosmostation/mintscan
2. 创建 Issue 申请添加 cina 链
3. 提供以下信息：
   - Chain ID: cina
   - RPC: https://rpc.cinachain.com
   - API: https://api.cinachain.com
   - Logo: (提供 logo URL)
4. 等待审核通过

## 🔧 配置 Chain Registry

提交到官方 Chain Registry：

```bash
# Fork 仓库
git clone https://github.com/cosmos/chain-registry.git
cd chain-registry

# 创建目录
mkdir -p testnets/cina

# 复制配置
cp /home/cina/.openclaw/workspace/cina/chain_registry.json testnets/cina/chain.json

# 提交 PR
git add .
git commit -m "Add Cina Chain"
git push origin main

# 在 GitHub 创建 Pull Request
```

## 📋 Chain Registry 配置

当前配置已创建在：`/home/cina/.openclaw/workspace/cina/chain_registry.json`

包含：
- ✅ 链基本信息
- ✅ RPC/API 端点
- ✅ 代币信息
- ✅ 浏览器链接
- ✅ IBC 配置

## 🌐 访问地址

部署后可通过以下地址访问：

| 服务 | 地址 |
|------|------|
| **Big Dipper** | http://localhost:3000 |
| **Ping.pub** | http://localhost:8080 |
| **Mintscan** | https://mintscan.io/cina (待申请) |

## 📊 区块链信息

| 项目 | 值 |
|------|-----|
| Chain ID | cina |
| 当前高度 | 2600+ |
| RPC | https://rpc.cinachain.com |
| API | https://api.cinachain.com |
| gRPC | grpc.cinachain.com:443 |
| Bech32 前缀 | cosmos |
| 代币 | stake |

## 🚀 快速部署（推荐）

使用 Big Dipper Docker：

```bash
# 一键部署
docker run -d \
  -p 3000:3000 \
  -e REACT_APP_APP_NAME=Cina \
  -e REACT_APP_CHAIN_ID=cina \
  -e REACT_APP_RPC_URL=https://rpc.cinachain.com \
  -e REACT_APP_LCD_URL=https://api.cinachain.com \
  --name cina-explorer \
  forbole/big-dipper-2.0-cosmos:latest

# 访问
echo "浏览器访问：http://localhost:3000"
```

## 📝 验证部署

部署后访问浏览器，应该能看到：
- ✅ 最新区块
- ✅ 交易列表
- ✅ 验证者列表
- ✅ 治理提案
- ✅ 账户查询

---

**更新时间**: 2026-03-26 13:56 UTC
**区块高度**: 2600+
**状态**: ✅ 功能测试完成

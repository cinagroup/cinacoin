# 🪙 CINACOIN 代币单位与挖矿机制详解

**更新时间**: 2026-03-27 07:14 UTC

---

## 💰 代币单位体系

### 完整单位表

| 单位 | 指数 | 换算 | 说明 |
|------|------|------|------|
| **cinacoin** | 10^0 | 1 cinacoin | 基础单位 (最小单位) |
| **uCINACOIN** | 10^3 | 1,000 cinacoin | 微单位 (micro) |
| **mCINACOIN** | 10^6 | 1,000,000 cinacoin | 毫单位 (milli) |
| **CINACOIN** | 10^9 | 1,000,000,000 cinacoin | 主单位 (显示单位) |

### 单位换算示例

```
1 CINACOIN    = 1,000 mCINACOIN = 1,000,000 uCINACOIN = 1,000,000,000 cinacoin
1 mCINACOIN   = 1,000 uCINACOIN = 1,000,000 cinacoin
1 uCINACOIN   = 1,000 cinacoin
```

### 使用示例

```bash
# 发送 1 CINACOIN
./cinad tx bank send alice bob 1000000000cinacoin --chain-id cina -y

# 发送 1 mCINACOIN (0.001 CINACOIN)
./cinad tx bank send alice bob 1000000cinacoin --chain-id cina -y

# 发送 1 uCINACOIN (0.000001 CINACOIN)
./cinad tx bank send alice bob 1000cinacoin --chain-id cina -y
```

---

## ⛽ Gas 费配置

### 当前设置

```toml
minimum-gas-prices = "0.025cinacoin"
```

### Gas 费用计算

| 交易类型 | Gas 消耗 | 费用 (cinacoin) | 费用 (uCINACOIN) | 费用 (CINACOIN) |
|----------|----------|-----------------|------------------|-----------------|
| 简单转账 | ~50,000 | 1,250 | 1.25 uCINACOIN | 0.00000125 CINACOIN |
| 创建验证者 | ~500,000 | 12,500 | 12.5 uCINACOIN | 0.0000125 CINACOIN |
| 质押委托 | ~150,000 | 3,750 | 3.75 uCINACOIN | 0.00000375 CINACOIN |
| 治理投票 | ~100,000 | 2,500 | 2.5 uCINACOIN | 0.0000025 CINACOIN |
| IBC 转账 | ~200,000 | 5,000 | 5 uCINACOIN | 0.000005 CINACOIN |

---

## ⛏️ 挖矿机制详解

Cina Chain 使用 **PoS (Proof of Stake)** 共识机制，通过质押代币参与区块生产和验证。

### 1. 铸币 (Mint) 机制

#### 铸币参数

| 参数 | 值 | 说明 |
|------|-----|------|
| **mint_denom** | cinacoin | 增发的代币单位 |
| **inflation_rate_change** | 13% | 通胀率年调整幅度 |
| **inflation_max** | 20% | 最大年化通胀率 |
| **inflation_min** | 7% | 最小年化通胀率 |
| **goal_bonded** | 67% | 目标质押率 |
| **blocks_per_year** | 6,311,520 | 每年区块数 |

#### 通胀率动态调整

通胀率根据**实际质押率**动态调整：

```
如果 实际质押率 < 67%:
    通胀率 ↑ (增加，鼓励更多质押)
    
如果 实际质押率 > 67%:
    通胀率 ↓ (减少，降低通胀)
    
如果 实际质押率 = 67%:
    通胀率稳定
```

#### 年增发量计算

按当前供应量 1 亿 CINACOIN 计算：

| 场景 | 通胀率 | 年增发量 (CINACOIN) | 日增发量 (CINACOIN) |
|------|--------|---------------------|---------------------|
| 最低通胀 | 7% | 7,000,000 | ~19,178 |
| 平均通胀 | 13.5% | 13,500,000 | ~36,986 |
| 最高通胀 | 20% | 20,000,000 | ~54,795 |

#### 区块奖励分配

```
每区块增发 = (年增发量 / 6,311,520) × 5 秒

按 13.5% 平均通胀计算:
每区块增发 ≈ 0.00214 CINACOIN (2,140,000 cinacoin)
```

---

### 2. 质押 (Staking) 机制

#### 质押参数

| 参数 | 值 | 说明 |
|------|-----|------|
| **bond_denom** | cinacoin | 可质押的代币 |
| **max_validators** | 100 | 最大验证者数量 |
| **unbonding_time** | 1814400 秒 (21 天) | 解绑等待期 |
| **max_entries** | 7 | 最大解绑条目数 |
| **historical_entries** | 10000 | 历史存储条目 |

#### 验证者要求

- **最大验证者数**: 100 个
- **质押门槛**: 进入前 100 名即可成为验证者
- **解绑等待**: 21 天后才能提取质押代币

#### 质押收益来源

1. **通胀增发**: 每区块按比例分配给验证者和委托人
2. **交易手续费**: Gas 费分配给验证者
3. **奖励分配**: 验证者可设置佣金比例 (0-100%)

#### 收益计算公式

```
验证者总奖励 = 区块奖励 + 交易手续费

委托人收益 = (委托量 / 验证者总质押量) × 验证者总奖励 × (1 - 佣金率)
```

#### 示例计算

假设:
- 验证者 A 总质押：1,000,000 CINACOIN
- 你委托：10,000 CINACOIN (占 1%)
- 验证者佣金：10%
- 日增发：36,986 CINACOIN

```
你的日收益 = 36,986 × 1% × (1 - 10%) = 332.87 CINACOIN
年收益率 (APY) = (332.87 × 365) / 10,000 × 100% ≈ 12.15%
```

---

### 3. 共识机制 (Tendermint BFT)

#### 出块流程

```
1. 提议阶段 (Propose)
   - 验证者轮流提议新区块
   - 超时：3 秒
   
2. 预投票阶段 (Prevote)
   - 验证者对提议投票
   - 超时：1 秒
   
3. 预提交阶段 (Precommit)
   - 验证者提交投票
   - 超时：1 秒
   
4. 提交阶段 (Commit)
   - 收集 2/3+ 投票后提交
   - 超时：5 秒
```

#### 平均出块时间

```
理论时间 = 3 + 1 + 1 + 5 = 10 秒
实际时间 ≈ 5 秒 (通常更快完成)
```

---

### 4. 惩罚机制 (Slashing)

#### 惩罚条件

| 违规行为 | 惩罚比例 | 说明 |
|----------|----------|------|
| **双签** | 5% | 同一高度签署多个区块 |
| **长时间离线** | 0.01% | 错过一定数量的块 |

#### 离线检测

- **窗口期**: 10,000 个区块
- **容忍度**: 允许错过 500 个块 (5%)
- **超过容忍**: 触发惩罚和解绑

---

## 📊 挖矿参与方式

### 方式 1: 成为验证者

```bash
# 1. 创建验证者 (需要进入前 100 名)
./cinad tx staking create-validator \
  --amount=1000000000000cinacoin \  # 1000 CINACOIN
  --pubkey=<validator_pubkey> \
  --moniker="My Validator" \
  --commission-rate="0.10" \  # 10% 佣金
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --from=alice \
  --chain-id=cina \
  -y
```

### 方式 2: 委托质押

```bash
# 委托给验证者
./cinad tx staking delegate \
  <validator_address> \
  10000000000cinacoin \  # 10 CINACOIN
  --from=alice \
  --chain-id=cina \
  -y
```

### 方式 3: 解除质押

```bash
# 发起解绑 (21 天后到账)
./cinad tx staking unbond \
  <validator_address> \
  10000000000cinacoin \
  --from=alice \
  --chain-id=cina \
  -y

# 21 天后提取
./cinad tx staking withdraw-rewards <validator_address> --from=alice -y
```

---

## 🔍 查询命令

### 查询质押信息

```bash
# 查询验证者列表
./cinad query staking validators

# 查询特定验证者
./cinad query staking validator <validator_address>

# 查询委托信息
./cinad query staking delegation alice <validator_address>

# 查询质押池
./cinad query staking pool
```

### 查询铸币信息

```bash
# 查询铸币参数
./cinad query mint params

# 查询年增发量
./cinad query mint annual-provisions

# 查询通胀率
./cinad query mint inflation
```

### 查询收益

```bash
# 查询待领取奖励
./cinad query distribution rewards alice

# 查询验证者佣金
./cinad query distribution commission <validator_address>
```

---

## 📈 经济模型总结

### 代币流向

```
铸币增发 (7-20%/年)
    │
    ├──→ 验证者奖励 (区块奖励)
    │       │
    │       ├──→ 验证者自留 (佣金)
    │       └──→ 委托人分红
    │
    └──→ 社区池 (治理提案使用)

交易手续费
    │
    ├──→ 验证者 (70%)
    └──→ 销毁 (30%, 可配置)
```

### 关键指标

| 指标 | 值 | 说明 |
|------|-----|------|
| **初始供应** | 100,000,000 CINACOIN | 创世分配 |
| **年增发率** | 7% - 20% | 动态调整 |
| **目标质押率** | 67% | 理想状态 |
| **验证者数量** | 最多 100 | 竞争机制 |
| **解绑时间** | 21 天 | 安全等待期 |
| **出块时间** | ~5 秒 | 快速确认 |

---

## ⚠️ 风险提示

1. **质押风险**: 解绑需要 21 天等待期
2. **惩罚风险**: 验证者离线或双签会被罚没
3. **通胀风险**: 高通胀可能导致购买力下降
4. **佣金风险**: 验证者可能提高佣金比例

---

_配置完成！代币单位体系和挖矿机制已配置完毕。_

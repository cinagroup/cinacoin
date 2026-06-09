# 🏦 自定义铸币机制指南

**更新时间**: 2026-03-27 07:26 UTC  
**当前通胀率**: **0%** (无增发)

---

## ✅ 当前铸币配置

| 参数 | 值 | 说明 |
|------|-----|------|
| **mint_denom** | cinacoin | 铸币代币 |
| **inflation_rate_change** | 0% | 通胀率调整速度 |
| **inflation_max** | 0% | 最大通胀率 |
| **inflation_min** | 0% | 最小通胀率 |
| **goal_bonded** | 67% | 目标质押率 |
| **blocks_per_year** | 6,311,520 | 每年区块数 |

**效果**: 无通胀增发，总供应量固定为 1 亿 CINACOIN

---

## 🔧 自定义铸币机制的方法

### 方法 1: 修改创世文件 (适用于新链/重置链)

#### 步骤

1. **停止节点**
   ```bash
   ps aux | grep cinad | grep -v grep | awk '{print $2}' | xargs kill
   ```

2. **备份创世文件**
   ```bash
   cp /home/cina/.cina/config/genesis.json \
      /home/cina/.cina/config/genesis.json.backup
   ```

3. **编辑铸币参数**
   ```bash
   python3 << 'PYEOF'
   import json
   
   with open('/home/cina/.cina/config/genesis.json', 'r') as f:
       data = json.load(f)
   
   # 修改铸币参数
   data['app_state']['mint']['params'] = {
       "mint_denom": "cinacoin",
       "inflation_rate_change": "0.130000000000000000",  # 13% 年变化率
       "inflation_max": "0.200000000000000000",          # 20% 最大通胀
       "inflation_min": "0.070000000000000000",          # 7% 最小通胀
       "goal_bonded": "0.670000000000000000",            # 67% 目标质押率
       "blocks_per_year": "6311520"                      # 年区块数
   }
   
   with open('/home/cina/.cina/config/genesis.json', 'w') as f:
       json.dump(data, f, indent=2)
   
   print("✅ 铸币参数已更新")
   PYEOF
   ```

4. **重启节点**
   ```bash
   cd /home/cina/.openclaw/workspace/cina
   nohup ./cinad start --home /home/cina/.cina > logs/cinad.log 2>&1 &
   ```

---

### 方法 2: 治理提案修改参数 (适用于运行中的链) ⭐推荐

通过链上治理动态调整铸币参数，无需重启节点。

#### 步骤

1. **创建参数变更提案**

   ```bash
   # 创建通胀参数变更提案
   ./cinad tx gov submit-proposal param-change \
     << 'EOF'
   {
     "title": "Adjust Inflation Rate",
     "description": "Set annual inflation rate to 15%",
     "changes": [
       {
         "subspace": "mint",
         "key": "InflationRateChange",
         "value": "\"0.150000000000000000\""
       },
       {
         "subspace": "mint",
         "key": "InflationMax",
         "value": "\"0.150000000000000000\""
       },
       {
         "subspace": "mint",
         "key": "InflationMin",
         "value": "\"0.150000000000000000\""
       }
     ],
     "deposit": "1000000000cinacoin"
   }
   EOF
   --from alice \
   --chain-id cina \
   -y
   ```

2. **投票通过提案**

   ```bash
   # 查询提案 ID
   ./cinad query gov proposals
   
   # 投票支持
   ./cinad tx gov vote <proposal_id> yes --from alice -y
   ```

3. **验证参数变更**

   ```bash
   ./cinad query mint params
   ```

---

### 方法 3: 自定义铸币模块 (高级开发)

创建完全自定义的铸币逻辑，需要修改源代码。

#### 实现步骤

1. **Fork Cosmos SDK**
   ```bash
   git clone https://github.com/cosmos/cosmos-sdk.git
   cd cosmos-sdk
   ```

2. **修改铸币模块**
   
   文件：`x/mint/keeper/keeper.go`
   
   ```go
   // 自定义铸币逻辑
   func (k Keeper) MintCoins(ctx sdk.Context, newCoins sdk.Coins) error {
       // 自定义逻辑：
       // 1. 固定数量铸币
       // 2. 基于交易量的铸币
       // 3. 社区投票决定的铸币
       // ...
       
       return k.bankKeeper.MintCoins(ctx, types.ModuleName, newCoins)
   }
   ```

3. **重新编译节点**
   ```bash
   make build
   cp build/cinad /home/cina/.openclaw/workspace/cina/
   ```

4. **升级节点**
   ```bash
   # 通过治理提案升级
   ./cinad tx gov submit-proposal software-upgrade ...
   ```

---

## 📊 常见铸币策略

### 策略 1: 零通胀 (当前配置)

```json
{
  "inflation_rate_change": "0.000000000000000000",
  "inflation_max": "0.000000000000000000",
  "inflation_min": "0.000000000000000000"
}
```

**特点**:
- ✅ 总供应量固定，通缩模型
- ✅ 适合价值存储
- ❌ 无质押奖励 (仅靠 Gas 费)

---

### 策略 2: 固定通胀

```json
{
  "inflation_rate_change": "0.000000000000000000",
  "inflation_max": "0.100000000000000000",
  "inflation_min": "0.100000000000000000"
}
```

**特点**:
- ✅ 固定 10% 年通胀
- ✅ 可预测的质押收益
- ⚠️ 无法根据质押率调整

---

### 策略 3: 动态通胀 (默认配置)

```json
{
  "inflation_rate_change": "0.130000000000000000",
  "inflation_max": "0.200000000000000000",
  "inflation_min": "0.070000000000000000"
}
```

**特点**:
- ✅ 根据质押率动态调整
- ✅ 激励目标质押率 (67%)
- ⚠️ 通胀率波动

---

### 策略 4: 递减通胀

```json
{
  "inflation_rate_change": "-0.010000000000000000",
  "inflation_max": "0.200000000000000000",
  "inflation_min": "0.010000000000000000"
}
```

**特点**:
- ✅ 每年递减 1%
- ✅ 早期高奖励，后期通缩
- ⚠️ 需要自定义代码实现

---

### 策略 5: 基于使用量的铸币

完全自定义：根据链上交易量、TVL 等指标动态铸币。

**需要**: 修改铸币模块源代码

---

## 📈 铸币参数说明

### 核心参数

| 参数 | 类型 | 说明 | 建议值 |
|------|------|------|--------|
| **mint_denom** | string | 铸币的代币名称 | cinacoin |
| **inflation_rate_change** | decimal | 通胀率年调整幅度 | 0.00-0.20 |
| **inflation_max** | decimal | 最大年化通胀率 | 0.05-0.20 |
| **inflation_min** | decimal | 最小年化通胀率 | 0.01-0.10 |
| **goal_bonded** | decimal | 目标质押率 | 0.50-0.75 |
| **blocks_per_year** | int | 每年区块数 | 6,311,520 |

### 计算公式

```
目标质押率 = 67%

如果 实际质押率 < 67%:
    通胀率 ↑ (增加质押激励)
    
如果 实际质押率 > 67%:
    通胀率 ↓ (减少通胀压力)

每区块增发 = (年增发量 / blocks_per_year)
年增发量 = 总供应量 × 通胀率
```

---

## 🔍 查询和监控

### 查询铸币参数

```bash
# 查询当前铸币参数
./cinad query mint params

# 查询年增发量
./cinad query mint annual-provisions

# 查询当前通胀率
./cinad query mint inflation

# 查询铸币池
./cinad query mint supply
```

### API 查询

```bash
# 铸币参数
curl http://api.cinachain.com/cosmos/mint/v1beta1/params

# 年增发量
curl http://api.cinachain.com/cosmos/mint/v1beta1/annual_provisions

# 当前通胀率
curl http://api.cinachain.com/cosmos/mint/v1beta1/inflation
```

### 监控指标

| 指标 | 命令 | 说明 |
|------|------|------|
| 当前通胀率 | `cinad query mint inflation` | 实时通胀率 |
| 质押率 | `cinad query staking pool` | 实际质押比例 |
| 年增发量 | `cinad query mint annual-provisions` | 年度铸币量 |
| 总供应量 | `cinad query bank total` | 流通供应量 |

---

## 💡 最佳实践建议

### 1. 测试网配置

```json
{
  "inflation_max": "0.50",
  "inflation_min": "0.50",
  "inflation_rate_change": "0.00"
}
```

**目的**: 高通胀测试激励效果

---

### 2. 主网启动配置

```json
{
  "inflation_max": "0.15",
  "inflation_min": "0.07",
  "inflation_rate_change": "0.10"
}
```

**目的**: 适度通胀，激励早期参与者

---

### 3. 成熟期配置

```json
{
  "inflation_max": "0.05",
  "inflation_min": "0.02",
  "inflation_rate_change": "0.01"
}
```

**目的**: 低通胀，稳定经济

---

### 4. 通缩配置 (当前)

```json
{
  "inflation_max": "0.00",
  "inflation_min": "0.00",
  "inflation_rate_change": "0.00"
}
```

**目的**: 固定供应，价值存储

---

## ⚠️ 注意事项

1. **创世文件修改**: 需要重启节点，会重置链状态
2. **治理提案**: 适用于运行中的链，无需重启
3. **参数范围**: 所有值为 0-1 的小数
4. **精度**: 使用 18 位小数精度
5. **测试**: 修改前务必在测试网验证

---

## 📝 快速参考

### 恢复默认通胀 (13.5% 平均)

```bash
python3 << 'PYEOF'
import json
with open('/home/cina/.cina/config/genesis.json', 'r') as f:
    data = json.load(f)
data['app_state']['mint']['params'] = {
    "mint_denom": "cinacoin",
    "inflation_rate_change": "0.130000000000000000",
    "inflation_max": "0.200000000000000000",
    "inflation_min": "0.070000000000000000",
    "goal_bonded": "0.670000000000000000",
    "blocks_per_year": "6311520"
}
with open('/home/cina/.cina/config/genesis.json', 'w') as f:
    json.dump(data, f, indent=2)
print("✅ 已恢复默认通胀配置")
PYEOF
```

---

_铸币机制配置完成！当前通胀率为 0%，总供应量固定。_

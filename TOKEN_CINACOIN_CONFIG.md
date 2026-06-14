# 🪙 CINACOIN 代币配置详情

**更新时间**: 2026-03-27 06:56 UTC  
**代币名称**: Cinacoin  
**符号**: CINACOIN

---

## 💰 代币基本信息

| 属性 | 值 |
|------|-----|
| **名称** | Cinacoin |
| **符号** | CINACOIN |
| **基础单位** | cinacoin |
| **显示单位** | CINACOIN |
| **精度** | 9 位小数 |
| **总供应量** | 100,000,000 CINACOIN |
| **基础单位总量** | 100,000,000,000,000,000 cinacoin |

### 精度换算

```
1 CINACOIN = 1,000,000,000 cinacoin (10^9)
0.000000001 CINACOIN = 1 cinacoin
```

---

## 📊 创世分配

### 初始账户余额

| 地址 | 余额 (CINACOIN) | 余额 (cinacoin) | 占比 |
|------|-----------------|-----------------|------|
| `cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp` | 100,000,000 | 100,000,000,000,000,000 | 100% |

**总供应量**: 1 亿 CINACOIN

---

## 🏦 通胀设置

### 铸币参数

```json
{
  "mint_denom": "cinacoin",
  "inflation_rate_change": "0.13",
  "inflation_max": "0.20",
  "inflation_min": "0.07",
  "goal_bonded": "0.67",
  "blocks_per_year": "6311520"
}
```

### 参数说明

| 参数 | 值 | 说明 |
|------|-----|------|
| **mint_denom** | cinacoin | 铸币代币名称 |
| **inflation_rate_change** | 13% | 通胀率年变化率 |
| **inflation_max** | 20% | 最大年化通胀率 |
| **inflation_min** | 7% | 最小年化通胀率 |
| **goal_bonded** | 67% | 目标质押率 |
| **blocks_per_year** | 6,311,520 | 每年区块数 (约 5 秒/块) |

### 通胀机制

- **动态调整**: 通胀率根据实际质押率在 7%-20% 之间动态调整
- **目标质押率**: 67%
  - 如果实际质押率 < 67%，通胀率上升
  - 如果实际质押率 > 67%，通胀率下降
- **年增发量**: 约 7%-20% 的流通供应量

### 预估年通胀

按当前供应量计算：
- **最低通胀**: 100,000,000 × 7% = **7,000,000 CINACOIN/年**
- **最高通胀**: 100,000,000 × 20% = **20,000,000 CINACOIN/年**
- **平均通胀**: 100,000,000 × 13.5% = **13,500,000 CINACOIN/年**

---

## ⛽ Gas 费设置

### 当前配置

```toml
# app.toml
minimum-gas-prices = "0cinacoin"
```

### Gas 参数详解

| 参数 | 值 | 说明 |
|------|-----|------|
| **最低 gas 价格** | 0 cinacoin | 当前为 0 (测试网) |
| **Gas 限制** | 动态 | 根据交易类型自动计算 |

### 建议生产环境配置

```toml
# 建议设置最低 gas 价格
minimum-gas-prices = "0.025cinacoin"
```

### 典型交易 Gas 消耗

| 交易类型 | Gas 消耗 | 费用 (0.025 cinacoin/gas) |
|----------|----------|---------------------------|
| 简单转账 | ~50,000 | ~1,250 cinacoin (0.00000125 CINACOIN) |
| 质押委托 | ~150,000 | ~3,750 cinacoin (0.00000375 CINACOIN) |
| 治理投票 | ~100,000 | ~2,500 cinacoin (0.0000025 CINACOIN) |
| IBC 转账 | ~200,000 | ~5,000 cinacoin (0.000005 CINACOIN) |

---

## 📝 配置文件位置

```
/home/cina/.cina/config/
├── genesis.json          # 创世文件 (已更新)
├── app.toml              # 应用配置 (gas 价格已更新)
└── config.toml           # CometBFT 配置
```

### 备份文件

- `genesis.json.backup.20260327_064356` (cina 版本)
- `genesis.json.backup.cina.20260327_0656xx` (cinacoin 版本)

---

## 🔍 验证命令

### 查询余额

```bash
# 查询账户余额
./cinad query bank balances cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp \
  --home /home/cina/.cina

# 查询特定代币
./cinad query bank balances cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp \
  --denom cinacoin
```

### 查询通胀参数

```bash
./cinad query mint params --home /home/cina/.cina
```

### 查询质押参数

```bash
./cinad query staking params --home /home/cina/.cina
```

### API 查询

```bash
# 总供应量
curl http://api.cinachain.com/cosmos/bank/v1beta1/supply/total

# 代币元数据
curl http://api.cinachain.com/cosmos/bank/v1beta1/denoms_metadata

# 通胀参数
curl http://api.cinachain.com/cosmos/mint/v1beta1/params
```

---

## 💡 使用示例

### 发送交易

```bash
# 发送 100 CINACOIN
./cinad tx bank send alice cosmos1xxx 100000000000cinacoin \
  --chain-id cina \
  --fees 1250cinacoin \
  -y

# 发送 0.5 CINACOIN (500,000,000 cinacoin)
./cinad tx bank send alice cosmos1xxx 500000000cinacoin \
  --chain-id cina \
  -y
```

### 质押

```bash
# 质押 10,000 CINACOIN
./cinad tx staking delegate <validator_address> 10000000000000cinacoin \
  --from alice \
  --chain-id cina \
  -y
```

---

## 📊 代币经济模型

### 供应分配

```
初始供应：100,000,000 CINACOIN (100%)
└── 创世账户：100,000,000 CINACOIN (100%)
```

### 通胀增发

```
年增发率：7% - 20% (动态调整)
年增发量：7,000,000 - 20,000,000 CINACOIN
```

### 通缩机制

- **Gas 费销毁**: 可配置部分 Gas 费销毁
- **治理提案**: 可通过治理调整通胀参数

---

## ⚠️ 重要提示

1. **精度注意**: 所有交易金额使用基础单位 `cinacoin`
2. **显示转换**: 钱包应用应显示 `CINACOIN` (除以 10^9)
3. **Gas 费用**: 当前为 0，生产环境建议设置合理费用
4. **通胀监控**: 定期检查实际质押率和通胀率

---

## 📈 后续建议

### 生产环境配置

1. **设置 Gas 价格**:
   ```toml
   minimum-gas-prices = "0.025cinacoin"
   ```

2. **启用 Gas 费销毁**:
   ```toml
   [baseapp]
   burn_fraction = "0.5"  # 销毁 50% Gas 费
   ```

3. **调整通胀参数** (如需要):
   ```bash
   ./cinad tx gov submit-proposal param-change ...
   ```

---

_配置完成！Cina Chain 现在使用 CINACOIN 作为原生代币。_

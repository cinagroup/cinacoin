# 🪙 代币名称更新：CINATOKEN

**更新时间**: 2026-03-28 01:03 UTC  
**修改内容**: cinacoin → cinatoken

---

## ✅ 代币信息

| 属性 | 值 |
|------|-----|
| **名称** | CinaToken |
| **符号** | CINATOKEN |
| **基础单位** | cinatoken |
| **显示单位** | CINATOKEN |
| **精度** | 9 位小数 |
| **总供应量** | 100,000,000 CINATOKEN |
| **基础单位总量** | 100,000,000,000,000,000 cinatoken |

---

## 💰 代币单位体系

| 单位 | 指数 | 换算 | 说明 |
|------|------|------|------|
| **cinatoken** | 10^0 | 1 | 基础单位 |
| **uCINATOKEN** | 10^3 | 1,000 cinatoken | 微单位 |
| **mCINATOKEN** | 10^6 | 1,000,000 cinatoken | 毫单位 |
| **CINATOKEN** | 10^9 | 1,000,000,000 cinatoken | 主单位 |

### 换算示例

```
1 CINATOKEN   = 1,000 mCINATOKEN = 1,000,000 uCINATOKEN = 1,000,000,000 cinatoken
1 mCINATOKEN  = 1,000 uCINATOKEN = 1,000,000 cinatoken
1 uCINATOKEN  = 1,000 cinatoken
```

---

## 📊 创世分配

| 地址 | 余额 (CINATOKEN) | 余额 (cinatoken) | 占比 |
|------|------------------|------------------|------|
| `cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp` | 100,000,000 | 100,000,000,000,000,000 | 100% |

---

## ⛽ Gas 费配置

```toml
minimum-gas-prices = "0.025cinatoken"
```

### 典型交易费用

| 交易类型 | Gas | 费用 (cinatoken) | 费用 (uCINATOKEN) |
|----------|-----|------------------|-------------------|
| 简单转账 | ~50,000 | 1,250 | 1.25 uCINATOKEN |
| 质押委托 | ~150,000 | 3,750 | 3.75 uCINATOKEN |
| 治理投票 | ~100,000 | 2,500 | 2.5 uCINATOKEN |

---

## 🏦 铸币机制

| 参数 | 值 | 说明 |
|------|-----|------|
| **铸币 Denom** | cinatoken | 增发代币 |
| **通胀率** | **0%** | 无增发 |
| **总供应量** | 固定 1 亿 | 通缩模型 |

---

## 📁 已修改文件

1. `/home/cina/.cina/config/genesis.json`
   - 所有 `cinacoin` → `cinatoken`
   - 更新代币元数据

2. `/home/cina/.cina/config/app.toml`
   - gas 价格：`0.025cinatoken`

### 备份文件

- `genesis.json.backup.cinatoken.20260328_xxxxxx`

---

## 🔍 验证命令

```bash
# 查询余额
./cinad query bank balances cosmos1psvqlxd0e4zfxhqmuhg3venykrrmzlf5qz0rrp \
  --home /home/cina/.cina

# 查询代币元数据
./cinad query bank denoms_metadata --home /home/cina/.cina

# 查询铸币参数
./cinad query mint params --home /home/cina/.cina
```

---

## 📝 使用示例

```bash
# 发送 100 CINATOKEN
./cinad tx bank send alice bob 100000000000cinatoken \
  --chain-id cina \
  --fees 1250cinatoken \
  -y

# 发送 1 mCINATOKEN
./cinad tx bank send alice bob 1000000cinatoken \
  --chain-id cina \
  -y

# 质押 10,000 CINATOKEN
./cinad tx staking delegate <validator> 10000000000000cinatoken \
  --from alice \
  --chain-id cina \
  -y
```

---

## ✅ 节点状态

- ✅ 节点运行正常
- ✅ 代币名称：CINATOKEN
- ✅ 总供应量：100,000,000 CINATOKEN
- ✅ Gas 价格：0.025cinatoken
- ✅ 通胀率：0% (无增发)

---

_代币名称更新完成！Cina Chain 现在使用 CINATOKEN 作为原生代币。_

# QQBot 通知配置完成

> **配置日期**: 2026-04-04  
> **记忆系统版本**: v3.1.0

---

## ✅ 已完成的配置

### 1. 通知配置文件
**位置**: `/home/cina/.openclaw/workspace/.memory-notify-config.json`

```json
{
  "enabled": true,
  "channels": ["log", "qqbot"],
  "min_heat_threshold": 5,
  "notify_on": {
    "create": true,
    "update": false,
    "merge": true,
    "weekly": true
  },
  "quiet_hours": {
    "start": "23:00",
    "end": "08:00"
  }
}
```

### 2. 通知脚本
**位置**: `/home/cina/.npm-global/lib/node_modules/openclaw/skills/memory-system/scripts/memory-notify.sh`

**支持的通知类型**:
- ✅ `create` - 新记忆创建
- ❌ `update` - 记忆更新（已禁用）
- ✅ `merge` - 记忆合并
- ✅ `weekly` - 周度摘要

### 3. 通知队列机制
**工作原理**:
1. 通知触发时，消息写入队列文件
2. 心跳检查时读取队列并发送
3. 发送后移动到已发送归档

**队列文件**:
- 待发送：`workspace/logs/notifications-queue.md`
- 已发送：`workspace/logs/notifications-sent.md`

### 4. 心跳检查脚本
**位置**: `/home/cina/.npm-global/lib/node_modules/openclaw/skills/memory-system/scripts/heartbeat-check.sh`

**使用方法**:
```bash
bash scripts/heartbeat-check.sh
```

**输出**:
- 有通知时：输出通知内容并清空队列
- 无通知时：输出 `HEARTBEAT_OK`

### 5. 安静时间设置
**时间**: 23:00 - 08:00 (UTC)

在安静时间内，通知会被放入队列而不是立即发送，避免打扰用户休息。

---

## 📋 通知格式示例

```
🧠 记忆系统通知

【🆕 新记忆创建】

**新记忆已创建**

📁 文件：`test.md`
🏷️ 类型：user
🔥 热度：1
📝 摘要：测试记忆创建

时间：2026-04-04 02:25
---
OpenClaw Memory System
```

---

## 🔧 管理命令

### 测试通知
```bash
# 测试创建通知
bash scripts/memory-notify.sh create "/path/to/file.md" "user" "测试摘要"

# 测试周度摘要
bash scripts/memory-notify.sh weekly

# 手动发送队列
bash scripts/send-queued-notifications.sh
```

### 查看通知状态
```bash
# 查看待发送队列
cat workspace/logs/notifications-queue.md

# 查看已发送历史
cat workspace/logs/notifications-sent.md

# 查看通知日志
tail -20 workspace/logs/memory-notify.log
```

### 修改配置
```bash
# 编辑通知配置
nano ~/.openclaw/workspace/.memory-notify-config.json

# 禁用安静时间（24 小时通知）
# 修改 quiet_hours 为 "start": "00:00", "end": "00:00"
```

---

## 🔄 自动化流程

### Cron 触发（周度摘要）
```
周一 09:00 UTC → memory-notify.sh weekly → 队列文件 → 心跳检查 → QQBot 发送
```

### 事件触发（记忆创建/合并）
```
记忆事件 → memory-notify.sh → 队列文件 → 下次心跳 → QQBot 发送
```

---

## ⚠️ 注意事项

1. **安静时间**: 23:00-08:00 UTC 的通知会延迟发送
2. **队列清理**: 发送后自动移动到已发送归档
3. **日志保留**: 所有通知操作记录在 `memory-notify.log`
4. **权限**: 确保脚本有执行权限 (`chmod +x`)

---

## 🐛 故障排除

### 通知未发送
1. 检查配置：`cat .memory-notify-config.json | jq '.enabled'`
2. 查看队列：`cat logs/notifications-queue.md`
3. 检查日志：`tail logs/memory-notify.log`

### 安静时间问题
- 修改 `.memory-notify-config.json` 中的 `quiet_hours`
- 或手动发送队列：`bash scripts/send-queued-notifications.sh`

### 格式错误
- 确保 jq 已安装：`which jq`
- 检查配置文件 JSON 格式：`jq . .memory-notify-config.json`

---

*配置完成 - 2026-04-04*

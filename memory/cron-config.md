# Cron 自动化配置记录

> **配置日期**: 2026-04-04  
> **记忆系统版本**: v3.1.0  
> **时区**: UTC (系统时区)

---

## ✅ 已配置的 Cron 任务

```bash
# 查看当前配置
crontab -l
```

### 每日任务

| 时间 (UTC) | 任务 | 脚本 | 日志 |
|-----------|------|------|------|
| **02:00** | 加密备份 | `memory-backup.sh full` | `logs/memory-backup.log` |
| **04:00** | Frontmatter 标准化 | `update-scene-frontmatter.sh` | `logs/scene-update.log` |
| **每小时** | 健康检查 | `test MEMORY.md` | `logs/memory-health.log` |

### 每周任务

| 时间 (UTC) | 任务 | 脚本 | 日志 |
|-----------|------|------|------|
| **周日 03:00** | 热度衰减 + 排名 | `manage-heat.sh auto` | `logs/heat-auto.log` |
| **周一 09:00** | 周度摘要通知 | `memory-notify.sh weekly` | `logs/memory-weekly.log` |

### 每月任务

| 时间 (UTC) | 任务 | 脚本 | 日志 |
|-----------|------|------|------|
| **1 号 05:00** | 记忆清理 | `memory-backup.sh cleanup` | `logs/memory-cleanup.log` |

---

## 🔧 环境变量

已配置 `MEMORY_BACKUP_PASSWORD` 到 `~/.bashrc`：
```bash
export MEMORY_BACKUP_PASSWORD="SF/JifPcaZrbMzuJl8OCiczXWERWX/xXe5eFImdzaXc="
```

---

## 📊 测试结果

### ✅ 备份状态测试
```bash
bash scripts/memory-backup.sh status
```
**结果**: 正常 - 加密启用，本地备份启用

### ✅ 热度统计测试
```bash
bash scripts/manage-heat.sh stats
```
**结果**: 正常 - 当前无记忆文件（0 文件，0 热度）

### ⚠️ 通知测试
```bash
bash scripts/memory-notify.sh test
```
**结果**: 通知功能正常，但配置为禁用状态（需要启用）

---

## 📝 待办事项

- [ ] 启用 QQBot 通知（修改 `.memory-notify-config.json`）
- [ ] 创建初始记忆文件以测试热度系统
- [ ] 配置 GitHub/WebDAV 远程备份（可选）
- [ ] 设置 Dashboard 服务（可选）

---

## 🔍 常用命令

```bash
# 查看 Cron 配置
crontab -l

# 编辑 Cron 配置
crontab -e

# 查看备份日志
tail -20 /home/cina/.openclaw/workspace/logs/memory-backup.log

# 查看健康检查
tail -50 /home/cina/.openclaw/workspace/logs/memory-health.log

# 手动执行备份
bash /home/cina/.npm-global/lib/node_modules/openclaw/skills/memory-system/scripts/memory-backup.sh full

# 手动执行热度衰减
bash /home/cina/.npm-global/lib/node_modules/openclaw/skills/memory-system/scripts/manage-heat.sh auto

# 手动执行周度摘要
bash /home/cina/.npm-global/lib/node_modules/openclaw/skills/memory-system/scripts/memory-notify.sh weekly
```

---

## 📁 文件位置

```
/home/cina/.openclaw/
├── workspace/
│   ├── MEMORY.md                     # 长期记忆索引
│   ├── .memory-config.json           # 记忆系统配置
│   ├── .memory-notify-config.json    # 通知配置
│   ├── .memory-backup-config.json    # 备份配置
│   ├── memory/                       # 工作记忆目录
│   │   ├── YYYY-MM-DD.md            # 每日日志
│   │   ├── longterm/                # 长期记忆
│   │   ├── shortterm/               # 待审查记忆
│   │   └── working/                 # 临时任务
│   ├── logs/                         # Cron 日志
│   │   ├── memory-backup.log
│   │   ├── memory-health.log
│   │   ├── heat-auto.log
│   │   ├── memory-weekly.log
│   │   ├── scene-update.log
│   │   └── memory-cleanup.log
│   └── .backups/memory/              # 备份文件
└── memory-tdai/
    └── scene_blocks/                 # 场景记忆
```

---

*配置完成 - 2026-04-04*

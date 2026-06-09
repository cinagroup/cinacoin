# Discord Server Setup Guide

This guide walks through setting up the Cinacoin Discord server.

## 1. Server Creation

1. Click **"+"** in the Discord server list → **Create My Own** → **For a community**
2. Name: **Cinacoin**
3. Upload a server icon (recommended: project logo, 512×512 PNG)

## 2. Channel Structure

### 📌 Information

| Channel | Purpose | Permissions |
|---------|---------|-------------|
| `#welcome` | New member greetings + server rules | Read-only for @everyone; write for mods |
| `#announcements` | Official project updates, releases | Read-only for @everyone; write for admins/mods |
| `#rules` | Code of Conduct + community guidelines | Read-only |

### 💬 Community

| Channel | Purpose |
|---------|---------|
| `#general` | Casual conversation, introductions |
| `#support` | User help, integration questions |
| `#showcase` | Community projects built with Cinacoin |
| `#off-topic` | Non-project chat |

### 🔧 Development

| Channel | Purpose |
|---------|---------|
| `#dev` | Architecture discussions, PR reviews, roadmap |
| `#contributing` | Help for first-time contributors |
| `#code-review` | Peer review coordination |
| `#testing` | Test reports, bug triage |

### 🔗 Integrations

| Channel | Purpose |
|---------|---------|
| `#github` | Automated GitHub notifications (PRs, issues, releases) |
| `#ci-status` | CI/CD build and deployment notifications |

## 3. Role Assignments

| Role | Color | Permissions | Assignment |
|------|-------|-------------|------------|
| 🔴 **Admin** | Red | Full server management | Project leads |
| 🟠 **Moderator** | Orange | Manage messages, timeouts, kicks | Trusted community members |
| 🟢 **Core Dev** | Green | Special channel access | Active contributors |
| 🔵 **Contributor** | Blue | — | Anyone with merged PRs |
| ⚪ **Member** | Default | Standard access | All verified members |
| 🟡 **Bot** | Yellow | Bot-specific permissions | Automated accounts |

## 4. Bot Integrations

### GitHub Bot

1. Install **GitHub integration** from Discord App Directory
2. Connect your GitHub repository
3. Configure webhooks for:
   - Pull requests opened/merged
   - Issues opened/closed
   - New releases
   - Discussion activity
4. Route notifications to `#github`

### CI/CD Status Bot

1. Set up a **webhook channel** in Discord (`#ci-status`)
2. Configure your CI provider (GitHub Actions, etc.) to POST to the webhook URL on:
   - Workflow start/failure/success
   - Deployment events
3. Use a format like:
   ```
   🟢 BUILD PASSED — onux#main
   🔴 BUILD FAILED — onux#feature/x (commit abc1234)
   🚀 DEPLOYED — v1.2.0 to production
   ```

### Recommended Bots

| Bot | Purpose |
|-----|---------|
| **MEE6** or **Carl-bot** | Auto-moderation, welcome messages, role assignment |
| **Dyno** | Moderation, logging, custom commands |
| **Statbot** | Server analytics |

## 5. Moderation Guidelines

### Auto-Moderation Rules

- Block invite links to other Discord servers
- Filter common spam patterns
- Rate-limit: max 5 messages in 10 seconds per user

### Human Moderation

- **Warnings first** — give users a chance to correct behavior
- **Timeouts** for repeat offenders (1h → 24h → 1 week)
- **Bans** for severe violations (hate speech, doxxing, threats)
- **Log all actions** in a private `#mod-log` channel

### Verification

- Enable Discord's **Membership Screening** for new members
- Require email-verified accounts
- Consider a simple verification bot for anti-spam

## 6. Next Steps

- [ ] Create the server
- [ ] Set up channels and roles
- [ ] Configure bots and webhooks
- [ ] Write and pin server rules in `#rules`
- [ ] Create a permanent invite link
- [ ] Update `docs/community/README.md` with the real invite URL
- [ ] Announce in existing channels (Telegram, GitHub, social media)

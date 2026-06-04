# Telegram Group Setup Guide

This guide walks through setting up the Cinacoin Telegram presence.

## 1. Group vs Channel

| Type | Purpose | Recommended |
|------|---------|-------------|
| **Channel** | One-way announcements, releases, news | ✅ `@CinacoinOfficial` |
| **Group** | Two-way discussion, support, community chat | ✅ `@CinacoinCommunity` |

Use both — channel for broadcast, group for conversation. Link the channel to the group so posts auto-forward.

## 2. Setup Steps

### Channel (Announcements)

1. Open Telegram → **New Channel**
2. Name: **Cinacoin**
3. Handle: `@CinacoinOfficial` (or similar)
4. Type: **Public**
5. Description: "Official announcements for the Cinacoin project. For discussion, join @CinacoinCommunity"
6. Add a profile picture (project logo)

### Group (Community Chat)

1. Open Telegram → **New Group**
2. Name: **Cinacoin Community**
3. Handle: `@CinacoinCommunity` (or similar)
4. Type: **Public**
5. Description: "Community discussions, support, and dev chat for Cinacoin. Announcements at @CinacoinOfficial"
6. Link your announcement channel (Settings → Discussion → select channel)

## 3. Group Settings

### Permissions

| Setting | Recommendation |
|---------|---------------|
| Send messages | All members |
| Send media | All members |
| Send polls | All members |
| Add members | All members |
| Pin messages | Admins only |
| Change group info | Admins only |

### Slow Mode

- Enable **Slow Mode** (30 seconds) to reduce spam during active discussions
- Increase during peak hours if needed

## 4. Admin & Moderator Roles

| Role | Responsibilities |
|------|-----------------|
| **Owner** | Full control, transfer if needed |
| **Admin** | Delete messages, ban users, pin messages, change settings |
| **Moderator** | Delete messages, restrict/ban users |

Appoint at least 2 admins for redundancy.

## 5. Bots

### Recommended Bots

| Bot | Purpose |
|-----|---------|
| **@GroupHelpBot** | Auto-moderation, welcome messages, rules |
| **@Combot** | Anti-spam, moderation stats, custom commands |
| **@Rose** | Anti-flood, bans, warns, notes, filters |
| **@GitHubBot** | Link GitHub issues/PRs when referenced |

### Configuration Tips

- Set up **welcome messages** with links to docs and Discord
- Enable **anti-spam** and **anti-flood** protection
- Add a `/rules` command that posts community guidelines
- Configure **caps lock filtering** and **link restrictions**

## 6. Linking & Cross-Promotion

- Post the Telegram links in:
  - Discord `#announcements` and `#welcome`
  - GitHub README community section
  - Project website
  - Social media profiles
- Pin a message in the group with:
  - Links to docs, Discord, GitHub
  - Brief community guidelines
  - FAQ pointer

## 7. Next Steps

- [ ] Create the channel and group
- [ ] Configure permissions and slow mode
- [ ] Add moderator bots
- [ ] Write and pin welcome/rules message
- [ ] Link channel to group
- [ ] Cross-post links to Discord and GitHub
- [ ] Update `docs/community/README.md` with the real Telegram URL
- [ ] Announce launch

import type { TelegramUser } from '@cinacoin/telegram-miniapp';

interface TelegramHeaderProps {
  user: TelegramUser | null;
  account: string | null;
}

export default function TelegramHeader({ user, account }: TelegramHeaderProps) {
  const displayName = user
    ? user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name
    : 'Guest';

  const avatarUrl = user?.photo_url;
  const isPremium = user?.is_premium;

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : null;

  return (
    <header className="telegram-header">
      <div className="header-left">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="header-avatar" />
        ) : (
          <div className="header-avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="header-info">
          <div className="header-name">
            {displayName}
            {isPremium && <span className="premium-badge">⭐</span>}
          </div>
          {user?.username && (
            <div className="header-username">@{user.username}</div>
          )}
        </div>
      </div>
      <div className="header-right">
        {shortAddress && (
          <div className="header-address" title={account ?? undefined}>
            {shortAddress}
          </div>
        )}
      </div>
    </header>
  );
}

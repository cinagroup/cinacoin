import type { TelegramUser } from '@cinacoin/telegram-miniapp';
import { Star } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

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

  const shortAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : null;

  return (
    <header className="telegram-header" role="banner">
      <div className="header-left">
        {avatarUrl ? (
          <img src={avatarUrl} alt={`${displayName}'s avatar`} className="header-avatar" />
        ) : (
          <div className="header-avatar-placeholder" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="header-info">
          <div className="header-name">
            {displayName}
            {isPremium && (
              <Star
                className="w-3 h-3 text-[var(--cc-warning)] fill-[var(--cc-warning)]"
                aria-hidden="true"
              />
            )}
          </div>
          {user?.username && <div className="header-username">@{user.username}</div>}
        </div>
      </div>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ThemeToggle />
        <LanguageToggle />
        {shortAddress && (
          <div
            className="header-address"
            title={account ?? undefined}
            aria-label={`Wallet address: ${account}`}
          >
            {shortAddress}
          </div>
        )}
      </div>
    </header>
  );
}

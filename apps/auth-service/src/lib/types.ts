export interface User {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  avatar_url?: string;
  mfa_enabled: number;
  mfa_secret?: string;
  created_at: number;
  updated_at: number;
}

export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  access_token?: string;
  refresh_token?: string;
  created_at: number;
}

export interface Session {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: number;
  created_at: number;
}

export interface UserSettings {
  user_id: string;
  theme: 'dark' | 'light';
  locale: 'en' | 'zh' | 'ja';
  notifications_enabled: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

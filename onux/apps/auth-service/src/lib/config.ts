/**
 * Configuration for the Auth Service
 * All sensitive values come from environment variables
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface AuthConfig {
  database: {
    url: string;
    poolMin: number;
    poolMax: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
  cors: {
    origin: string;
  };
  oauth: {
    google: OAuthProviderConfig;
    github: OAuthProviderConfig;
    discord: OAuthProviderConfig;
    redirectBaseUrl: string;
    stateExpiryMinutes: number;
  };
}

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${raw}`);
  }
  return parsed;
}

export function loadConfig(): AuthConfig {
  const oauthRedirectBase = getEnv('OAUTH_REDIRECT_BASE_URL', 'http://localhost:3200/api/auth/oauth');

  return {
    database: {
      url: getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/cinacoin_auth'),
      poolMin: getEnvNumber('DATABASE_POOL_MIN', 2),
      poolMax: getEnvNumber('DATABASE_POOL_MAX', 10),
    },
    jwt: {
      secret: getEnv('JWT_SECRET', 'dev-jwt-secret-do-not-use-in-production'),
      expiresIn: getEnv('JWT_EXPIRES_IN', '15m'),
      refreshSecret: getEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-do-not-use-in-production'),
      refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    },
    server: {
      port: getEnvNumber('PORT', 3200),
      nodeEnv: getEnv('NODE_ENV', 'development'),
    },
    cors: {
      origin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
    },
    oauth: {
      google: {
        clientId: getEnv('GOOGLE_CLIENT_ID', ''),
        clientSecret: getEnv('GOOGLE_CLIENT_SECRET', ''),
        redirectUri: `${oauthRedirectBase}/google/callback`,
      },
      github: {
        clientId: getEnv('GITHUB_CLIENT_ID', ''),
        clientSecret: getEnv('GITHUB_CLIENT_SECRET', ''),
        redirectUri: `${oauthRedirectBase}/github/callback`,
      },
      discord: {
        clientId: getEnv('DISCORD_CLIENT_ID', ''),
        clientSecret: getEnv('DISCORD_CLIENT_SECRET', ''),
        redirectUri: `${oauthRedirectBase}/discord/callback`,
      },
      redirectBaseUrl: oauthRedirectBase,
      stateExpiryMinutes: getEnvNumber('OAUTH_STATE_EXPIRY_MINUTES', 10),
    },
  };
}

/** Singleton config instance */
let _config: AuthConfig | null = null;

export function getConfig(): AuthConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

/** Reset config (for testing) */
export function resetConfig(): void {
  _config = null;
}

/**
 * User Service Configuration
 */

export interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
    maxConnections: number;
  };
  services: {
    authServiceUrl: string;
    apiGatewayUrl: string;
  };
  security: {
    serviceApiKey: string;
  };
  cloudflare: {
    accountId?: string;
    queueName?: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

export function createConfig(): Config {
  const port = parseInt(process.env.PORT || '3201', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    port,
    nodeEnv,
    database: {
      url: databaseUrl,
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    },
    services: {
      authServiceUrl: process.env.AUTH_SERVICE_URL || 'https://auth.cinacoin.com',
      apiGatewayUrl: process.env.API_GATEWAY_URL || 'https://api.cinacoin.com',
    },
    security: {
      serviceApiKey: process.env.SERVICE_API_KEY || 'dev-key-change-in-prod',
    },
    cloudflare: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      queueName: process.env.CLOUDFLARE_QUEUE_NAME,
    },
    logging: {
      level: (process.env.LOG_LEVEL as Config['logging']['level']) || 'info',
    },
  };
}

export const config = createConfig();

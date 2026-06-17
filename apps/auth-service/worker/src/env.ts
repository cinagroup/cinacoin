export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  CORS_ORIGINS?: string; // Comma-separated list of allowed origins
  NODE_ENV?: string;
}

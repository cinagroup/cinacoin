// Cloudflare Workers D1 数据库绑定
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
}

export function getDatabase(env: Env) {
  return env.DB;
}

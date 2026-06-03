export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  API_SECRET: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_address: string;
  chain_ids: string;
  redirect_uris: string;
  icon_url: string;
  website_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  project_id: string;
  key_hash: string;
  label: string;
  permissions: string;
  is_active: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface UsageStat {
  id: string;
  project_id: string;
  api_key_id: string | null;
  endpoint: string;
  request_count: number;
  error_count: number;
  date: string;
}

export interface UsageSummary {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  dailyStats: UsageStat[];
  dateRange: {
    start: string;
    end: string;
  };
}

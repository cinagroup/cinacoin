// Shared types for Cloud Dashboard

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_address?: string;
  chain_ids?: string[];
  redirect_uris?: string[];
  icon_url?: string;
  website_url?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  projectId: string;
  keyHash: string;
  name: string;
  permissions: string[];
  prefix: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string;
  settings?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface GenerateApiKeyInput {
  name?: string;
  permissions?: string[];
  expiresAt?: string;
}

export interface ApiKeyWithPlain extends ApiKey {
  plainKey: string;
}

// Auth Types
export type OAuthProvider = "github" | "google" | "discord";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: User;
  requires2FA?: boolean;
  twoFactorToken?: string;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface TwoFactorVerifyResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface UsageStats {
  totalRequests: number;
  totalErrors: number;
  avgLatency: number;
  dailyData: { date: string; requests: number; errors: number }[];
}

/**
 * User Service Client
 * 
 * Client library for other services to communicate with user-service.
 * Supports both REST and event-driven communication patterns.
 */
import { createLogger } from './logger.js';

const logger = createLogger('user-service-client');

export interface UserServiceClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface UserResponse {
  id: string;
  externalId: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamResponse {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberResponse {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

export class UserServiceClient {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;
  private retries: number;
  private retryDelayMs: number;

  constructor(config: UserServiceClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs || 5000;
    this.retries = config.retries || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Service-API-Key': this.apiKey,
      'X-Request-ID': crypto.randomUUID(),
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          method,
          headers: this.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorBody}`);
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Request failed (attempt ${attempt}/${this.retries})`, {
          method,
          url,
          error: lastError.message,
        });

        if (attempt < this.retries) {
          // Exponential backoff with jitter
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  // ============================================================================
  // User Methods
  // ============================================================================

  async getUser(userId: string): Promise<UserResponse> {
    const result = await this.request<{ success: true; data: UserResponse }>(
      'GET',
      `/api/users/${userId}`
    );
    return result.data;
  }

  async getUserByEmail(email: string): Promise<UserResponse | null> {
    try {
      const result = await this.request<{ success: true; data: UserResponse[] }>(
        'GET',
        `/api/users?email=${encodeURIComponent(email)}`
      );
      return result.data[0] || null;
    } catch {
      return null;
    }
  }

  async createUser(params: {
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<UserResponse> {
    const result = await this.request<{ success: true; data: UserResponse }>(
      'POST',
      '/api/users',
      params
    );
    return result.data;
  }

  async updateUser(userId: string, params: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    status?: string;
  }): Promise<UserResponse> {
    const result = await this.request<{ success: true; data: UserResponse }>(
      'PUT',
      `/api/users/${userId}`,
      params
    );
    return result.data;
  }

  // ============================================================================
  // Team Methods
  // ============================================================================

  async getTeam(teamId: string): Promise<TeamResponse> {
    const result = await this.request<{ success: true; data: TeamResponse }>(
      'GET',
      `/api/teams/${teamId}`
    );
    return result.data;
  }

  async getUserTeams(userId: string): Promise<TeamResponse[]> {
    const result = await this.request<{ success: true; data: TeamResponse[] }>(
      'GET',
      `/api/users/${userId}/teams`
    );
    return result.data;
  }

  async createTeam(params: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<TeamResponse> {
    const result = await this.request<{ success: true; data: TeamResponse }>(
      'POST',
      '/api/teams',
      params
    );
    return result.data;
  }

  async addTeamMember(teamId: string, userId: string, role: string = 'member'): Promise<TeamMemberResponse> {
    const result = await this.request<{ success: true; data: TeamMemberResponse }>(
      'POST',
      `/api/teams/${teamId}/members`,
      { userId, role }
    );
    return result.data;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await this.request<{ success: true }>(
      'DELETE',
      `/api/teams/${teamId}/members/${userId}`
    );
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  async healthCheck(): Promise<{ status: string; database: string }> {
    return this.request('GET', '/api/health');
  }
}

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly resetTimeoutMs: number;

  constructor(threshold = 5, resetTimeoutMs = 30000) {
    this.threshold = threshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }
}

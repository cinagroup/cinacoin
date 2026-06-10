const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cinacoin.com';
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.cinacoin.com';

interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  mfaRequired?: boolean;
  mfaSetupRequired?: boolean;
  mfaToken?: string;
  mfaTokenExpiresIn?: number;
  message?: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private csrfToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.csrfToken = localStorage.getItem('csrfToken');
    }
  }

  private async getCsrfToken(): Promise<string> {
    if (this.csrfToken) return this.csrfToken;

    const response = await fetch(`${AUTH_URL}/auth/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    this.csrfToken = data.csrfToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('csrfToken', data.csrfToken);
    }
    return data.csrfToken;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add CSRF token for state-changing requests
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = await this.getCsrfToken();
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return this.request(url, options);
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${AUTH_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.accessToken = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${AUTH_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data: LoginResponse = await response.json();

    if (!response.ok) {
      const errorData = data as Record<string, unknown>;
      throw new Error((errorData.error as string) || 'Login failed');
    }

    // If MFA is required, don't store tokens yet
    if (data.mfaRequired) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mfaToken', data.mfaToken || '');
      }
      return data;
    }

    // Store tokens
    this.accessToken = data.accessToken || null;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken || '');
      localStorage.setItem('refreshToken', data.refreshToken || '');
      localStorage.removeItem('mfaToken');
    }

    return data;
  }

  async register(email: string, username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${AUTH_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
      credentials: 'include',
    });

    const data: LoginResponse = await response.json();

    if (!response.ok) {
      const errorData = data as Record<string, unknown>;
      throw new Error((errorData.error as string) || 'Registration failed');
    }

    // If MFA setup is required
    if (data.mfaRequired || data.mfaSetupRequired) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mfaToken', data.mfaToken || '');
      }
      return data;
    }

    this.accessToken = data.accessToken || null;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken || '');
      localStorage.setItem('refreshToken', data.refreshToken || '');
    }

    return data;
  }

  // 2FA methods
  async setupTotp(mfaToken: string) {
    const response = await fetch(`${AUTH_URL}/auth/mfa/setup/totp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MFA-Token': mfaToken,
      },
      credentials: 'include',
    });
    return response.json();
  }

  async verifyTotp(mfaToken: string, code: string) {
    const response = await fetch(`${AUTH_URL}/auth/mfa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MFA-Token': mfaToken,
      },
      body: JSON.stringify({ code }),
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok && data.accessToken) {
      this.accessToken = data.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.removeItem('mfaToken');
      }
    }

    return data;
  }

  async logout() {
    try {
      await fetch(`${AUTH_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        credentials: 'include',
      });
    } catch {}

    this.accessToken = null;
    this.csrfToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('csrfToken');
      localStorage.removeItem('mfaToken');
    }
  }

  async getMe() {
    return this.request<any>(`${AUTH_URL}/auth/me`);
  }

  // OAuth
  getOAuthUrl(provider: string, returnUrl?: string) {
    const url = `${AUTH_URL}/auth/oauth/${provider}`;
    return returnUrl ? `${url}?return_url=${encodeURIComponent(returnUrl)}` : url;
  }

  async exchangeOAuthCode(code: string) {
    const response = await fetch(`${AUTH_URL}/auth/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      credentials: 'include',
    });

    const data = await response.json();
    if (response.ok && data.data?.accessToken) {
      this.accessToken = data.data.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
    }
    return data;
  }

  // Users
  async getUsers() {
    return this.request<any>(`${API_URL}/users`);
  }

  async getUser(id: string) {
    return this.request<any>(`${API_URL}/users/${id}`);
  }

  // Teams
  async getTeams() {
    return this.request<any>(`${API_URL}/teams`);
  }

  async createTeam(name: string) {
    return this.request<any>(`${API_URL}/teams`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Sessions
  async getSessions() {
    return this.request<any>(`${AUTH_URL}/auth/sessions`);
  }

  async revokeSession(sessionId: string) {
    return this.request<any>(`${AUTH_URL}/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async revokeAllOtherSessions() {
    return this.request<any>(`${AUTH_URL}/auth/sessions`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

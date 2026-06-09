/**
 * OAuth Flow Tests
 * Tests for OAuth 2.0 social login functionality
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateState,
  generateCodeVerifier,
  storeOAuthState,
  validateAndConsumeState,
} from '../src/lib/oauth/state.js';
import {
  isProviderConfigured,
  getAvailableProviders,
} from '../src/lib/oauth/providers.js';
import {
  findOAuthAccount,
  createOAuthAccount,
  updateOAuthAccount,
  deleteOAuthAccount,
  countOAuthAccounts,
} from '../src/db/oauth-accounts.js';
import { resetConfig } from '../src/lib/config.js';

// Mock database
vi.mock('../src/db/pool.js', () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

describe('OAuth State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConfig();
  });

  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state = generateState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique states', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });
  });

  describe('generateCodeVerifier', () => {
    it('should generate a PKCE code verifier', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeDefined();
      expect(typeof verifier).toBe('string');
      expect(verifier.length).toBeGreaterThan(0);
    });

    it('should generate unique verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('storeOAuthState', () => {
    it('should store state in database', async () => {
      const { query } = await import('../src/db/pool.js');
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await storeOAuthState({
        provider: 'google',
        state: 'test-state',
        codeVerifier: 'test-verifier',
        redirectUri: 'http://localhost:3000/callback',
      });

      expect(query).toHaveBeenCalledTimes(1);
      expect(vi.mocked(query).mock.calls[0][0]).toContain('INSERT INTO oauth_states');
    });
  });

  describe('validateAndConsumeState', () => {
    it('should validate and consume state', async () => {
      const { query } = await import('../src/db/pool.js');
      const mockState = {
        id: 'test-id',
        state: 'test-state',
        provider: 'google',
        code_verifier: 'test-verifier',
        expires_at: new Date(Date.now() + 600000).toISOString(),
      };
      vi.mocked(query).mockResolvedValue({ rows: [mockState], rowCount: 1 } as any);

      const result = await validateAndConsumeState('test-state', 'google');

      expect(result).toBeDefined();
      expect(result?.state).toBe('test-state');
      expect(result?.provider).toBe('google');
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('should return null for invalid state', async () => {
      const { query } = await import('../src/db/pool.js');
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await validateAndConsumeState('invalid-state', 'google');

      expect(result).toBeNull();
    });
  });
});

describe('OAuth Provider Configuration', () => {
  beforeEach(() => {
    resetConfig();
  });

  describe('isProviderConfigured', () => {
    it('should return false when provider is not configured', () => {
      const result = isProviderConfigured('google');
      expect(result).toBe(false);
    });

    it('should return true when provider is configured', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      resetConfig();

      const result = isProviderConfigured('google');
      expect(result).toBe(true);

      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
    });
  });

  describe('getAvailableProviders', () => {
    it('should return empty array when no providers configured', () => {
      const result = getAvailableProviders();
      expect(result).toEqual([]);
    });

    it('should return configured providers', () => {
      process.env.GITHUB_CLIENT_ID = 'test-id';
      process.env.GITHUB_CLIENT_SECRET = 'test-secret';
      resetConfig();

      const result = getAvailableProviders();
      expect(result).toContain('github');
      expect(result).not.toContain('google');
      expect(result).not.toContain('discord');

      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;
    });
  });
});

describe('OAuth Accounts Data Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findOAuthAccount', () => {
    it('should find OAuth account by provider and user ID', async () => {
      const { query } = await import('../src/db/pool.js');
      const mockAccount = {
        id: 'test-id',
        user_id: 'user-id',
        provider: 'google',
        provider_user_id: 'google-123',
      };
      vi.mocked(query).mockResolvedValue({ rows: [mockAccount], rowCount: 1 } as any);

      const result = await findOAuthAccount('google', 'google-123');

      expect(result).toBeDefined();
      expect(result?.provider).toBe('google');
      expect(result?.provider_user_id).toBe('google-123');
    });

    it('should return null when account not found', async () => {
      const { query } = await import('../src/db/pool.js');
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await findOAuthAccount('google', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createOAuthAccount', () => {
    it('should create new OAuth account', async () => {
      const { query } = await import('../src/db/pool.js');
      const mockAccount = {
        id: 'new-id',
        user_id: 'user-id',
        provider: 'github',
        provider_user_id: 'github-456',
      };
      vi.mocked(query).mockResolvedValue({ rows: [mockAccount], rowCount: 1 } as any);

      const result = await createOAuthAccount({
        userId: 'user-id',
        provider: 'github',
        providerUserId: 'github-456',
        providerEmail: 'test@example.com',
      });

      expect(result).toBeDefined();
      expect(result.provider).toBe('github');
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateOAuthAccount', () => {
    it('should update OAuth account tokens', async () => {
      const { query } = await import('../src/db/pool.js');
      const mockAccount = {
        id: 'test-id',
        access_token: 'new-token',
      };
      vi.mocked(query).mockResolvedValue({ rows: [mockAccount], rowCount: 1 } as any);

      const result = await updateOAuthAccount('test-id', {
        accessToken: 'new-token',
      });

      expect(result).toBeDefined();
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteOAuthAccount', () => {
    it('should delete OAuth account', async () => {
      const { query } = await import('../src/db/pool.js');
      vi.mocked(query).mockResolvedValue({ rowCount: 1 } as any);

      const result = await deleteOAuthAccount('test-id', 'user-id');

      expect(result).toBe(true);
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('should return false when account not found', async () => {
      const { query } = await import('../src/db/pool.js');
      vi.mocked(query).mockResolvedValue({ rowCount: 0 } as any);

      const result = await deleteOAuthAccount('nonexistent', 'user-id');

      expect(result).toBe(false);
    });
  });

  describe('countOAuthAccounts', () => {
    it('should count user OAuth accounts', async () => {
      const { query } = await import('../src/db/pool.js');
      vi.mocked(query).mockResolvedValue({ rows: [{ count: '3' }], rowCount: 1 } as any);

      const result = await countOAuthAccounts('user-id');

      expect(result).toBe(3);
    });
  });
});

describe('OAuth Flow Integration', () => {
  it('should complete full OAuth flow: state generation → validation → account creation', async () => {
    const { query } = await import('../src/db/pool.js');

    // Step 1: Generate state
    const state = generateState();
    expect(state).toBeDefined();

    // Step 2: Store state
    vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 1 } as any);
    await storeOAuthState({
      provider: 'google',
      state,
      codeVerifier: 'test-verifier',
    });
    expect(query).toHaveBeenCalled();

    // Step 3: Validate state (simulate callback)
    const mockStateRecord = {
      id: 'state-id',
      state,
      provider: 'google',
      code_verifier: 'test-verifier',
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };
    vi.mocked(query).mockResolvedValue({ rows: [mockStateRecord], rowCount: 1 } as any);
    const validatedState = await validateAndConsumeState(state, 'google');
    expect(validatedState).toBeDefined();
    expect(validatedState?.state).toBe(state);

    // Step 4: Create OAuth account (after fetching profile from provider)
    const mockAccount = {
      id: 'account-id',
      user_id: 'user-id',
      provider: 'google',
      provider_user_id: 'google-123',
    };
    vi.mocked(query).mockResolvedValue({ rows: [mockAccount], rowCount: 1 } as any);
    const account = await createOAuthAccount({
      userId: 'user-id',
      provider: 'google',
      providerUserId: 'google-123',
      providerEmail: 'user@gmail.com',
    });
    expect(account).toBeDefined();
    expect(account.provider).toBe('google');
  });
});

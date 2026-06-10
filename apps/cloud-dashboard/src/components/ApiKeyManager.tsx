'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
} from '@/lib/api';
import type { ApiKey } from '@/types';

export function ApiKeyManager({ projectId }: { projectId: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listApiKeys(projectId);
      setKeys(list);
    } catch (e) {
      setKeys([]);
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to load API keys.'
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const generateKey = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await generateApiKey(projectId, {
        name: 'New Key',
        permissions: ['read', 'write'],
      });
      setShowNewKey(created.plainKey);
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to create API key.'
      );
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id: string) => {
    setError(null);
    try {
      await revokeApiKey(projectId, id);
      setShowNewKey('');
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to revoke API key.'
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Generate new key */}
      <div className="flex items-center gap-3">
        <button
          onClick={generateKey}
          disabled={creating}
          aria-label={creating ? 'Generating API key' : 'Generate new API key'}
          className="cc-btn-primary-sm !h-9 px-4 text-[14px] disabled:opacity-50"
        >
          {creating ? 'Generating…' : 'Generate API Key'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--cc-error)]/30 bg-[var(--cc-error-soft)]/20 p-3 text-[14px] text-[var(--cc-error)]">
          {error}
        </div>
      )}

      {/* Show newly generated key */}
      {showNewKey && (
        <div className="rounded-lg border border-[var(--cc-success)]/30 bg-[var(--cc-canvas)] p-4 shadow-[var(--cc-level1)]">
          <p className="mb-2 text-[14px] font-medium text-[var(--cc-success)]">New API Key Generated</p>
          <code className="block rounded bg-[var(--cc-canvas-soft)] px-3 py-2 text-[14px] font-[var(--font-mono)] text-[var(--cc-ink)] break-all">
            {showNewKey}
          </code>
          <p className="mt-2 text-[12px] text-[var(--cc-muted)]">Save this key now. It won&apos;t be shown again.</p>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="text-[14px] text-[var(--cc-muted)]">Loading API keys…</div>
      ) : keys.length === 0 ? (
        <div className="text-[14px] text-[var(--cc-muted)]">
          No API keys yet. Generate one to start authenticating requests.
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] p-4 transition"
            >
              <div>
                <div className="text-[14px] font-medium text-[var(--cc-ink)]">{key.name || 'Unnamed key'}</div>
                <div className="mt-1 text-[12px] text-[var(--cc-muted)]">
                  {key.permissions.join(', ')} • Created {key.createdAt.slice(0, 10)}
                  {key.expiresAt && ` • Expires ${key.expiresAt.slice(0, 10)}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => revokeKey(key.id)}
                  className="rounded-md border border-[var(--cc-error)]/20 bg-[var(--cc-error-soft)]/20 px-3 py-1 text-[12px] font-medium text-[var(--cc-error)] transition hover:bg-[var(--cc-error-soft)]/50"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

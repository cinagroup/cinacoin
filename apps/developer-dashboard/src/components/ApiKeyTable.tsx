"use client";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: "read" | "write" | "admin";
  lastUsed: string;
  createdAt: string;
  usage: number;
  status: "active" | "revoked";
}

interface ApiKeyTableProps {
  keys: ApiKey[];
  onRevoke: (id: string) => void;
  onRotate?: (id: string) => void;
  rotatingId?: string | null;
}

function PermBadge({ perm }: { perm: ApiKey["permissions"] }) {
  const map = {
    read: "badge-neutral",
    write: "badge-warning",
    admin: "badge-danger",
  };
  return (
    <span className={`badge ${map[perm]}`}>
      {perm.charAt(0).toUpperCase() + perm.slice(1)}
    </span>
  );
}

export default function ApiKeyTable({ keys, onRevoke, onRotate, rotatingId }: ApiKeyTableProps) {
  const handleCopy = (prefix: string) => {
    navigator.clipboard.writeText(prefix).catch(() => {});
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Key</th>
            <th>Permissions</th>
            <th>Usage</th>
            <th>Last Used</th>
            <th>Created</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center text-ink-mute py-8">
                No API keys yet. Generate one to get started.
              </td>
            </tr>
          ) : (
            keys.map((key) => (
              <tr key={key.id} className="hover:bg-canvas-soft transition-colors">
                <td className="font-medium text-ink">{key.name}</td>
                <td>
                  <code className="text-[12px] text-ink-body bg-canvas-soft px-2 py-1 rounded">
                    {key.prefix}
                  </code>
                </td>
                <td>
                  <PermBadge perm={key.permissions} />
                </td>
                <td className="text-ink-body text-[14px]">
                  {key.usage.toLocaleString()}
                </td>
                <td className="text-ink-mute">{key.lastUsed}</td>
                <td className="text-ink-mute">{key.createdAt}</td>
                <td>
                  <span className={`badge ${key.status === "active" ? "badge-success" : "badge-neutral"}`}>
                    {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(key.prefix)}
                      className="text-[14px] text-link hover:text-link-hover font-medium"
                      title="Copy key prefix"
                    >
                      Copy
                    </button>
                    {onRotate && (
                      <button
                        onClick={() => onRotate(key.id)}
                        disabled={rotatingId === key.id}
                        className="text-[14px] text-warning hover:text-warning/80 font-medium disabled:opacity-50"
                        title="Rotate key (generates new key, revokes old one)"
                      >
                        {rotatingId === key.id ? "Rotating..." : "Rotate"}
                      </button>
                    )}
                    <button
                      onClick={() => onRevoke(key.id)}
                      className="text-[14px] text-danger hover:underline font-medium"
                      title="Revoke this key"
                    >
                      Revoke
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

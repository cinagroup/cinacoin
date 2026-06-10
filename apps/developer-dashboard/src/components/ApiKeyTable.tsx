"use client";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: "read" | "write" | "admin";
  lastUsed: string;
  createdAt: string;
}

interface ApiKeyTableProps {
  keys: ApiKey[];
  onRevoke: (id: string) => void;
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

export default function ApiKeyTable({ keys, onRevoke }: ApiKeyTableProps) {
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
            <th>Last Used</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-ink-mute py-8">
                No API keys yet. Generate one to get started.
              </td>
            </tr>
          ) : (
            keys.map((key) => (
              <tr key={key.id} className="hover:bg-canvas-soft transition-colors">
                <td className="font-medium text-ink">{key.name}</td>
                <td>
                  <code className="text-xs text-ink-body bg-canvas-soft px-2 py-0.5 rounded">
                    {key.prefix}
                  </code>
                </td>
                <td>
                  <PermBadge perm={key.permissions} />
                </td>
                <td className="text-ink-mute">{key.lastUsed}</td>
                <td className="text-ink-mute">{key.createdAt}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(key.prefix)}
                      className="text-sm text-link hover:text-link-hover font-medium"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => onRevoke(key.id)}
                      className="text-sm text-danger hover:underline font-medium"
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

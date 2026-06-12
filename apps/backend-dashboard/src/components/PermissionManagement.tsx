"use client";

import { useState } from "react";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const mockRoles: Role[] = [
  {
    id: "1",
    name: "Super Admin",
    description: "Full system access",
    permissions: ["all"],
    userCount: 2,
  },
  {
    id: "2",
    name: "Admin",
    description: "Administrative access",
    permissions: ["users:manage", "content:manage", "settings:view"],
    userCount: 5,
  },
  {
    id: "3",
    name: "Moderator",
    description: "Content moderation",
    permissions: ["content:moderate", "users:view"],
    userCount: 12,
  },
  {
    id: "4",
    name: "Editor",
    description: "Content editing",
    permissions: ["content:edit", "content:create"],
    userCount: 28,
  },
  {
    id: "5",
    name: "User",
    description: "Basic user access",
    permissions: ["content:view", "profile:edit"],
    userCount: 128000,
  },
];

const allPermissions = [
  "users:manage",
  "users:view",
  "content:manage",
  "content:moderate",
  "content:edit",
  "content:create",
  "content:view",
  "settings:manage",
  "settings:view",
  "profile:edit",
];

export function PermissionManagement() {
  const [roles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <div className="space-y-lg">
      <div className="cc-card p-md">
        <div className="flex items-center justify-between mb-md">
          <h2 className="cc-body-md-strong text-[var(--cc-ink)]">Roles & permissions.</h2>
          <button className="cc-btn-primary">
            + Create Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`p-md rounded-[var(--cc-radius-md)] cursor-pointer transition-all border ${
                selectedRole?.id === role.id
                  ? "border-[var(--cc-link)] bg-[var(--cc-link-bg-soft)]"
                  : "border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)]"
              }`}
              role="button"
              tabIndex={0}
              aria-pressed={selectedRole?.id === role.id}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="cc-body-sm-strong text-[var(--cc-ink)]">{role.name}</h3>
                <span className="badge badge-neutral">
                  {role.userCount.toLocaleString()} users
                </span>
              </div>
              <p className="cc-body-sm text-[var(--cc-body)] mb-3">{role.description}</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((perm) => (
                  <span
                    key={perm}
                    className="cc-caption bg-[var(--cc-canvas-soft-2)] text-[var(--cc-body)] px-2 py-1 rounded-[var(--cc-radius-xs)]"
                  >
                    {perm}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className="cc-caption text-[var(--cc-muted)]">
                    +{role.permissions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedRole && (
        <div className="cc-card p-md">
          <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-md">
            Edit Permissions: {selectedRole.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allPermissions.map((perm) => (
              <label
                key={perm}
                className="flex items-center gap-2 p-3 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] cursor-pointer hover:bg-[var(--cc-canvas-soft)]"
              >
                <input
                  type="checkbox"
                  checked={selectedRole.permissions.includes(perm) || selectedRole.permissions.includes("all")}
                  className="checkbox"
                  readOnly
                />
                <span className="cc-body-sm text-[var(--cc-ink)]">{perm}</span>
              </label>
            ))}
          </div>
          <div className="mt-md flex gap-3">
            <button className="cc-btn-primary">
              Save Changes
            </button>
            <button className="cc-btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

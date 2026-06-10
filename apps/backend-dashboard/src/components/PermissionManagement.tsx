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
      <div className="card p-md">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-heading-3 text-ink">Roles & Permissions</h2>
          <button className="btn btn-primary">
            + Create Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`p-md rounded-md cursor-pointer transition-all border ${
                selectedRole?.id === role.id
                  ? "border-link bg-[var(--color-link-bg-soft)]"
                  : "border-hairline hover:border-hairline-dark"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-body-sm-strong text-ink">{role.name}</h3>
                <span className="badge badge-neutral">
                  {role.userCount.toLocaleString()} users
                </span>
              </div>
              <p className="text-body-sm text-body-color mb-3">{role.description}</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((perm) => (
                  <span
                    key={perm}
                    className="text-caption bg-canvas-soft-2 text-body-color px-2 py-1 rounded"
                  >
                    {perm}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className="text-caption text-mute">
                    +{role.permissions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedRole && (
        <div className="card p-md">
          <h3 className="text-heading-3 text-ink mb-md">
            Edit Permissions: {selectedRole.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allPermissions.map((perm) => (
              <label
                key={perm}
                className="flex items-center gap-2 p-3 border border-hairline rounded-md cursor-pointer hover:bg-canvas-soft"
              >
                <input
                  type="checkbox"
                  checked={selectedRole.permissions.includes(perm) || selectedRole.permissions.includes("all")}
                  className="checkbox"
                  readOnly
                />
                <span className="text-body-sm text-ink">{perm}</span>
              </label>
            ))}
          </div>
          <div className="mt-md flex gap-3">
            <button className="btn btn-primary">
              Save Changes
            </button>
            <button className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

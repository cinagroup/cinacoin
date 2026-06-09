"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "pending";
  createdAt: string;
}

const mockUsers: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", status: "active", createdAt: "2024-01-15" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Editor", status: "active", createdAt: "2024-02-20" },
  { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "User", status: "suspended", createdAt: "2024-03-10" },
  { id: "4", name: "Alice Brown", email: "alice@example.com", role: "User", status: "active", createdAt: "2024-04-05" },
  { id: "5", name: "Charlie Davis", email: "charlie@example.com", role: "Moderator", status: "pending", createdAt: "2024-05-12" },
  { id: "6", name: "Diana Miller", email: "diana@example.com", role: "User", status: "active", createdAt: "2024-06-18" },
];

const statusBadge: Record<string, string> = {
  active: "badge-success",
  suspended: "badge-error",
  pending: "badge-warning",
};

export function UserManagement() {
  const [users] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "disable"; count: number } | null>(null);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected = filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length;
  const someSelected = selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleSelectUser = (id: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedUsers(newSet);
  };

  const handleBatchDelete = () => {
    setConfirmAction({ type: "delete", count: selectedUsers.size });
  };

  const handleBatchDisable = () => {
    setConfirmAction({ type: "disable", count: selectedUsers.size });
  };

  const handleConfirmAction = () => {
    // In production, this would call the API
    console.log(`Batch ${confirmAction?.type}:`, Array.from(selectedUsers));
    setSelectedUsers(new Set());
    setConfirmAction(null);
  };

  return (
    <div className="space-y-md">
      {/* Batch action bar */}
      {selectedUsers.size > 0 && (
        <div className="card p-md bg-primary text-primary-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-body-sm font-medium">
              {selectedUsers.size} user{selectedUsers.size > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="text-caption text-gray-300 hover:text-white underline"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDisable}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-caption font-medium rounded-sm transition-colors"
            >
              Disable Selected
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 bg-error hover:opacity-90 text-white text-caption font-medium rounded-sm transition-colors"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-lg max-w-md w-full mx-4">
            <h3 className="text-heading-3 text-ink mb-2">
              {confirmAction.type === "delete" ? "Delete Users" : "Disable Users"}
            </h3>
            <p className="text-body text-body-color mb-lg">
              Are you sure you want to {confirmAction.type} {confirmAction.count} user{confirmAction.count > 1 ? "s" : ""}?
              {confirmAction.type === "delete" && " This action cannot be undone."}
            </p>
            <div className="flex gap-md justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={confirmAction.type === "delete" ? "btn btn-danger" : "btn btn-primary"}
              >
                {confirmAction.type === "delete" ? "Delete Users" : "Disable Users"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-md border-b border-hairline">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-3 text-ink">User Management</h2>
            <button className="btn btn-primary">
              + Add User
            </button>
          </div>
          <div className="mt-md flex items-center gap-3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input max-w-md"
            />
            {filteredUsers.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="btn btn-secondary text-caption"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="checkbox"
                  />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`${selectedUsers.has(user.id) ? "bg-blue-50/50" : ""}`}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-canvas-soft-2 flex items-center justify-center text-body-sm font-medium text-ink">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-body-sm font-medium text-ink">{user.name}</p>
                        <p className="text-body-sm text-body-color">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-body-sm text-ink">{user.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadge[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="text-body-color">
                    {user.createdAt}
                  </td>
                  <td className="text-right">
                    <button className="text-link hover:text-link-hover mr-3 text-body-sm font-medium">Edit</button>
                    <button className="text-error hover:opacity-80 text-body-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-md border-t border-hairline flex items-center justify-between">
          <p className="text-body-sm text-body-color">
            Showing {filteredUsers.length} of {users.length} users
            {selectedUsers.size > 0 && ` · ${selectedUsers.size} selected`}
          </p>
          <div className="flex gap-2">
            <button className="btn btn-secondary text-caption" disabled>
              Previous
            </button>
            <button className="btn btn-secondary text-caption">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

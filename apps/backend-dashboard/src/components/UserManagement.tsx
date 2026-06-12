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
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "disable"; count: number; userIds?: string[] } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

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
    setConfirmAction({ type: "delete", count: selectedUsers.size, userIds: Array.from(selectedUsers) });
  };

  const handleBatchDisable = () => {
    setConfirmAction({ type: "disable", count: selectedUsers.size, userIds: Array.from(selectedUsers) });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    const userIds = confirmAction.userIds || Array.from(selectedUsers);
    
    if (confirmAction.type === "delete") {
      setUsers(users.filter(u => !userIds.includes(u.id)));
    } else if (confirmAction.type === "disable") {
      setUsers(users.map(u => 
        userIds.includes(u.id) ? { ...u, status: "suspended" as const } : u
      ));
    }
    
    setSelectedUsers(new Set());
    setConfirmAction(null);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmAction({ type: "delete", count: 1, userIds: [userId] });
  };

  const handleAddUser = () => {
    setShowAddUser(true);
  };

  return (
    <div className="space-y-md">
      {/* Batch action bar */}
      {selectedUsers.size > 0 && (
        <div className="cc-card p-md bg-[var(--cc-primary)] text-[var(--cc-on-primary)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="cc-body-sm font-medium">
              {selectedUsers.size} user{selectedUsers.size > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="cc-caption text-[var(--cc-body)] hover:text-[var(--cc-on-primary)] underline"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDisable}
              className="px-3 py-2 bg-[var(--cc-canvas)]/10 hover:bg-[var(--cc-canvas)]/20 text-[var(--cc-on-primary)] cc-caption font-medium rounded-[var(--cc-radius-sm)] transition-colors"
            >
              Disable Selected
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-3 py-2 bg-[var(--cc-error)] hover:opacity-90 text-[var(--cc-on-primary)] cc-caption font-medium rounded-[var(--cc-radius-sm)] transition-colors"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-[var(--cc-ink)]/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="cc-card p-lg max-w-md w-full mx-4">
            <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-2">
              {confirmAction.type === "delete" ? "Delete Users" : "Disable Users"}
            </h3>
            <p className="cc-body-md text-[var(--cc-body)] mb-lg">
              Are you sure you want to {confirmAction.type} {confirmAction.count} user{confirmAction.count > 1 ? "s" : ""}?
              {confirmAction.type === "delete" && " This action cannot be undone."}
            </p>
            <div className="flex gap-md justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="cc-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={confirmAction.type === "delete" ? "cc-btn-danger" : "cc-btn-primary"}
              >
                {confirmAction.type === "delete" ? "Delete Users" : "Disable Users"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-[var(--cc-ink)]/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="cc-card p-lg max-w-md w-full mx-4">
            <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Edit User</h3>
            <div className="space-y-md">
              <div>
                <label htmlFor="edit-name" className="label">Name</label>
                <input
                  type="text"
                  defaultValue={editingUser.name}
                  className="cc-form-input"
                  id="edit-name"
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="label">Email</label>
                <input
                  type="email"
                  defaultValue={editingUser.email}
                  className="cc-form-input"
                  id="edit-email"
                />
              </div>
              <div>
                <label htmlFor="edit-role" className="label">Role</label>
                <select defaultValue={editingUser.role} className="select" id="edit-role">
                  <option value="User">User</option>
                  <option value="Editor">Editor</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-status" className="label">Status</label>
                <select defaultValue={editingUser.status} className="select" id="edit-status">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="flex gap-md justify-end mt-lg">
              <button
                onClick={() => setEditingUser(null)}
                className="cc-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
                  const email = (document.getElementById('edit-email') as HTMLInputElement)?.value;
                  const role = (document.getElementById('edit-role') as HTMLSelectElement)?.value;
                  const status = (document.getElementById('edit-status') as HTMLSelectElement)?.value as User['status'];
                  
                  setUsers(users.map(u => 
                    u.id === editingUser.id ? { ...u, name, email, role, status } : u
                  ));
                  setEditingUser(null);
                }}
                className="cc-btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add user modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-[var(--cc-ink)]/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="cc-card p-lg max-w-md w-full mx-4">
            <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Add New User</h3>
            <div className="space-y-md">
              <div>
                <label htmlFor="add-name" className="label">Name</label>
                <input type="text" className="cc-form-input" id="add-name" placeholder="John Doe" />
              </div>
              <div>
                <label htmlFor="add-email" className="label">Email</label>
                <input type="email" className="cc-form-input" id="add-email" placeholder="john@example.com" />
              </div>
              <div>
                <label htmlFor="add-role" className="label">Role</label>
                <select className="select" id="add-role" defaultValue="User">
                  <option value="User">User</option>
                  <option value="Editor">Editor</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-md justify-end mt-lg">
              <button
                onClick={() => setShowAddUser(false)}
                className="cc-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = (document.getElementById('add-name') as HTMLInputElement)?.value;
                  const email = (document.getElementById('add-email') as HTMLInputElement)?.value;
                  const role = (document.getElementById('add-role') as HTMLSelectElement)?.value;
                  
                  if (name && email) {
                    const newUser: User = {
                      id: String(Date.now()),
                      name,
                      email,
                      role,
                      status: 'pending',
                      createdAt: new Date().toISOString().split('T')[0]
                    };
                    setUsers([...users, newUser]);
                    setShowAddUser(false);
                  }
                }}
                className="cc-btn-primary"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cc-card">
        <div className="p-md border-b border-[var(--cc-hairline)]">
          <div className="flex items-center justify-between">
            <h2 className="cc-body-md-strong text-[var(--cc-ink)]">User management.</h2>
            <button className="cc-btn-primary" onClick={handleAddUser}>
              + Add User
            </button>
          </div>
          <div className="mt-md flex items-center gap-3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cc-form-input max-w-md"
              aria-label="Search users"
            />
            {filteredUsers.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="cc-btn-secondary cc-caption"
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
                    aria-label="Select all users"
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-[var(--cc-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      <p className="cc-body-md text-[var(--cc-body)]">No users found matching &quot;{searchTerm}&quot;</p>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="cc-body-sm font-medium text-[var(--cc-link)] hover:underline mt-2"
                      >
                        Clear search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`${selectedUsers.has(user.id) ? "bg-[var(--cc-link-bg-soft)]/50" : ""}`}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="checkbox"
                      aria-label={`Select ${user.name}`}
                    />
                  </td>
                  <td>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--cc-canvas-soft-2)] flex items-center justify-center cc-body-sm font-medium text-[var(--cc-ink)]">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="cc-body-sm-strong text-[var(--cc-ink)]">{user.name}</p>
                        <p className="cc-body-sm text-[var(--cc-body)]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="cc-body-sm text-[var(--cc-ink)]">{user.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadge[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="cc-body-sm text-[var(--cc-body)]">
                    {user.createdAt}
                  </td>
                  <td className="text-right">
                    <button 
                      className="text-[var(--cc-link)] hover:underline mr-3 cc-body-sm font-medium"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="text-[var(--cc-error)] hover:opacity-80 cc-body-sm font-medium"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-md border-t border-[var(--cc-hairline)] flex items-center justify-between">
          <p className="cc-body-sm text-[var(--cc-body)]">
            Showing {filteredUsers.length} of {users.length} users
            {selectedUsers.size > 0 && ` · ${selectedUsers.size} selected`}
          </p>
          <div className="flex gap-2">
            <button className="cc-btn-secondary cc-caption" disabled>
              Previous
            </button>
            <button className="cc-btn-secondary cc-caption">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

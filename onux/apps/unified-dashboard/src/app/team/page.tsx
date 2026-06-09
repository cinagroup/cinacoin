"use client";

/**
 * Team management page.
 */
export default function TeamPage() {
  const teamMembers = [
    { name: "Alex Chen", email: "alex@cinacoin.com", role: "Admin", status: "active", avatar: "AC" },
    { name: "Sarah Kim", email: "sarah@cinacoin.com", role: "Developer", status: "active", avatar: "SK" },
    { name: "Mike Johnson", email: "mike@cinacoin.com", role: "Developer", status: "active", avatar: "MJ" },
    { name: "Emily Davis", email: "emily@cinacoin.com", role: "Viewer", status: "active", avatar: "ED" },
    { name: "James Wilson", email: "james@cinacoin.com", role: "Developer", status: "invited", avatar: "JW" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--cc-ink)]">Team</h1>
          <p className="text-sm text-[var(--cc-muted)] mt-1">
            Manage team members and permissions
          </p>
        </div>
        <button className="cc-btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          Invite Member
        </button>
      </div>

      {/* Team members table */}
      <div className="cc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--cc-canvas-soft)]">
                <th className="text-left py-3 px-5 text-[var(--cc-muted)] font-medium">Member</th>
                <th className="text-left py-3 px-5 text-[var(--cc-muted)] font-medium">Role</th>
                <th className="text-left py-3 px-5 text-[var(--cc-muted)] font-medium">Status</th>
                <th className="text-right py-3 px-5 text-[var(--cc-muted)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cc-hairline)]">
              {teamMembers.map((member) => (
                <tr key={member.email} className="hover:bg-[var(--cc-canvas-soft)] transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--cc-canvas-soft2)] border border-[var(--cc-hairline)] flex items-center justify-center text-xs font-medium text-[var(--cc-ink-soft)]">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--cc-ink)]">{member.name}</p>
                        <p className="text-xs text-[var(--cc-muted)]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`cc-badge ${
                      member.role === "Admin"
                        ? "bg-purple-50 text-purple-700"
                        : member.role === "Developer"
                        ? "cc-badge-info"
                        : "cc-badge-warning"
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`cc-badge ${
                      member.status === "active" ? "cc-badge-success" : "cc-badge-warning"
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button className="cc-btn-ghost text-xs py-1 px-2">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles explanation */}
      <div className="cc-card p-5">
        <h3 className="text-sm font-semibold text-[var(--cc-ink)] mb-3">Role Permissions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-[var(--cc-ink)] mb-1">Admin</p>
            <p className="text-xs text-[var(--cc-muted)]">Full access to all projects and settings</p>
          </div>
          <div>
            <p className="font-medium text-[var(--cc-ink)] mb-1">Developer</p>
            <p className="text-xs text-[var(--cc-muted)]">Can create and manage projects</p>
          </div>
          <div>
            <p className="font-medium text-[var(--cc-ink)] mb-1">Viewer</p>
            <p className="text-xs text-[var(--cc-muted)]">Read-only access to projects</p>
          </div>
        </div>
      </div>
    </div>
  );
}

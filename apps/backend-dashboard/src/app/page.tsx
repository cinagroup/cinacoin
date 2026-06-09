"use client";

import { Sidebar } from "@/components/Sidebar";
import { UserManagement } from "@/components/UserManagement";
import { PermissionManagement } from "@/components/PermissionManagement";
import { SystemConfig } from "@/components/SystemConfig";
import { TwoFactorAuth } from "@/components/TwoFactorAuth";
import { AuditLog } from "@/components/AuditLog";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="flex min-h-screen bg-canvas-soft">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 ml-64 p-lg">
        <div className="max-w-7xl mx-auto">
          <header className="mb-lg">
            <h1 className="text-heading-1 text-ink">
              Backend Administration
            </h1>
            <p className="text-body text-body-color mt-1">
              Manage users, permissions, and system configuration
            </p>
          </header>

          {activeTab === "users" && <UserManagement />}
          {activeTab === "permissions" && <PermissionManagement />}
          {activeTab === "2fa" && <TwoFactorAuth />}
          {activeTab === "audit" && <AuditLog />}
          {activeTab === "config" && <SystemConfig />}
        </div>
      </main>
    </div>
  );
}

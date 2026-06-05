"use client";

import { useState } from "react";
import Header from "@/components/Header";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("cnk_demo1234567890abcdef");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account preferences and API access.
          </p>
        </div>

        {/* API Access */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-gray-900">API Access</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default API Key
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(apiKey)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-gray-900">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                defaultValue="十三先生"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                defaultValue="user@cinacoin.dev"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button className="rounded-[100px] bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-red-600">Danger Zone</h2>
          <p className="mb-4 text-sm text-gray-500">
            Once you delete your account, there is no going back.
          </p>
          <button className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
            Delete Account
          </button>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";

interface ConfigSection {
  id: string;
  title: string;
  fields: ConfigField[];
}

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "toggle" | "select";
  value: string | number | boolean;
  description: string;
  options?: string[];
}

const mockConfig: ConfigSection[] = [
  {
    id: "general",
    title: "General Settings",
    fields: [
      { key: "siteName", label: "Site Name", type: "text", value: "CinaCoin", description: "The name displayed across the platform" },
      { key: "supportEmail", label: "Support Email", type: "text", value: "support@cinacoin.com", description: "Contact email for user support" },
      { key: "maintenanceMode", label: "Maintenance Mode", type: "toggle", value: false, description: "Enable to show maintenance page to users" },
    ],
  },
  {
    id: "api",
    title: "API Configuration",
    fields: [
      { key: "rateLimit", label: "Rate Limit (req/min)", type: "number", value: 1000, description: "Maximum API requests per minute per user" },
      { key: "apiVersion", label: "API Version", type: "select", value: "v2", description: "Current active API version", options: ["v1", "v2", "v3-beta"] },
      { key: "enableWebsockets", label: "Enable WebSockets", type: "toggle", value: true, description: "Allow real-time WebSocket connections" },
    ],
  },
  {
    id: "security",
    title: "Security Settings",
    fields: [
      { key: "twoFactorRequired", label: "Require 2FA for Admins", type: "toggle", value: true, description: "Force two-factor authentication for admin accounts" },
      { key: "sessionTimeout", label: "Session Timeout (minutes)", type: "number", value: 60, description: "Auto-logout after inactivity period" },
      { key: "allowedOrigins", label: "Allowed CORS Origins", type: "text", value: "https://dashboard.cinacoin.com,https://admin.cinacoin.com", description: "Comma-separated list of allowed origins" },
    ],
  },
];

export function SystemConfig() {
  const [config, setConfig] = useState<ConfigSection[]>(mockConfig);
  const [saved, setSaved] = useState(false);

  const handleFieldChange = (sectionId: string, fieldKey: string, value: string | number | boolean) => {
    setConfig(config.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.map(field => 
            field.key === fieldKey ? { ...field, value } : field
          )
        };
      }
      return section;
    }));
  };

  const handleSave = () => {
    console.log('Saving config:', config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setConfig(mockConfig);
    setSaved(false);
  };

  return (
    <div className="space-y-lg">
      {config.map((section) => (
        <div key={section.id} className="card p-md">
          <h2 className="text-heading-3 text-ink mb-lg">{section.title}</h2>
          <div className="space-y-lg">
            {section.fields.map((field) => (
              <div key={field.key} className="flex items-start justify-between gap-lg">
                <div className="flex-1">
                  <label className="label">{field.label}</label>
                  <p className="label-description">{field.description}</p>
                </div>
                <div className="w-64">
                  {field.type === "text" && (
                    <input
                      type="text"
                      value={field.value as string}
                      onChange={(e) => handleFieldChange(section.id, field.key, e.target.value)}
                      className="input"
                    />
                  )}
                  {field.type === "number" && (
                    <input
                      type="number"
                      value={field.value as number}
                      onChange={(e) => handleFieldChange(section.id, field.key, Number(e.target.value))}
                      className="input"
                    />
                  )}
                  {field.type === "toggle" && (
                    <button
                      className={`toggle ${
                        field.value ? "bg-primary" : "bg-[var(--color-canvas-soft-2)]"
                      }`}
                      onClick={() => handleFieldChange(section.id, field.key, !field.value)}
                    >
                      <span
                        className={`toggle-knob ${
                          field.value ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  )}
                  {field.type === "select" && (
                    <select
                      value={field.value as string}
                      onChange={(e) => handleFieldChange(section.id, field.key, e.target.value)}
                      className="select"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-md">
        <button
          onClick={handleSave}
          className="btn btn-primary"
        >
          Save All Changes
        </button>
        <button className="btn btn-secondary" onClick={handleReset}>
          Reset to Defaults
        </button>
        {saved && (
          <span className="text-body-sm font-medium text-green-600">
            ✓ Configuration saved successfully
          </span>
        )}
      </div>
    </div>
  );
}

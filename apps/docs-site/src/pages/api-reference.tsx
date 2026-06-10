import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * Interactive API Reference page powered by Swagger UI.
 *
 * Loads OpenAPI specs from the `docs/openapi/` directory and renders
 * them via the `swagger-ui-dist` bundle. Users can switch between
 * the three service specs (API Gateway, Auth Service, User Service).
 */

const SPECS: Record<string, { label: string; url: string }> = {
  gateway: {
    label: 'API Gateway',
    url: 'https://raw.githubusercontent.com/cinagroup/cinacoin/main/docs/openapi/api-gateway.yaml',
  },
  auth: {
    label: 'Auth Service',
    url: 'https://raw.githubusercontent.com/cinagroup/cinacoin/main/docs/openapi/auth-service.yaml',
  },
  users: {
    label: 'User Service',
    url: 'https://raw.githubusercontent.com/cinagroup/cinacoin/main/docs/openapi/user-service.yaml',
  },
};

function SwaggerViewer() {
  const [activeSpec, setActiveSpec] = useState<keyof typeof SPECS>('gateway');
  const [SwaggerUI, setSwaggerUI] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically import swagger-ui-dist (only runs in browser)
    async function loadSwaggerUI() {
      try {
        // Dynamic import from CDN
        const mod = (await import(
          /* webpackIgnore: true */
          'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/+esm'
        )) as { SwaggerUIBundle?: unknown; default?: unknown };
        setSwaggerUI(() => mod.SwaggerUIBundle || mod.default);
      } catch {
        // Fallback: inject script tag
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
        script.onload = () => {
          setSwaggerUI(() => (window as unknown as { SwaggerUIBundle?: unknown }).SwaggerUIBundle);
        };
        document.head.appendChild(script);
      }
    }
    loadSwaggerUI();
  }, []);

  useEffect(() => {
    if (!SwaggerUI) return;
    setLoading(true);

    const container = document.getElementById('swagger-container');
    if (!container) return;
    container.innerHTML = '';

    // Create a target div for Swagger UI
    const target = document.createElement('div');
    target.id = 'swagger-ui';
    container.appendChild(target);

    SwaggerUI({
      dom_id: '#swagger-ui',
      url: SPECS[activeSpec].url,
      deepLinking: true,
      presets: [
        (SwaggerUI as { presets?: { apis?: unknown }; APIS?: unknown }).presets?.apis || (SwaggerUI as { APIS?: unknown }).APIS,
      ],
      layout: 'BaseLayout',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: { headers: Record<string, string> }) => {
        // Allow users to set a custom Bearer token
        const token = (document.getElementById('bearer-token-input') as HTMLInputElement)?.value;
        if (token) {
          req.headers['Authorization'] = `Bearer ${token}`;
        }
        return req;
      },
      onComplete: () => setLoading(false),
    });
  }, [SwaggerUI, activeSpec]);

  return (
    <div className="py-4">
      <div className="mb-6 flex gap-2 flex-wrap items-center">
        <strong className="mr-2">Service:</strong>
        {Object.entries(SPECS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setActiveSpec(key as keyof typeof SPECS)}
            className={`px-4 py-1.5 rounded-md cursor-pointer text-sm ${
              activeSpec === key
                ? 'border-2 border-[var(--ifm-color-primary)] bg-[var(--ifm-color-primary-lightest,#e8f0fe)] text-[var(--ifm-color-primary-dark)] font-semibold'
                : 'border border-[var(--ifm-color-emphasis-300)] bg-transparent text-inherit font-normal'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="bearer-token-input" className="text-sm text-[var(--ifm-color-emphasis-600)]">
            Bearer Token:
          </label>
          <input
            id="bearer-token-input"
            type="password"
            placeholder="Paste token for Try It Out"
            className="py-1.5 px-2.5 rounded border border-[var(--ifm-color-emphasis-300)] text-sm w-60"
          />
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-[var(--ifm-color-emphasis-600)]">
          Loading API specification…
        </div>
      )}
      <div id="swagger-container" />

      <style>{`
        #swagger-ui .swagger-ui { font-family: var(--ifm-font-family-base); }
        #swagger-ui .info .title { color: var(--ifm-color-primary); }
        #swagger-ui .scheme-container { background: var(--ifm-background-color); box-shadow: none; border-bottom: 1px solid var(--ifm-color-emphasis-200); }
        #swagger-ui .opblock .opblock-summary { border-color: var(--ifm-color-emphasis-200); }
        #swagger-ui .opblock-body { color: var(--ifm-font-color-base); }
        #swagger-ui section.models { border-color: var(--ifm-color-emphasis-200); }
        #swagger-ui .model-box { background: var(--ifm-background-color); }
        #swagger-ui .topbar { display: none; }
      `}</style>
    </div>
  );
}

export default function ApiReferencePage() {
  return (
    <Layout
      title="API Reference"
      description="Interactive API reference for Cinacoin services — API Gateway, Auth Service, and User Service."
    >
      <main className="max-w-screen-xl mx-auto py-8 px-4">
        <h1>API Reference</h1>
        <p className="text-lg text-[var(--ifm-color-emphasis-700)] mb-6">
          Interactive documentation for all Cinacoin REST APIs. Select a service above to explore endpoints,
          view request/response schemas, and try requests directly from your browser.
        </p>
        <BrowserOnly fallback={<div>Loading API Reference…</div>}>
          {() => <SwaggerViewer />}
        </BrowserOnly>
      </main>
    </Layout>
  );
}

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
  const [SwaggerUI, setSwaggerUI] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically import swagger-ui-dist (only runs in browser)
    async function loadSwaggerUI() {
      try {
        // @ts-ignore — loaded from CDN at runtime
        const mod = await import(
          /* webpackIgnore: true */
          'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/+esm'
        );
        setSwaggerUI(() => mod.SwaggerUIBundle || mod.default);
      } catch {
        // Fallback: inject script tag
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
        script.onload = () => {
          // @ts-ignore
          setSwaggerUI(() => window.SwaggerUIBundle);
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
        // @ts-ignore
        SwaggerUI.presets?.apis || SwaggerUI.APIS,
      ],
      layout: 'BaseLayout',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
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
    <div style={{ padding: '1rem 0' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <strong style={{ marginRight: '0.5rem' }}>Service:</strong>
        {Object.entries(SPECS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setActiveSpec(key as keyof typeof SPECS)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: activeSpec === key ? '2px solid var(--ifm-color-primary)' : '1px solid var(--ifm-color-emphasis-300)',
              background: activeSpec === key ? 'var(--ifm-color-primary-lightest, #e8f0fe)' : 'transparent',
              color: activeSpec === key ? 'var(--ifm-color-primary-dark)' : 'inherit',
              cursor: 'pointer',
              fontWeight: activeSpec === key ? 600 : 400,
              fontSize: '0.9rem',
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="bearer-token-input" style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)' }}>
            Bearer Token:
          </label>
          <input
            id="bearer-token-input"
            type="password"
            placeholder="Paste token for Try It Out"
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid var(--ifm-color-emphasis-300)',
              fontSize: '0.85rem',
              width: '240px',
            }}
          />
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ifm-color-emphasis-600)' }}>
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
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1>API Reference</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--ifm-color-emphasis-700)', marginBottom: '1.5rem' }}>
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

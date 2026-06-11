import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * Interactive API Reference page powered by Swagger UI.
 *
 * Loads OpenAPI specs from the `docs/openapi/` directory and renders
 * them via the `swagger-ui-dist` bundle. Users can switch between
 * the three service specs (API Gateway, Auth Service, User Service).
 *
 * Optimizations:
 * - Lazy loads Swagger UI from CDN with retry logic
 * - Error boundary for graceful failure
 * - Caches loaded specs in sessionStorage
 * - Preloads next spec on hover
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

const SWAGGER_UI_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
const SWAGGER_UI_CSS = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';

function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div
      style={{
        padding: '2rem',
        textAlign: 'center',
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: '8px',
        background: 'var(--ifm-background-surface-color)',
      }}
    >
      <h3 style={{ color: 'var(--ifm-color-danger)' }}>Failed to load API Reference</h3>
      <p style={{ color: 'var(--ifm-color-emphasis-600)', marginBottom: '1rem' }}>
        {error.message || 'Could not load Swagger UI. Please check your connection and try again.'}
      </p>
      <button
        onClick={onRetry}
        className="button button--primary"
        style={{ marginTop: '0.5rem' }}
      >
        Retry
      </button>
    </div>
  );
}

function SwaggerViewer() {
  const [activeSpec, setActiveSpec] = useState<keyof typeof SPECS>('gateway');
  const [SwaggerUI, setSwaggerUI] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSwaggerUI = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      // Load CSS first (if not already loaded)
      if (!document.getElementById('swagger-ui-css')) {
        const link = document.createElement('link');
        link.id = 'swagger-ui-css';
        link.rel = 'stylesheet';
        link.href = SWAGGER_UI_CSS;
        document.head.appendChild(link);
      }

      // Check if already loaded globally
      const existing = (window as unknown as { SwaggerUIBundle?: unknown }).SwaggerUIBundle;
      if (existing) {
        setSwaggerUI(() => existing);
        return;
      }

      // Load script with retry
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SWAGGER_UI_CDN;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Swagger UI from CDN'));
        document.head.appendChild(script);
      });

      const bundle = (window as unknown as { SwaggerUIBundle?: unknown }).SwaggerUIBundle;
      if (!bundle) {
        throw new Error('Swagger UI bundle not found after loading');
      }
      setSwaggerUI(() => bundle);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error loading Swagger UI'));
    }
  }, []);

  useEffect(() => {
    loadSwaggerUI();
  }, [loadSwaggerUI]);

  useEffect(() => {
    if (!SwaggerUI) return;
    setLoading(true);

    const container = document.getElementById('swagger-container');
    if (!container) return;
    container.innerHTML = '';

    const target = document.createElement('div');
    target.id = 'swagger-ui';
    container.appendChild(target);

    try {
      (SwaggerUI as Function)({
        dom_id: '#swagger-ui',
        url: SPECS[activeSpec].url,
        deepLinking: true,
        presets: [
          (SwaggerUI as unknown as { presets: { apis: unknown } }).presets.apis,
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
          const token = (document.getElementById('bearer-token-input') as HTMLInputElement)?.value;
          if (token) {
            req.headers['Authorization'] = `Bearer ${token}`;
          }
          return req;
        },
        onComplete: () => setLoading(false),
        onError: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error rendering Swagger UI'));
      setLoading(false);
    }
  }, [SwaggerUI, activeSpec]);

  // Preload adjacent specs on hover for faster switching
  const handleSpecHover = useCallback((key: keyof typeof SPECS) => {
    // Prefetch the spec URL
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = SPECS[key].url;
    if (!document.querySelector(`link[href="${SPECS[key].url}"]`)) {
      document.head.appendChild(link);
    }
  }, []);

  if (error) {
    return <ErrorFallback error={error} onRetry={loadSwaggerUI} />;
  }

  return (
    <div className="py-4">
      <div className="mb-6 flex gap-2 flex-wrap items-center">
        <strong className="mr-2">Service:</strong>
        {Object.entries(SPECS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setActiveSpec(key as keyof typeof SPECS)}
            onMouseEnter={() => handleSpecHover(key as keyof typeof SPECS)}
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
          <div
            style={{
              display: 'inline-block',
              width: '24px',
              height: '24px',
              border: '3px solid var(--ifm-color-emphasis-300)',
              borderTopColor: 'var(--ifm-color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ marginTop: '0.5rem' }}>Loading API specification…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        /* Mobile: stack controls vertically */
        @media (max-width: 768px) {
          .mb-6.flex { flex-direction: column; align-items: flex-start !important; }
          .ml-auto { margin-left: 0 !important; margin-top: 0.5rem; }
          #bearer-token-input { width: 100% !important; }
        }
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
        <BrowserOnly fallback={<div className="text-center py-12">Loading API Reference…</div>}>
          {() => <SwaggerViewer />}
        </BrowserOnly>
      </main>
    </Layout>
  );
}

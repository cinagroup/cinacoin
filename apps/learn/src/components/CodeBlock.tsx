"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export default function CodeBlock({ code, language = "typescript", title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cc-card" style={{ padding: 0, marginTop: 'var(--cc-space-lg)', marginBottom: 'var(--cc-space-lg)' }}>
      {title && (
        <div 
          className="flex items-center justify-between"
          style={{ 
            padding: 'var(--cc-space-sm) var(--cc-space-md)',
            backgroundColor: 'var(--cc-canvas-soft-2)',
            borderBottom: '1px solid var(--cc-hairline)'
          }}
        >
          <span className="cc-mono text-body-sm" style={{ color: 'var(--cc-body)' }}>{title}</span>
          <button
            onClick={handleCopy}
            className="text-caption cc-link-hover"
            style={{ color: 'var(--cc-mute)', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--cc-space-xs)' }}
            aria-label={copied ? "Code copied" : "Copy code"}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto" style={{ padding: 'var(--cc-space-md)' }}>
        <code className={`language-${language} text-body-sm`}>{code}</code>
      </pre>
    </div>
  );
}

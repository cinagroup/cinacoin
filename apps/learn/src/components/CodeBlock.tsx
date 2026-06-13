"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

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
    <div className="rounded-lg overflow-hidden" style={{ marginTop: 'var(--cc-space-lg)', marginBottom: 'var(--cc-space-lg)', border: '1px solid #2e2e2e' }}>
      {title && (
        <div 
          className="flex items-center justify-between"
          style={{ 
            padding: 'var(--cc-space-sm) var(--cc-space-md)',
            backgroundColor: '#1e1e1e',
            borderBottom: '1px solid #2e2e2e'
          }}
        >
          <span className="font-mono text-xs" style={{ color: '#888' }}>{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs"
            style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--cc-space-xs)' }}
            aria-label={copied ? "Code copied" : "Copy code"}
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto" style={{ padding: 'var(--cc-space-md)', backgroundColor: '#171717', margin: 0 }}>
        <code className={`language-${language} font-mono text-sm`} style={{ color: '#b3b3b3' }}>{code}</code>
      </pre>
    </div>
  );
}

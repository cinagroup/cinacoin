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
    <div className="rounded-lg overflow-hidden" style={{ marginTop: 'var(--cc-lg)', marginBottom: 'var(--cc-lg)', border: '1px solid var(--cc-hairline-strong)' }}>
      {title && (
        <div 
          className="flex items-center justify-between"
          style={{ 
            padding: 'var(--cc-sm) var(--cc-md)',
            backgroundColor: 'var(--cc-primary)',
            borderBottom: '1px solid var(--cc-hairline-strong)'
          }}
        >
          <span className="font-mono text-xs" style={{ color: 'var(--cc-muted)' }}>{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--cc-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--cc-xs)' }}
            aria-label={copied ? "Code copied" : "Copy code"}
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto" style={{ padding: 'var(--cc-md)', backgroundColor: 'var(--cc-primary)', margin: 0 }}>
        <code className={`language-${language} font-mono text-sm`} style={{ color: 'var(--cc-on-primary)' }}>{code}</code>
      </pre>
    </div>
  );
}

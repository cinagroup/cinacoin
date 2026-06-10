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
    <div className="bg-bg-card border border-border-color rounded-lg overflow-hidden my-6">
      {title && (
        <div className="px-4 py-2 bg-bg-hover border-b border-border-color flex items-center justify-between">
          <span className="text-sm text-text-secondary font-mono">{title}</span>
          <button
            onClick={handleCopy}
            className="text-xs text-text-muted hover:text-accent-blue transition-colors"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm">
        <code className={`language-${language} text-text-primary`}>{code}</code>
      </pre>
    </div>
  );
}

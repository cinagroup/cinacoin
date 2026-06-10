"use client";

import { useState } from "react";

interface InteractiveEditorProps {
  initialCode: string;
  placeholder?: string;
}

export default function InteractiveEditor({
  initialCode,
  placeholder = "Write your code here...",
}: InteractiveEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");

  const handleRun = () => {
    // Placeholder for actual code execution
    setOutput("Code execution would happen here. This is a placeholder for the interactive editor.");
  };

  return (
    <div className="bg-bg-card border border-border-color rounded-lg overflow-hidden my-6">
      <div className="px-4 py-2 bg-bg-hover border-b border-border-color flex items-center justify-between">
        <span className="text-sm text-text-secondary font-mono">Interactive Editor</span>
        <button
          onClick={handleRun}
          className="px-3 py-1 text-xs font-medium bg-accent-blue hover:bg-accent-blue/80 text-white rounded transition-colors"
        >
          Run Code
        </button>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={placeholder}
        className="w-full h-48 p-4 bg-bg-primary text-text-primary font-mono text-sm resize-none focus:outline-none"
      />
      {output && (
        <div className="border-t border-border-color p-4 bg-bg-primary">
          <div className="text-xs text-text-muted mb-2">Output:</div>
          <pre className="text-sm text-accent-green whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}

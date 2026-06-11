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
  const [output, setOutput] = useState("");

  const handleRun = () => {
    setOutput("Code execution would happen here. This is a placeholder for the interactive editor.");
  };

  return (
    <div className="cc-card" style={{ padding: 0, marginTop: 'var(--cc-space-lg)', marginBottom: 'var(--cc-space-lg)' }}>
      <div 
        className="flex items-center justify-between"
        style={{ 
          padding: 'var(--cc-space-sm) var(--cc-space-md)',
          backgroundColor: 'var(--cc-canvas-soft-2)',
          borderBottom: '1px solid var(--cc-hairline)'
        }}
      >
        <span className="cc-mono text-body-sm" style={{ color: 'var(--cc-body)' }}>Interactive editor.</span>
        <button
          onClick={handleRun}
          className="cc-btn-primary"
          style={{ height: '32px', padding: '0 var(--cc-space-sm)' }}
          aria-label="Run code"
        >
          Run code
        </button>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={placeholder}
        className="cc-mono text-body-sm resize-none"
        style={{ 
          width: '100%', 
          height: '192px', 
          padding: 'var(--cc-space-md)',
          backgroundColor: 'var(--cc-canvas)',
          color: 'var(--cc-ink)',
          border: 'none',
          outline: 'none'
        }}
        aria-label="Code editor"
      />
      {output && (
        <div style={{ 
          padding: 'var(--cc-space-md)',
          borderTop: '1px solid var(--cc-hairline)',
          backgroundColor: 'var(--cc-canvas-soft)'
        }}>
          <div className="text-caption" style={{ color: 'var(--cc-mute)', marginBottom: 'var(--cc-space-xs)' }}>Output:</div>
          <pre className="text-body-sm" style={{ color: 'var(--cc-success)', whiteSpace: 'pre-wrap' }}>{output}</pre>
        </div>
      )}
    </div>
  );
}

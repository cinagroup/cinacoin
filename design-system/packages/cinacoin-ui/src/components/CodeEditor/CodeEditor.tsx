import React, { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface CodeEditorProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  /** Code content */
  code: string;
  /** Language for syntax highlighting (optional) */
  language?: string;
  /** Show line numbers */
  lineNumbers?: boolean;
}

export const CodeEditor = forwardRef<HTMLDivElement, CodeEditorProps>(
  ({ code, language = 'typescript', lineNumbers = true, className, ...props }, ref) => {
    const lines = code.split('\n');

    return (
      <div
        ref={ref}
        className={cn(
          'bg-[#171717] text-white rounded-[8px] p-4 overflow-x-auto font-mono text-[13px] leading-6',
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs text-white/40 ml-2">{language}</span>
        </div>
        <pre className="whitespace-pre">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="flex">
                {lineNumbers && (
                  <span className="inline-block w-8 text-right pr-4 text-white/30 select-none">
                    {idx + 1}
                  </span>
                )}
                <span className="flex-1">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    );
  },
);

CodeEditor.displayName = 'CodeEditor';

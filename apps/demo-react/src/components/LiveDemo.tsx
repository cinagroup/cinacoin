import React, { useState, useRef, useCallback } from 'react'

/* ─── Simple line highlighting (same as CodeExample) ─── */

const KEYWORDS = new Set([
  'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
  'if', 'else', 'async', 'await', 'new', 'try', 'catch', 'throw',
  'typeof', 'instanceof', 'default', 'switch', 'case', 'break', 'for',
  'while', 'do', 'class', 'extends', 'interface', 'type', 'enum',
])

const BUILTINS = new Set([
  'console', 'window', 'document', 'Math', 'JSON', 'Promise', 'Array',
  'Object', 'String', 'Number', 'Boolean', 'Error', 'Map', 'Set',
  'true', 'false', 'null', 'undefined', 'this', 'super',
])

function highlightLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = []
  const re = /(\/\/.*$|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+\.?\d*\b|\b[A-Za-z_$][\w$]*\b)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(line)) !== null) {
    if (m.index > last) tokens.push(line.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('//') || tok.startsWith('/*')) {
      tokens.push(<span key={m.index} className="text-[var(--cc-muted)] italic">{tok}</span>)
    } else if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith('`')) {
      tokens.push(<span key={m.index} className="text-[var(--cc-success)]">{tok}</span>)
    } else if (/^\d/.test(tok)) {
      tokens.push(<span key={m.index} className="text-[var(--cc-accent)]">{tok}</span>)
    } else if (KEYWORDS.has(tok)) {
      tokens.push(<span key={m.index} className="text-[var(--cc-link)] font-medium">{tok}</span>)
    } else if (BUILTINS.has(tok)) {
      tokens.push(<span key={m.index} className="text-[var(--cc-warning)]">{tok}</span>)
    } else {
      tokens.push(<span key={m.index}>{tok}</span>)
    }
    last = m.index + tok.length
  }
  if (last < line.length) tokens.push(line.slice(last))
  return tokens
}

/* ─── Props ─── */

interface LiveDemoProps {
  /** Left side: interactive demo content */
  children: React.ReactNode
  /** Right side: code string */
  code: string
  /** Title for the whole component */
  title?: string
  /** Lines to highlight when an action is triggered (1-indexed) */
  activeLines?: number[]
  /** Callback when user interacts — parent can update activeLines */
  onAction?: (action: string) => void
}

export function LiveDemo({
  children,
  code,
  title,
  activeLines = [],
  onAction,
}: LiveDemoProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLPreElement>(null)

  const lines = code.split('\n')

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  return (
    <div className="cc-card !p-0 overflow-hidden border border-[var(--cc-hairline)]">
      {/* Header */}
      {title && (
        <div className="px-4 py-3 border-b border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft-2)]">
          <span className="cc-body-sm-strong text-[var(--cc-ink)]">{title}</span>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--cc-hairline)]">
        {/* Left: Live demo */}
        <div className="p-5 min-h-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[var(--cc-success)] animate-pulse" />
            <span className="cc-caption-mono text-[var(--cc-muted)] uppercase tracking-wider">Live Demo</span>
          </div>
          {children}
        </div>

        {/* Right: Code */}
        <div className="relative bg-[var(--cc-canvas-soft-2)] min-h-[200px]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--cc-hairline)]">
            <span className="cc-caption-mono text-[var(--cc-muted)] uppercase tracking-wider">Code</span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-md hover:bg-[var(--cc-canvas-soft)] transition-colors text-[var(--cc-muted)] hover:text-[var(--cc-ink)] focus-ring"
              aria-label={copied ? 'Copied!' : 'Copy code'}
              title={copied ? 'Copied!' : 'Copy code'}
            >
              {copied ? (
                <svg className="w-4 h-4 text-[var(--cc-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <pre
            ref={codeRef}
            className="overflow-auto max-h-[400px] p-4 text-body-sm leading-relaxed font-[var(--font-mono)]"
            tabIndex={0}
            role="region"
            aria-label="Code panel"
          >
            <code>
              {lines.map((line, i) => {
                const lineNum = i + 1
                const isHighlighted = activeLines.includes(lineNum)
                return (
                  <div
                    key={i}
                    className={`flex transition-colors duration-300 ${
                      isHighlighted
                        ? 'bg-[var(--cc-link)]/10 -mx-4 px-4 border-l-2 border-[var(--cc-link)]'
                        : ''
                    }`}
                  >
                    <span className="select-none text-[var(--cc-muted)] text-caption w-8 shrink-0 text-right pr-3 py-1 opacity-50">
                      {lineNum}
                    </span>
                    <span className="py-1">
                      {line ? highlightLine(line) : '\u00A0'}
                    </span>
                  </div>
                )
              })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export default LiveDemo

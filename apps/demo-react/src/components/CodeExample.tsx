import React, { useState, useRef, useCallback } from 'react'

/* ─── Simple keyword-based syntax highlighting (no external deps) ─── */

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
  // Regex: strings | comments | numbers | identifiers
  const re = /(\/\/.*$|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+\.?\d*\b|\b[A-Za-z_$][\w$]*\b)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(line)) !== null) {
    // text before match
    if (m.index > last) {
      tokens.push(line.slice(last, m.index))
    }
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

/* ─── Framework tab definitions ─── */
type Framework = 'react' | 'vue' | 'nextjs'

interface FrameworkTab {
  id: Framework
  label: string
}

const FRAMEWORKS: FrameworkTab[] = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'nextjs', label: 'Next.js' },
]

/* ─── Props ─── */
interface CodeExampleProps {
  /** Code snippets keyed by framework. Must include at least `react`. */
  code: Partial<Record<Framework, string>> & { react: string }
  /** Optional title shown above the code block */
  title?: string
  /** Start collapsed? */
  defaultCollapsed?: boolean
  /** Highlight specific line numbers (1-indexed) */
  highlightLines?: number[]
}

export function CodeExample({
  code,
  title,
  defaultCollapsed = false,
  highlightLines = [],
}: CodeExampleProps) {
  const [activeFramework, setActiveFramework] = useState<Framework>('react')
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLPreElement>(null)

  const availableFrameworks = FRAMEWORKS.filter(f => code[f.id])
  const currentCode = code[activeFramework] ?? code.react
  const lines = currentCode.split('\n')

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = currentCode
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [currentCode])

  return (
    <div className="cc-card !p-0 overflow-hidden border border-[var(--cc-hairline)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft-2)]">
        <div className="flex items-center gap-3">
          {title && (
            <span className="cc-body-sm-strong text-[var(--cc-ink)]">{title}</span>
          )}
          {/* Framework tabs */}
          {availableFrameworks.length > 1 && (
            <div className="flex gap-0.5 bg-[var(--cc-canvas)] p-0.5 rounded-md border border-[var(--cc-hairline)]">
              {availableFrameworks.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFramework(f.id)}
                  className={`cc-tab-ghost !h-6 !px-2.5 text-xs rounded-md focus-ring transition-colors ${
                    activeFramework === f.id
                      ? 'bg-[var(--cc-link)]/10 text-[var(--cc-link)] font-medium'
                      : 'text-[var(--cc-muted)] hover:text-[var(--cc-ink)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-[var(--cc-canvas-soft)] transition-colors text-[var(--cc-muted)] hover:text-[var(--cc-ink)] focus-ring"
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
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-[var(--cc-canvas-soft)] transition-colors text-[var(--cc-muted)] hover:text-[var(--cc-ink)] focus-ring"
            aria-label={collapsed ? 'Expand code' : 'Collapse code'}
            aria-expanded={!collapsed}
          >
            <svg
              className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Code body */}
      {!collapsed && (
        <pre
          ref={codeRef}
          className="cc-code-block !m-0 !rounded-none overflow-x-auto text-sm leading-relaxed"
          tabIndex={0}
          role="region"
          aria-label="Code example"
        >
          <code>
            {lines.map((line, i) => {
              const lineNum = i + 1
              const isHighlighted = highlightLines.includes(lineNum)
              return (
                <div
                  key={i}
                  className={`flex ${isHighlighted ? 'bg-[var(--cc-link)]/8 -mx-4 px-4 border-l-2 border-[var(--cc-link)]' : ''}`}
                >
                  <span className="select-none text-[var(--cc-muted)] text-xs w-8 shrink-0 text-right pr-3 py-0.5 opacity-50">
                    {lineNum}
                  </span>
                  <span className="py-0.5">
                    {line ? highlightLine(line) : '\u00A0'}
                  </span>
                </div>
              )
            })}
          </code>
        </pre>
      )}
    </div>
  )
}

export default CodeExample

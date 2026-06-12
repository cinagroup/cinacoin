"use client";

import { useState } from "react";
import { Layers, Code2, Eye, Copy, Check, Sparkles } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet } from "@/lib/useWallet";
import { useToast } from "@/lib/toast";

/* ── Component examples ── */
const COMPONENTS = [
  {
    name: "Button",
    description: "Primary action button with hover states",
    category: "Actions",
  },
  {
    name: "Card",
    description: "Container with border and shadow",
    category: "Layout",
  },
  {
    name: "Input",
    description: "Text input with focus states",
    category: "Forms",
  },
  {
    name: "Badge",
    description: "Status indicator with variants",
    category: "Feedback",
  },
  {
    name: "Toggle",
    description: "Switch control for boolean values",
    category: "Forms",
  },
  {
    name: "Toast",
    description: "Notification messages",
    category: "Feedback",
  },
];

export default function ComponentsPage() {
  const { status } = useWallet();
  const { success } = useToast();
  const isConnected = status === "connected";

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (componentName: string) => {
    const code = `import { ${componentName} } from '@cinacoin/ui';

export function Example() {
  return <${componentName}>Example</${componentName}>;
}`;
    await navigator.clipboard.writeText(code);
    setCopiedCode(componentName);
    success("Copied", "Code snippet copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <DemoLayout>
      <div className="max-w-5xl mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">COMPONENTS</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-2">
            Component library.
          </h1>
          <p className="text-[var(--cc-body)] text-body-sm">
            Pre-built UI components following the CinaCoin design system
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)]">
            <p className="text-caption text-[var(--cc-muted)] mb-1">Components</p>
            <p className="text-display-sm font-semibold text-[var(--cc-ink)] cc-tabular-nums">{COMPONENTS.length}</p>
          </div>
          <div className="p-4 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)]">
            <p className="text-caption text-[var(--cc-muted)] mb-1">Categories</p>
            <p className="text-display-sm font-semibold text-[var(--cc-ink)] cc-tabular-nums">4</p>
          </div>
          <div className="p-4 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)]">
            <p className="text-caption text-[var(--cc-muted)] mb-1">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-[var(--cc-success)] rounded-full animate-pulse" />
              <span className="text-body-sm font-medium text-[var(--cc-success)]">Stable</span>
            </div>
          </div>
        </div>

        {/* Component Grid */}
        <div className="grid md:grid-cols-2 gap-4 cc-stagger">
          {COMPONENTS.map((component) => (
            <div
              key={component.name}
              className="p-5 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] hover:shadow-[var(--cc-level2)] transition-all group cc-animate-slide-up"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] flex items-center justify-center shrink-0">
                    <Code2 className="w-5 h-5 text-[var(--cc-muted)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--cc-ink)] mb-1">{component.name}</h3>
                    <p className="text-caption text-[var(--cc-body)]">{component.description}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-full text-caption text-[var(--cc-muted)] font-medium">
                  {component.category}
                </span>
              </div>

              {/* Preview */}
              <div className="p-4 bg-[var(--cc-canvas-soft-2)]/40 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)] mb-3">
                {component.name === "Button" && (
                  <button className="px-4 py-2 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] rounded-[var(--cc-radius-sm)] font-semibold text-body-sm transition-all shadow-[var(--cc-level2)] active:scale-[0.98]">
                    Click me
                  </button>
                )}
                {component.name === "Card" && (
                  <div className="p-3 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] shadow-[var(--cc-level1)]">
                    <p className="text-body-sm text-[var(--cc-ink)]">Card content</p>
                  </div>
                )}
                {component.name === "Input" && (
                  <input
                    type="text"
                    placeholder="Type something..."
                    className="w-full px-3 py-2 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-body-sm text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)]/50 focus:outline-none focus:border-[var(--cc-hairline-strong)]"
                  />
                )}
                {component.name === "Badge" && (
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-[var(--cc-success)]/15 text-[var(--cc-success)] text-caption rounded-full font-medium border border-[var(--cc-success)]/25">
                      Success
                    </span>
                    <span className="px-2 py-0.5 bg-[var(--cc-error)]/15 text-[var(--cc-error)] text-caption rounded-full font-medium border border-[var(--cc-error)]/25">
                      Error
                    </span>
                  </div>
                )}
                {component.name === "Toggle" && (
                  <button
                    className="relative w-11 h-6 rounded-full bg-[var(--cc-primary)]"
                    role="switch"
                    aria-checked={true}
                  >
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[var(--cc-canvas)] shadow-[var(--cc-level1)] translate-x-5" />
                  </button>
                )}
                {component.name === "Toast" && (
                  <div className="p-3 bg-[var(--cc-success)]/15 border border-[var(--cc-success)]/25 rounded-[var(--cc-radius-sm)] flex items-center gap-2">
                    <Check className="w-4 h-4 text-[var(--cc-success)]" />
                    <span className="text-body-sm text-[var(--cc-success)] font-medium">Success!</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedComponent(component.name)}
                  className="flex-1 px-3 py-2 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-body-sm font-medium text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)] transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => handleCopyCode(component.name)}
                  className="flex-1 px-3 py-2 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] rounded-[var(--cc-radius-sm)] font-semibold text-body-sm transition-all shadow-[var(--cc-level2)] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {copiedCode === component.name ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy code
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info note */}
        <div className="mt-6 flex items-start gap-2 p-4 bg-gradient-to-br from-[var(--cc-canvas-soft-2)]/60 to-[var(--cc-canvas-soft-2)]/30 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)]">
          <Sparkles className="w-4 h-4 text-[var(--cc-link)] mt-0.5 shrink-0" />
          <div>
            <p className="text-body-sm font-medium text-[var(--cc-ink)] mb-1">Design system</p>
            <p className="text-caption text-[var(--cc-body)]">
              All components follow the CinaCoin design guidelines with consistent spacing, typography, and color tokens. Built for accessibility and performance.
            </p>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}

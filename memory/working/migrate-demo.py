#!/usr/bin/env python3
"""Batch migrate demo app hardcoded colors to DESIGN tokens."""
import re
import os
import glob

REPLACEMENTS = [
    # Backgrounds
    (r'\bbg-gray-50\b', 'bg-[var(--cc-canvas-soft)]'),
    (r'\bbg-gray-100\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-gray-900\b', 'bg-[var(--cc-canvas)]'),
    (r'\bbg-gray-900/80\b', 'bg-[var(--cc-canvas)]/80'),
    (r'\bbg-gray-900/50\b', 'bg-[var(--cc-canvas)]/50'),
    (r'\bbg-gray-950\b', 'bg-[var(--cc-canvas)]'),
    (r'\bbg-gray-800\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-gray-800/50\b', 'bg-[var(--cc-canvas-soft-2)]/50'),
    (r'\bbg-gray-700\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-gray-600\b', 'bg-[var(--cc-muted)]'),
    (r'\bbg-white\b', 'bg-[var(--cc-canvas)]'),
    (r'\bbg-blue-600\b', 'bg-[var(--cc-primary)]'),
    (r'\bbg-blue-700\b', 'bg-[var(--cc-primary)]'),
    (r'\bbg-emerald-500\b', 'bg-[var(--cc-success)]'),
    (r'\bbg-emerald-500/20\b', 'bg-[var(--cc-success)]/20'),
    (r'\bbg-emerald-500/10\b', 'bg-[var(--cc-success)]/10'),
    (r'\bbg-emerald-900/40\b', 'bg-[var(--cc-success)]/40'),
    (r'\bbg-emerald-900/30\b', 'bg-[var(--cc-success)]/30'),
    (r'\bbg-emerald-500/30\b', 'bg-[var(--cc-success)]/30'),
    (r'\bbg-amber-500\b', 'bg-[var(--cc-warning)]'),
    (r'\bbg-red-500\b', 'bg-[var(--cc-error)]'),
    (r'\bbg-red-500/80\b', 'bg-[var(--cc-error)]/80'),
    (r'\bbg-yellow-500\b', 'bg-[var(--cc-warning)]'),
    (r'\bbg-yellow-500/80\b', 'bg-[var(--cc-warning)]/80'),
    (r'\bbg-indigo-500\b', 'bg-[var(--cc-link)]'),
    (r'\bbg-slate-400\b', 'bg-[var(--cc-muted)]'),
    (r'\bbg-slate-800\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-slate-900\b', 'bg-[var(--cc-canvas)]'),
    
    # Text
    (r'\btext-gray-900\b', 'text-[var(--cc-ink)]'),
    (r'\btext-gray-800\b', 'text-[var(--cc-ink)]'),
    (r'\btext-gray-700\b', 'text-[var(--cc-ink)]'),
    (r'\btext-gray-600\b', 'text-[var(--cc-body)]'),
    (r'\btext-gray-500\b', 'text-[var(--cc-body)]'),
    (r'\btext-gray-400\b', 'text-[var(--cc-muted)]'),
    (r'\btext-gray-300\b', 'text-[var(--cc-body)]'),
    (r'\btext-gray-200\b', 'text-[var(--cc-body)]'),
    (r'\btext-slate-400\b', 'text-[var(--cc-muted)]'),
    (r'\btext-slate-500\b', 'text-[var(--cc-body)]'),
    (r'\btext-slate-300\b', 'text-[var(--cc-body)]'),
    (r'\btext-slate-600\b', 'text-[var(--cc-muted)]'),
    (r'\btext-white\b', 'text-[var(--cc-ink)]'),
    (r'\btext-blue-600\b', 'text-[var(--cc-primary)]'),
    (r'\btext-blue-500\b', 'text-[var(--cc-primary)]'),
    (r'\btext-emerald-400\b', 'text-[var(--cc-success)]'),
    (r'\btext-emerald-500\b', 'text-[var(--cc-success)]'),
    (r'\btext-emerald-600\b', 'text-[var(--cc-success)]'),
    (r'\btext-emerald-300\b', 'text-[var(--cc-success)]'),
    (r'\btext-red-400\b', 'text-[var(--cc-error)]'),
    (r'\btext-red-500\b', 'text-[var(--cc-error)]'),
    (r'\btext-amber-400\b', 'text-[var(--cc-warning)]'),
    (r'\btext-yellow-400\b', 'text-[var(--cc-warning)]'),
    (r'\btext-indigo-400\b', 'text-[var(--cc-link)]'),
    
    # Borders
    (r'\bborder-gray-200\b', 'border-[var(--cc-hairline)]'),
    (r'\bborder-gray-300\b', 'border-[var(--cc-hairline-strong)]'),
    (r'\bborder-gray-800\b', 'border-[var(--cc-hairline)]'),
    (r'\bborder-gray-700\b', 'border-[var(--cc-hairline-strong)]'),
    (r'\bborder-gray-600\b', 'border-[var(--cc-hairline-strong)]'),
    (r'\bborder-emerald-900/40\b', 'border-[var(--cc-success)]/40'),
    (r'\bborder-emerald-900/30\b', 'border-[var(--cc-success)]/30'),
    (r'\bborder-blue-500\b', 'border-[var(--cc-primary)]'),
    (r'\bborder-slate-600\b', 'border-[var(--cc-hairline-strong)]'),
    (r'\bborder-slate-800\b', 'border-[var(--cc-hairline)]'),
    
    # Hover
    (r'\bhover:bg-gray-50\b', 'hover:bg-[var(--cc-canvas-soft)]'),
    (r'\bhover:bg-gray-900\b', 'hover:bg-[var(--cc-canvas-soft-2)]'),
    (r'\bhover:bg-blue-700\b', 'hover:opacity-85'),
    (r'\bhover:text-gray-900\b', 'hover:text-[var(--cc-ink)]'),
    (r'\bhover:text-white\b', 'hover:text-[var(--cc-ink)]'),
    (r'\bhover:text-blue-500\b', 'hover:text-[var(--cc-primary)]'),
    (r'\bhover:text-slate-300\b', 'hover:text-[var(--cc-ink)]'),
    (r'\bhover:text-gray-300\b', 'hover:text-[var(--cc-ink)]'),
    (r'\bhover:border-gray-500\b', 'hover:border-[var(--cc-hairline-strong)]'),
    (r'\bhover:border-slate-600\b', 'hover:border-[var(--cc-hairline-strong)]'),
    
    # Focus rings
    (r'\bfocus:border-blue-500\b', 'focus:border-[var(--cc-primary)]'),
    (r'\bfocus:ring-blue-500\b', 'focus:ring-[var(--cc-primary)]'),
    
    # Shadows
    (r'\bshadow-emerald-500/30\b', 'shadow-[var(--cc-success)]/30'),
    (r'\bshadow-lg\b', 'shadow-[var(--cc-level3)]'),
]

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    original = content
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    src = '/home/cina/.openclaw/workspace/onux/apps/demo/src'
    count = 0
    for path in glob.glob(os.path.join(src, '**/*.tsx'), recursive=True):
        if process_file(path):
            count += 1
            print(f"  ✓ {os.path.relpath(path, src)}")
    for path in glob.glob(os.path.join(src, '**/*.css'), recursive=True):
        if process_file(path):
            count += 1
            print(f"  ✓ {os.path.relpath(path, src)}")
    print(f"\nMigrated {count} files")

if __name__ == '__main__':
    main()

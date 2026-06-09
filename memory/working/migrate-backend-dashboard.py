#!/usr/bin/env python3
"""Batch migrate backend-dashboard hardcoded colors to DESIGN tokens."""
import re
import os
import glob

REPLACEMENTS = [
    # Backgrounds
    (r'\bbg-gray-50\b', 'bg-[var(--cc-canvas-soft)]'),
    (r'\bbg-gray-100\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-white\b', 'bg-[var(--cc-canvas)]'),
    (r'\bbg-dark-950\b', 'bg-[var(--cc-canvas)]'),
    (r'\bbg-dark-900\b', 'bg-[var(--cc-canvas-soft)]'),
    (r'\bbg-dark-800\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-blue-600\b', 'bg-[var(--cc-primary)]'),
    (r'\bbg-blue-700\b', 'bg-[var(--cc-primary)]'),
    # Status colors - keep as-is for indicators
    (r'\bbg-emerald-500\b', 'bg-[var(--cc-success)]'),
    (r'\bbg-red-500\b', 'bg-[var(--cc-error)]'),
    (r'\bbg-amber-500\b', 'bg-[var(--cc-warning)]'),
    (r'\bbg-yellow-500\b', 'bg-[var(--cc-warning)]'),
    
    # Text
    (r'\btext-gray-900\b', 'text-[var(--cc-ink)]'),
    (r'\btext-gray-800\b', 'text-[var(--cc-ink)]'),
    (r'\btext-gray-700\b', 'text-[var(--cc-ink)]'),
    (r'\btext-gray-600\b', 'text-[var(--cc-body)]'),
    (r'\btext-gray-500\b', 'text-[var(--cc-body)]'),
    (r'\btext-gray-400\b', 'text-[var(--cc-muted)]'),
    (r'\btext-slate-400\b', 'text-[var(--cc-muted)]'),
    (r'\btext-white\b', 'text-[var(--cc-ink)]'),
    (r'\btext-blue-600\b', 'text-[var(--cc-primary)]'),
    (r'\btext-blue-500\b', 'text-[var(--cc-primary)]'),
    (r'\btext-red-400\b', 'text-[var(--cc-error)]'),
    (r'\btext-emerald-400\b', 'text-[var(--cc-success)]'),
    (r'\btext-emerald-500\b', 'text-[var(--cc-success)]'),
    (r'\btext-amber-400\b', 'text-[var(--cc-warning)]'),
    (r'\btext-yellow-400\b', 'text-[var(--cc-warning)]'),
    
    # Borders
    (r'\bborder-gray-200\b', 'border-[var(--cc-hairline)]'),
    (r'\bborder-gray-300\b', 'border-[var(--cc-hairline-strong)]'),
    (r'\bborder-dark-800\b', 'border-[var(--cc-hairline)]'),
    (r'\bborder-blue-500\b', 'border-[var(--cc-primary)]'),
    (r'\bborder-slate-600\b', 'border-[var(--cc-hairline-strong)]'),
    
    # Hover
    (r'\bhover:bg-gray-50\b', 'hover:bg-[var(--cc-canvas-soft)]'),
    (r'\bhover:bg-blue-700\b', 'hover:opacity-85'),
    (r'\bhover:text-gray-900\b', 'hover:text-[var(--cc-ink)]'),
    (r'\bhover:text-white\b', 'hover:text-[var(--cc-ink)]'),
    (r'\bhover:text-blue-500\b', 'hover:text-[var(--cc-primary)]'),
    (r'\bhover:text-slate-300\b', 'hover:text-[var(--cc-ink)]'),
    (r'\bhover:border-gray-500\b', 'hover:border-[var(--cc-hairline-strong)]'),
    (r'\bhover:border-slate-600\b', 'hover:border-[var(--cc-hairline-strong)]'),
    (r'\bhover:bg-gray-900\b', 'hover:bg-[var(--cc-canvas-soft-2)]'),
    
    # Focus rings
    (r'\bfocus:border-blue-500\b', 'focus:border-[var(--cc-primary)]'),
    (r'\bfocus:ring-blue-500\b', 'focus:ring-[var(--cc-primary)]'),
    
    # Shadows
    (r'\bshadow-sm\b', 'shadow-[var(--cc-level1)]'),
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
    src = '/home/cina/.openclaw/workspace/onux/apps/backend-dashboard/src'
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

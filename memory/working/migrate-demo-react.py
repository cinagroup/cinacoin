#!/usr/bin/env python3
"""Migrate demo-react from dark-mode crypto UI to DESIGN.md light theme."""
import re
import glob
import os

REPLACEMENTS = [
    # Dark backgrounds → light canvas
    (r'\bbg-gray-950\b', 'bg-[var(--cc-canvas)]'),
    (r'\bbg-gray-900\b', 'bg-[var(--cc-canvas-soft)]'),
    (r'\bbg-gray-800\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-gray-700\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-\[#030712\]\b', 'bg-[var(--cc-canvas-soft)]'),
    (r'\bbg-\[#0a0a0a\]\b', 'bg-[var(--cc-canvas)]'),
    (r'\bbg-\[#111827\]\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-\[#1f2937\]\b', 'bg-[var(--cc-canvas-soft-2)]'),
    (r'\bbg-\[rgba\(255,\s*255,\s*255,\s*0\.\d+\)\]\b', 'bg-[var(--cc-canvas)]'),
    (r'\bbg-white\/5\b', 'bg-[var(--cc-canvas-soft)]/50'),
    (r'\bbg-white\/10\b', 'bg-[var(--cc-canvas-soft)]'),
    
    # Dark text → ink
    (r'\btext-gray-100\b', 'text-[var(--cc-ink)]'),
    (r'\btext-gray-200\b', 'text-[var(--cc-ink)]'),
    (r'\btext-gray-300\b', 'text-[var(--cc-body)]'),
    (r'\btext-gray-400\b', 'text-[var(--cc-muted)]'),
    (r'\btext-gray-500\b', 'text-[var(--cc-muted)]'),
    (r'\btext-gray-600\b', 'text-[var(--cc-muted)]'),
    (r'\btext-white\b', 'text-[var(--cc-ink)]'),
    (r'\btext-\[#f9fafb\]\b', 'text-[var(--cc-ink)]'),
    (r'\btext-\[#e5e7eb\]\b', 'text-[var(--cc-body)]'),
    
    # Dark borders → hairline
    (r'\bborder-gray-800\b', 'border-[var(--cc-hairline)]'),
    (r'\bborder-gray-700\b', 'border-[var(--cc-hairline-strong)]'),
    (r'\bborder-gray-600\b', 'border-[var(--cc-hairline-strong)]'),
    (r'\bborder-white\/10\b', 'border-[var(--cc-hairline)]'),
    (r'\bborder-white\/20\b', 'border-[var(--cc-hairline)]'),
    (r'\bborder-white\/30\b', 'border-[var(--cc-hairline-strong)]'),
    (r'\bborder-\[rgba\(255,\s*255,\s*255,\s*0\.\d+\)\]\b', 'border-[var(--cc-hairline)]'),
    
    # Gradient text classes → plain text
    (r'\bgradient-text\b', ''),
    (r'\bfrom-blue-400\b', 'text-[var(--cc-link)]'),
    (r'\bto-violet-400\b', ''),
    (r'\bfrom-blue-600\b', 'text-[var(--cc-primary)]'),
    (r'\bto-violet-600\b', ''),
    (r'\bfrom-violet-500\b', 'text-[var(--cc-violet)]'),
    (r'\bto-cyan-500\b', ''),
    (r'\bfrom-blue-500\b', 'text-[var(--cc-link)]'),
    (r'\bto-blue-400\b', ''),
    (r'\bbg-clip-text\b', ''),
    (r'\btext-transparent\b', 'text-[var(--cc-ink)]'),
    (r'\bfrom-\[#[0-9a-fA-F]+\]\b', ''),
    (r'\bvia-\[#[0-9a-fA-F]+\]\b', ''),
    (r'\bto-\[#[0-9a-fA-F]+\]\b', ''),
    
    # Glass card → cc-card
    (r'\bglass-card\b', 'cc-card'),
    (r'\bglass-card-hover\b', 'cc-card'),
    
    # Font weight violations
    (r'\bfont-bold\b', 'font-semibold'),
    (r'\bfont-black\b', 'font-semibold'),
    (r'\bfont-extrabold\b', 'font-semibold'),
    
    # Hover colors
    (r'\bhover:text-gray-300\b', 'hover:text-[var(--cc-ink)]'),
    (r'\bhover:text-gray-100\b', 'hover:text-[var(--cc-ink)]'),
    (r'\bhover:bg-gray-800\b', 'hover:bg-[var(--cc-canvas-soft-2)]'),
    (r'\bhover:border-gray-600\b', 'hover:border-[var(--cc-hairline-strong)]'),
    (r'\bhover:border-white\/30\b', 'hover:border-[var(--cc-hairline-strong)]'),
    (r'\bhover:bg-white\/10\b', 'hover:bg-[var(--cc-canvas-soft-2)]'),
    
    # Button styles
    (r'\bbtn-primary\b', 'btn-primary'),  # keep, but CSS is updated
    (r'\bbtn-secondary\b', 'btn-secondary'),
    
    # Shadows
    (r'\bshadow-\[0_8px_30px_rgba\(59,\s*130,\s*246,\s*0\.\d+\)\]\b', 'shadow-[var(--cc-level3)]'),
    (r'\bshadow-\[0_6px_25px_rgba\(59,\s*130,\s*246,\s*0\.\d+\)\]\b', 'shadow-[var(--cc-level3)]'),
    (r'\bshadow-\[0_4px_15px_rgba\(59,\s*130,\s*246,\s*0\.\d+\)\]\b', 'shadow-[var(--cc-level2)]'),
    
    # Tracking violations
    (r'\btracking-wider\b', 'tracking-normal'),
    (r'\btracking-widest\b', 'tracking-normal'),
]

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    original = content
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    # Clean up double spaces
    content = re.sub(r'  +', ' ', content)
    # Clean up empty className=""
    content = re.sub(r'className=""', '', content)
    # Clean up trailing spaces in className
    content = re.sub(r'className=" ', 'className="', content)
    content = re.sub(r' "', '"', content)
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    src = '/home/cina/.openclaw/workspace/onux/apps/demo-react/src'
    count = 0
    for path in glob.glob(os.path.join(src, '**/*.tsx'), recursive=True):
        if process_file(path):
            count += 1
            print(f"  ✓ {os.path.relpath(path, src)}")
    print(f"\nMigrated {count} files")

if __name__ == '__main__':
    main()

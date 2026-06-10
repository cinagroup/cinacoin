#!/bin/bash

# Typography standardization script
# Replaces Tailwind font classes with custom typography classes

set -e

echo "Starting typography standardization..."

# Find all TSX/TS files excluding node_modules, .next, dist, out
FILES=$(find apps/ -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/out/*")

echo "Found $(echo "$FILES" | wc -l) files to process"

# Replace font-mono with font-[var(--font-mono)]
echo "Replacing font-mono..."
echo "$FILES" | xargs sed -i 's/font-mono/font-\[var\(--font-mono\)\]/g'

# Replace text sizes
echo "Replacing text-xs..."
echo "$FILES" | xargs sed -i 's/text-xs/text-\[12px\]/g'

echo "Replacing text-sm..."
echo "$FILES" | xargs sed -i 's/text-sm/text-\[14px\]/g'

echo "Replacing text-base..."
echo "$FILES" | xargs sed -i 's/text-base/text-\[16px\]/g'

echo "Replacing text-lg..."
echo "$FILES" | xargs sed -i 's/text-lg/text-\[18px\]/g'

echo "Replacing text-xl..."
echo "$FILES" | xargs sed -i 's/text-xl/text-\[20px\]/g'

echo "Replacing text-2xl..."
echo "$FILES" | xargs sed -i 's/text-2xl/text-\[24px\]/g'

echo "Replacing text-3xl..."
echo "$FILES" | xargs sed -i 's/text-3xl/text-\[32px\]/g'

echo "Replacing text-4xl..."
echo "$FILES" | xargs sed -i 's/text-4xl/text-\[48px\]/g'

# Remove font-sans (it's the default)
echo "Removing font-sans..."
echo "$FILES" | xargs sed -i 's/font-sans //g'
echo "$FILES" | xargs sed -i 's/ font-sans//g'

echo "Typography standardization complete!"

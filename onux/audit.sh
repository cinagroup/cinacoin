#!/bin/bash
# Cinacoin Design Audit Script
# Checks all sites against DESIGN.md spec

echo "========================================"
echo "  CINACOIN DESIGN AUDIT REPORT"
echo "  $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "========================================"
echo ""

cd /home/cina/.openclaw/workspace/onux

echo "=== 1. LOGO CONSISTENCY ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  f="apps/$app/public/logo.png"
  if [ -f "$f" ]; then
    hash=$(md5sum "$f" | cut -d' ' -f1)
    size=$(wc -c < "$f")
    echo "  ✅ $app: ${size}B md5=$hash"
  else
    echo "  ❌ $app: MISSING logo.png"
  fi
done
echo ""

echo "=== 2. FONT-WEIGHT AUDIT ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  dir="apps/$app/src"
  if [ -d "$dir" ]; then
    bold_count=$(grep -rn "font-bold\|font-extrabold\|font-black" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    semibold_count=$(grep -rn "font-semibold" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    if [ "$bold_count" -eq 0 ]; then
      echo "  ✅ $app: 0 violations (font-semibold: $semibold_count)"
    else
      echo "  ❌ $app: $bold_count font-bold/extrabold violations (should be font-semibold)"
      grep -rn "font-bold\|font-extrabold\|font-black" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | head -5 | sed 's/^/     /'
    fi
  fi
done
echo ""

echo "=== 3. BORDER RADIUS AUDIT ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  dir="apps/$app/src"
  if [ -d "$dir" ]; then
    r2xl=$(grep -rn "rounded-2xl\|rounded-3xl" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    if [ "$r2xl" -eq 0 ]; then
      echo "  ✅ $app: 0 rounded-2xl/3xl violations"
    else
      echo "  ❌ $app: $r2xl rounded-2xl/3xl violations"
    fi
  fi
done
echo ""

echo "=== 4. SHADOW AUDIT ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  dir="apps/$app/src"
  if [ -d "$dir" ]; then
    s2xl=$(grep -rn "shadow-2xl" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    if [ "$s2xl" -eq 0 ]; then
      echo "  ✅ $app: 0 shadow-2xl violations"
    else
      echo "  ❌ $app: $s2xl shadow-2xl violations"
    fi
  fi
done
echo ""

echo "=== 5. TYPOGRAPHY TRACKING AUDIT ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  dir="apps/$app/src"
  if [ -d "$dir" ]; then
    tracking_tight=$(grep -rn "tracking-tight\|tracking-tighter" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    echo "  ℹ️  $app: $tracking_tight tracking-tight/tighter instances"
  fi
done
echo ""

echo "=== 6. CSS VARIABLES AUDIT ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  dir="apps/$app/src"
  if [ -d "$dir" ]; then
    css_vars=$(grep -rn "var(--cc-" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    hard_gray=$(grep -rn "bg-gray-950\|bg-gray-900\|bg-gray-800\|text-gray-300\|text-gray-400\|text-gray-500" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    if [ "$hard_gray" -eq 0 ]; then
      echo "  ✅ $app: CSS vars=$css_vars, 0 hard-coded gray"
    else
      echo "  ❌ $app: CSS vars=$css_vars, $hard_gray hard-coded gray values"
      grep -rn "bg-gray-950\|bg-gray-900\|bg-gray-800\|text-gray-300\|text-gray-400\|text-gray-500" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | head -5 | sed 's/^/     /'
    fi
  fi
done
echo ""

echo "=== 7. HERO GRADIENT AUDIT ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  dir="apps/$app/src"
  if [ -d "$dir" ]; then
    gradient=$(grep -rn "gradient-develop\|gradient-preview\|gradient-ship\|from-#007cf0\|from-brand-" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    echo "  ℹ️  $app: $gradient gradient instances"
  fi
done
echo ""

echo "=== 8. NAV BAR HEIGHT AUDIT ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  dir="apps/$app/src"
  if [ -d "$dir" ]; then
    h16=$(grep -rn "h-16" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    echo "  ℹ️  $app: $h16 h-16 (64px) nav instances"
  fi
done
echo ""

echo "=== 9. PILl BUTTON AUDIT ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  dir="apps/$app/src"
  if [ -d "$dir" ]; then
    pill=$(grep -rn "rounded-\[100px\]" "$dir" --include="*.tsx" --include="*.css" 2>/dev/null | grep -v node_modules | wc -l)
    echo "  ℹ️  $app: $pill pill button instances"
  fi
done
echo ""

echo "=== 10. BRAND LOGO IN UI AUDIT ==="
echo ""
for app in demo demo-react backend-dashboard health-status website; do
  dir="apps/$app/src"
  if [ -d "$dir" ]; then
    logo_img=$(grep -rn '<img.*logo\|<Image.*logo' "$dir" --include="*.tsx" 2>/dev/null | grep -v node_modules | wc -l)
    echo "  $app: $logo_img logo image references in UI"
    if [ "$logo_img" -eq 0 ]; then
      echo "    ⚠️  No logo image found in UI!"
    fi
  fi
done
echo ""

echo "=== 11. DEPLOYED HTML AUDIT ==="
echo ""
for app in demo health-status website; do
  dir="apps/$app/out"
  if [ -d "$dir" ] && [ -f "$dir/index.html" ]; then
    logo_img=$(grep -o '<img[^>]*logo[^>]*>' "$dir/index.html" 2>/dev/null | wc -l)
    font_bold=$(grep -o 'font-bold\|font-extrabold\|font-black' "$dir/index.html" 2>/dev/null | wc -l)
    echo "  $app/out/index.html: logo_img=$logo_img, font-bold=$font_bold"
  fi
done
echo ""

echo "=== 12. DEMO-REACT BUILT HTML AUDIT ==="
echo ""
if [ -f "apps/demo-react/dist/index.html" ]; then
  logo_img=$(grep -o '<img[^>]*logo[^>]*>' apps/demo-react/dist/index.html 2>/dev/null | wc -l)
  font_bold=$(grep -o 'font-bold\|font-extrabold\|font-black' apps/demo-react/dist/index.html 2>/dev/null | wc -l)
  hard_gray=$(grep -o 'bg-gray-950\|bg-gray-900\|bg-gray-800\|text-gray-300\|text-gray-400\|text-gray-500' apps/demo-react/dist/index.html 2>/dev/null | wc -l)
  echo "  demo-react/dist/index.html: logo_img=$logo_img, font-bold=$font_bold, hard_gray=$hard_gray"
fi
echo ""

echo "========================================"
echo "  AUDIT COMPLETE"
echo "========================================"

#!/bin/bash

# Vercel Design Style Audit Script
# Scans for anti-patterns in backend-dashboard, cloud-dashboard, unified-dashboard

APPS="apps/backend-dashboard apps/cloud-dashboard apps/unified-dashboard"

echo "═══════════════════════════════════════════════════════════════"
echo "  VERCEL DESIGN STYLE AUDIT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

for app in $APPS; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  $app"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ ! -d "$app" ]; then
    echo "  ⚠️  Directory not found"
    continue
  fi
  
  # 1. Gradient avatars
  echo ""
  echo "1️⃣  Gradient avatars (should be solid colors):"
  grep -r "bg-gradient.*rounded-full\|gradient.*avatar" "$app/src" --include="*.tsx" --include="*.jsx" 2>/dev/null | head -5 || echo "  ✓ None found"
  
  # 2. Emoji icons
  echo ""
  echo "2️⃣  Emoji icons (should use Lucide icons):"
  grep -rE '⚠️|✅|❌|🔥|💡|🎉|⚡|🚀|📊|📈|🔍|⚙️|🔧|💰|🎯|✨|🌟|💎|🔔|📢|👤|🔐|🔓|🛡️|⚠|✓|✗|×|→|←|↑|↓' "$app/src" --include="*.tsx" --include="*.jsx" 2>/dev/null | head -5 || echo "  ✓ None found"
  
  # 3. Font weight > 600
  echo ""
  echo "3️⃣  Font weight > 600 (max should be 600):"
  grep -rE "font-(bold|extrabold|black)|fontWeight.*[7-9]00|font-weight.*[7-9]00" "$app/src" --include="*.tsx" --include="*.jsx" --include="*.css" 2>/dev/null | grep -v "node_modules\|\.next\|\.vercel" | head -5 || echo "  ✓ None found"
  
  # 4. Hardcoded colors
  echo ""
  echo "4️⃣  Hardcoded colors (should use CSS variables):"
  grep -rE "color:.*#[0-9a-fA-F]{3,6}|background:.*#[0-9a-fA-F]{3,6}|bg-#[0-9a-fA-F]{3,6}|text-#[0-9a-fA-F]{3,6}" "$app/src" --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "node_modules\|\.next\|\.vercel\|var(--" | head -10 || echo "  ✓ None found"
  
  # 5. Uppercase text
  echo ""
  echo "5️⃣  Uppercase text (should be sentence case):"
  grep -rE "text-transform:\s*uppercase|uppercase\(" "$app/src" --include="*.tsx" --include="*.jsx" --include="*.css" 2>/dev/null | grep -v "node_modules\|\.next\|\.vercel" | head -5 || echo "  ✓ None found"
  
  # 6. Pure black #000000
  echo ""
  echo "6️⃣  Pure black #000000 (should use #171717):"
  grep -rE "#000000|#000[^0-9a-fA-F]" "$app/src" --include="*.tsx" --include="*.jsx" --include="*.css" 2>/dev/null | grep -v "node_modules\|\.next\|\.vercel" | head -5 || echo "  ✓ None found"
  
  # 7. Colored shadows
  echo ""
  echo "7️⃣  Colored shadows (should be gray stacked shadows):"
  grep -rE "shadow.*#[0-9a-fA-F]{3,6}|boxShadow.*#[0-9a-fA-F]{3,6}" "$app/src" --include="*.tsx" --include="*.jsx" --include="*.css" 2>/dev/null | grep -v "node_modules\|\.next\|\.vercel\|rgba(0, 0, 0" | head -5 || echo "  ✓ None found"
  
  # 8. Mesh gradients
  echo ""
  echo "8️⃣  Mesh gradients (dashboards shouldn't have marketing gradients):"
  grep -rE "mesh-gradient|radial-gradient.*conic-gradient|background.*conic-gradient" "$app/src" --include="*.tsx" --include="*.jsx" --include="*.css" 2>/dev/null | grep -v "node_modules\|\.next\|\.vercel" | head -5 || echo "  ✓ None found"
  
  echo ""
done

echo "═══════════════════════════════════════════════════════════════"
echo "  AUDIT COMPLETE"
echo "═══════════════════════════════════════════════════════════════"

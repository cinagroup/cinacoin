#!/bin/bash
# Comprehensive site testing script for Cinacoin deployed sites

SITES=(
  "cinacoin-main|https://cinacoin.com"
  "cinacoin-demo|https://demo.cinacoin.com"
  "cinacoin-dashboard|https://dash.cinacoin.com"
  "cinacoin-docs|https://docs.cinacoin.com"
  "cinacoin-status|https://status.cinacoin.com"
)

echo "🔍 Cinacoin Site Testing - $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "========================================================"

for site_entry in "${SITES[@]}"; do
  IFS='|' read -r name url <<< "$site_entry"
  
  echo ""
  echo "📍 Testing: $name ($url)"
  echo "--------------------------------------------------------"
  
  # Test 1: Basic HTTP
  echo -n "  📡 HTTP Status: "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 15 "$url" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo "✅ $STATUS"
  elif [ "$STATUS" = "000" ]; then
    echo "❌ Connection failed"
  else
    echo "⚠️ $STATUS"
  fi
  
  # Test 2: Response time
  echo -n "  ⏱️  Response Time: "
  TIME=$(curl -s -o /dev/null -w "%{time_total}" -L --max-time 15 "$url" 2>/dev/null)
  if [ -n "$TIME" ] && [ "$TIME" != "0.000000" ]; then
    echo "${TIME}s"
  else
    echo "Timeout"
  fi
  
  # Test 3: HTTPS
  echo -n "  🔒 HTTPS: "
  HTTPS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${url#*://}" 2>/dev/null)
  if [ "$HTTPS" = "200" ]; then
    echo "✅ Working"
  else
    echo "❌ Failed ($HTTPS)"
  fi
  
  # Test 4: Security headers
  HEADERS=$(curl -sI -L --max-time 10 "$url" 2>/dev/null)
  echo "  🛡️  Security Headers:"
  echo "$HEADERS" | grep -i "strict-transport" && echo "     ✅ HSTS" || echo "     ❌ HSTS missing"
  echo "$HEADERS" | grep -i "x-content-type" && echo "     ✅ X-Content-Type-Options" || echo "     ❌ X-Content-Type-Options missing"
  echo "$HEADERS" | grep -i "x-frame" && echo "     ✅ X-Frame-Options" || echo "     ❌ X-Frame-Options missing"
  echo "$HEADERS" | grep -i "content-security" && echo "     ✅ CSP" || echo "     ❌ CSP missing"
  
  # Test 5: Content size
  SIZE=$(curl -s -o /dev/null -w "%{size_download}" -L --max-time 15 "$url" 2>/dev/null)
  echo "  📦 Page Size: $(( ${SIZE:-0} / 1024 ))KB"
  
  # Test 6: SSL Certificate
  echo -n "  📜 SSL: "
  SSL=$(curl -sv "https://${url#*://}" 2>&1 | grep -i "expire date" | head -1)
  if [ -n "$SSL" ]; then
    echo "✅ $SSL"
  else
    echo "⚠️ Could not verify"
  fi
done

echo ""
echo "========================================================"
echo "✅ Testing complete!"

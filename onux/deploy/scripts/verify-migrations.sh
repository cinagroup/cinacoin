#!/bin/bash
# Verify all migrations completed successfully

set -e

echo "🔍 Verifying Cinacoin Phase 2 Database Migrations..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ERRORS=0

# Check Auth Service
echo "1️⃣  Auth Service (cinacoin_auth)"
if [ -z "$AUTH_DATABASE_URL" ]; then
    echo -e "${RED}✗ AUTH_DATABASE_URL not set${NC}"
    ERRORS=$((ERRORS + 1))
else
    TABLES=$(psql "$AUTH_DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    if [ "$TABLES" -ge 12 ]; then
        echo -e "${GREEN}✓ Auth Service: $TABLES tables created${NC}"
    else
        echo -e "${RED}✗ Auth Service: Expected 12+ tables, found $TABLES${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""

# Check User Service
echo "2️⃣  User Service (cinacoin_users)"
if [ -z "$USER_DATABASE_URL" ]; then
    echo -e "${RED}✗ USER_DATABASE_URL not set${NC}"
    ERRORS=$((ERRORS + 1))
else
    TABLES=$(psql "$USER_DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    PERMS=$(psql "$USER_DATABASE_URL" -t -c "SELECT COUNT(*) FROM permissions;" | xargs)
    
    if [ "$TABLES" -ge 5 ]; then
        echo -e "${GREEN}✓ User Service: $TABLES tables created${NC}"
    else
        echo -e "${RED}✗ User Service: Expected 5+ tables, found $TABLES${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ "$PERMS" -eq 13 ]; then
        echo -e "${GREEN}✓ User Service: $PERMS permissions seeded${NC}"
    else
        echo -e "${RED}✗ User Service: Expected 13 permissions, found $PERMS${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""

# Check API Gateway (PostgreSQL mode)
echo "3️⃣  API Gateway (cinacoin_gateway)"
if [ -n "$GATEWAY_DATABASE_URL" ]; then
    TABLES=$(psql "$GATEWAY_DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    if [ "$TABLES" -ge 4 ]; then
        echo -e "${GREEN}✓ API Gateway: $TABLES tables created${NC}"
    else
        echo -e "${RED}✗ API Gateway: Expected 4+ tables, found $TABLES${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "⚠ GATEWAY_DATABASE_URL not set (skipping PostgreSQL check)"
    echo "  (If using D1, run: wrangler d1 execute cinacoin-gateway-prod --command=\"SELECT COUNT(*) FROM sqlite_master WHERE type='table';\" --remote)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All migrations verified successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    exit 1
fi

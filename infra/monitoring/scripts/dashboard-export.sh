#!/bin/bash
# Cinacoin — Grafana Dashboard Export Script
# Exports all dashboards to JSON files for backup or version control
#
# Usage:
#   ./dashboard-export.sh                    # Export all dashboards
#   ./dashboard-export.sh <dashboard-uid>    # Export specific dashboard
#   ./dashboard-export.sh --list             # List all dashboards
#
# Examples:
#   ./dashboard-export.sh cinacoin-overview
#   ./dashboard-export.sh --list

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Grafana configuration
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"
GRAFANA_API_KEY="${GRAFANA_API_KEY:-}"
EXPORT_DIR="${EXPORT_DIR:-./dashboard-backups}"

# Parse arguments
DASHBOARD_UID=""
LIST_DASHBOARDS=false

for arg in "$@"; do
  case $arg in
    --list|-l)
      LIST_DASHBOARDS=true
      ;;
    --help|-h)
      echo "Usage: $0 [dashboard-uid] [--list]"
      echo ""
      echo "Options:"
      echo "  --list, -l    List all available dashboards"
      echo "  --help, -h    Show this help message"
      echo ""
      echo "Environment Variables:"
      echo "  GRAFANA_URL       Grafana URL (default: http://localhost:3000)"
      echo "  GRAFANA_API_KEY   API key for authentication"
      echo "  EXPORT_DIR        Export directory (default: ./dashboard-backups)"
      echo ""
      echo "Examples:"
      echo "  $0 cinacoin-overview"
      echo "  $0 --list"
      exit 0
      ;;
    *)
      if [[ -n "$arg" && "$arg" != "--"* ]]; then
        DASHBOARD_UID="$arg"
      fi
      ;;
  esac
done

# Check Grafana connectivity
check_grafana() {
  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" "$GRAFANA_URL/api/health" 2>&1) || {
    echo -e "${RED}✗ Cannot connect to Grafana at $GRAFANA_URL${NC}"
    exit 1
  }
  
  if [[ "$response" != "200" ]]; then
    echo -e "${RED}✗ Grafana is not healthy (HTTP $response)${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Connected to Grafana at $GRAFANA_URL${NC}"
}

# Get auth header
get_auth_header() {
  if [[ -n "$GRAFANA_API_KEY" ]]; then
    echo "Authorization: Bearer $GRAFANA_API_KEY"
  else
    echo ""
  fi
}

# List all dashboards
list_dashboards() {
  echo -e "\n${BLUE}Available Dashboards:${NC}"
  
  local auth_header
  auth_header=$(get_auth_header)
  
  local response
  if [[ -n "$auth_header" ]]; then
    response=$(curl -s -H "$auth_header" "$GRAFANA_URL/api/search?type=dash-db" 2>&1)
  else
    response=$(curl -s "$GRAFANA_URL/api/search?type=dash-db" 2>&1)
  fi
  
  local count
  count=$(echo "$response" | jq -r 'length' 2>/dev/null) || {
    echo -e "${RED}✗ Failed to fetch dashboards${NC}"
    return 1
  }
  
  if [[ "$count" -eq 0 ]]; then
    echo -e "${YELLOW}No dashboards found${NC}"
    return 0
  fi
  
  echo "$response" | jq -r '.[] | "  • \(.uid) - \(.title)"' 2>/dev/null || true
  echo -e "\n${BLUE}Total:${NC} $count dashboards"
}

# Export a single dashboard
export_dashboard() {
  local uid="$1"
  
  echo -e "\n${BLUE}Exporting:${NC} $uid"
  
  local auth_header
  auth_header=$(get_auth_header)
  
  local response
  if [[ -n "$auth_header" ]]; then
    response=$(curl -s -H "$auth_header" "$GRAFANA_URL/api/dashboards/uid/$uid" 2>&1)
  else
    response=$(curl -s "$GRAFANA_URL/api/dashboards/uid/$uid" 2>&1)
  fi
  
  # Check if dashboard exists
  local status
  status=$(echo "$response" | jq -r '.message' 2>/dev/null)
  
  if [[ "$status" == "Dashboard not found" ]]; then
    echo -e "${RED}✗ Dashboard not found: $uid${NC}"
    return 1
  fi
  
  # Extract dashboard JSON
  local dashboard_json
  dashboard_json=$(echo "$response" | jq '.dashboard' 2>/dev/null) || {
    echo -e "${RED}✗ Invalid response${NC}"
    return 1
  }
  
  # Get dashboard title for filename
  local title
  title=$(echo "$dashboard_json" | jq -r '.title' 2>/dev/null)
  
  # Create export directory
  mkdir -p "$EXPORT_DIR"
  
  # Save to file
  local filename="$EXPORT_DIR/${uid}.json"
  echo "$dashboard_json" | jq '.' > "$filename"
  
  local size
  size=$(wc -c < "$filename")
  
  echo -e "${GREEN}✓ Exported:${NC} $title"
  echo -e "  File: $filename"
  echo -e "  Size: $size bytes"
}

# Export all dashboards
export_all_dashboards() {
  echo -e "\n${BLUE}Exporting all dashboards...${NC}"
  
  local auth_header
  auth_header=$(get_auth_header)
  
  local response
  if [[ -n "$auth_header" ]]; then
    response=$(curl -s -H "$auth_header" "$GRAFANA_URL/api/search?type=dash-db" 2>&1)
  else
    response=$(curl -s "$GRAFANA_URL/api/search?type=dash-db" 2>&1)
  fi
  
  local count
  count=$(echo "$response" | jq -r 'length' 2>/dev/null) || {
    echo -e "${RED}✗ Failed to fetch dashboard list${NC}"
    return 1
  }
  
  if [[ "$count" -eq 0 ]]; then
    echo -e "${YELLOW}No dashboards to export${NC}"
    return 0
  fi
  
  local exported=0
  local failed=0
  
  echo "$response" | jq -r '.[].uid' 2>/dev/null | while read -r uid; do
    export_dashboard "$uid" && exported=$((exported + 1)) || failed=$((failed + 1))
  done
  
  echo -e "\n${BLUE}Export Summary:${NC}"
  echo -e "  Total:     $count"
  echo -e "  Exported:  ${GREEN}$exported${NC}"
  echo -e "  Failed:    ${RED}$failed${NC}"
  echo -e "  Directory: $EXPORT_DIR"
}

# Main
main() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║       Grafana Dashboard Export                        ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  # Check connectivity
  check_grafana
  
  # List dashboards if requested
  if [[ "$LIST_DASHBOARDS" == true ]]; then
    list_dashboards
    exit 0
  fi
  
  # Export dashboards
  if [[ -n "$DASHBOARD_UID" ]]; then
    export_dashboard "$DASHBOARD_UID"
  else
    export_all_dashboards
  fi
  
  echo -e "\n${GREEN}✓ Export complete!${NC}"
}

main

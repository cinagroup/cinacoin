#!/bin/bash
# Cinacoin — Service Health Check Script
# Performs comprehensive health checks on all Cinacoin services
#
# Usage:
#   ./health-check.sh              # Check all services
#   ./health-check.sh <service>    # Check specific service
#   ./health-check.sh --json       # Output in JSON format
#
# Examples:
#   ./health-check.sh rpc-proxy
#   ./health-check.sh --json > health.json

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services to check
declare -A SERVICES=(
  ["rpc-proxy"]="https://rpc.cinacoin.com/health"
  ["keys-server"]="https://keys.cinacoin.com/health"
  ["relay-server"]="https://relay.cinacoin.com/health"
  ["notify-server"]="https://notify.cinacoin.com/health"
  ["push-server"]="https://push.cinacoin.com/health"
  ["monitoring"]="https://monitoring.cinacoin.com/health"
  ["grafana"]="https://grafana.cinacoin.com/api/health"
  ["prometheus"]="https://prometheus.cinacoin.com/-/healthy"
)

# Timeout in seconds
TIMEOUT=10

# Output format
JSON_OUTPUT=false

# Parse arguments
SERVICE_TO_CHECK=""
for arg in "$@"; do
  case $arg in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [service] [--json]"
      echo ""
      echo "Services: ${!SERVICES[*]}"
      exit 0
      ;;
    *)
      if [[ -n "$arg" && "$arg" != "--"* ]]; then
        SERVICE_TO_CHECK="$arg"
      fi
      ;;
  esac
done

# Results array
declare -a RESULTS=()

# Check function
check_service() {
  local name="$1"
  local url="$2"
  
  local start_time=$(date +%s%N)
  local response
  local http_code
  local end_time
  local duration_ms
  
  # Make request
  response=$(curl -s -w "\n%{http_code}" --max-time "$TIMEOUT" "$url" 2>&1) || {
    http_code="000"
    duration_ms=0
    RESULTS+=("{\"service\":\"$name\",\"status\":\"down\",\"http_code\":$http_code,\"response_time_ms\":$duration_ms,\"error\":\"Connection failed\"}")
    return 1
  }
  
  end_time=$(date +%s%N)
  duration_ms=$(( (end_time - start_time) / 1000000 ))
  
  # Extract HTTP code (last line)
  http_code=$(echo "$response" | tail -n1)
  
  # Check status
  if [[ "$http_code" == "200" ]]; then
    RESULTS+=("{\"service\":\"$name\",\"status\":\"healthy\",\"http_code\":$http_code,\"response_time_ms\":$duration_ms}")
    return 0
  elif [[ "$http_code" =~ ^(4|5) ]]; then
    RESULTS+=("{\"service\":\"$name\",\"status\":\"error\",\"http_code\":$http_code,\"response_time_ms\":$duration_ms}")
    return 1
  else
    RESULTS+=("{\"service\":\"$name\",\"status\":\"unknown\",\"http_code\":$http_code,\"response_time_ms\":$duration_ms}")
    return 1
  fi
}

# Print results
print_results() {
  local total=0
  local healthy=0
  local down=0
  
  echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║       Cinacoin Service Health Check                   ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  for result in "${RESULTS[@]}"; do
    local service=$(echo "$result" | jq -r '.service')
    local status=$(echo "$result" | jq -r '.status')
    local http_code=$(echo "$result" | jq -r '.http_code')
    local response_time=$(echo "$result" | jq -r '.response_time_ms')
    
    total=$((total + 1))
    
    if [[ "$status" == "healthy" ]]; then
      healthy=$((healthy + 1))
      echo -e "${GREEN}✓${NC} $service: ${GREEN}HEALTHY${NC} (HTTP $http_code, ${response_time}ms)"
    elif [[ "$status" == "down" ]]; then
      down=$((down + 1))
      echo -e "${RED}✗${NC} $service: ${RED}DOWN${NC} (HTTP $http_code)"
    else
      down=$((down + 1))
      echo -e "${YELLOW}⚠${NC} $service: ${YELLOW}$status${NC} (HTTP $http_code, ${response_time}ms)"
    fi
  done
  
  echo ""
  echo -e "${BLUE}Summary:${NC}"
  echo -e "  Total:    $total"
  echo -e "  Healthy:  ${GREEN}$healthy${NC}"
  echo -e "  Down:     ${RED}$down${NC}"
  echo ""
  
  if [[ $down -gt 0 ]]; then
    echo -e "${RED}⚠ Some services are unhealthy!${NC}"
    return 1
  else
    echo -e "${GREEN}✓ All services are healthy!${NC}"
    return 0
  fi
}

# Main
main() {
  if [[ -n "$SERVICE_TO_CHECK" ]]; then
    # Check specific service
    if [[ -z "${SERVICES[$SERVICE_TO_CHECK]+_}" ]]; then
      echo -e "${RED}Error: Unknown service '$SERVICE_TO_CHECK'${NC}"
      echo "Available services: ${!SERVICES[*]}"
      exit 1
    fi
    check_service "$SERVICE_TO_CHECK" "${SERVICES[$SERVICE_TO_CHECK]}"
  else
    # Check all services
    for service in "${!SERVICES[@]}"; do
      check_service "$service" "${SERVICES[$service]}" || true
    done
  fi
  
  # Output results
  if [[ "$JSON_OUTPUT" == true ]]; then
    echo "["
    for i in "${!RESULTS[@]}"; do
      if [[ $i -lt $((${#RESULTS[@]} - 1)) ]]; then
        echo "  ${RESULTS[$i]},"
      else
        echo "  ${RESULTS[$i]}"
      fi
    done
    echo "]"
  else
    print_results
  fi
}

main

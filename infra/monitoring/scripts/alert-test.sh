#!/bin/bash
# Cinacoin — Alert Rule Testing Script
# Tests alert rules by simulating metric conditions
#
# Usage:
#   ./alert-test.sh                    # Test all alert rules
#   ./alert-test.sh <rule-id>          # Test specific rule
#   ./alert-test.sh --list             # List all available tests
#
# Examples:
#   ./alert-test.sh error-rate-critical
#   ./alert-test.sh --list

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Prometheus endpoint
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
ALERTMANAGER_URL="${ALERTMANAGER_URL:-http://localhost:9093}"

# Test definitions
declare -A ALERT_TESTS=(
  ["error-rate-critical"]="sum(rate(cinacoin_http_errors_total{status_code=~\"5..\"}[5m])) / sum(rate(cinacoin_http_requests_total[5m])) * 100 > 5"
  ["error-rate-warning"]="sum(rate(cinacoin_http_errors_total{status_code=~\"5..\"}[5m])) / sum(rate(cinacoin_http_requests_total[5m])) * 100 > 1"
  ["latency-p99-critical"]="histogram_quantile(0.99, sum(rate(cinacoin_http_request_duration_seconds_bucket[5m])) by (le, service)) > 2"
  ["latency-p95-warning"]="histogram_quantile(0.95, sum(rate(cinacoin_http_request_duration_seconds_bucket[5m])) by (le, service)) > 0.5"
  ["service-down"]="cinacoin_service_up == 0"
  ["disk-warning"]="cinacoin_disk_usage_percent > 80"
  ["disk-critical"]="cinacoin_disk_usage_percent > 95"
  ["memory-warning"]="cinacoin_memory_usage_percent > 85"
  ["cpu-warning"]="cinacoin_cpu_usage_percent > 80"
  ["chain-sync"]="cinacoin_chain_sync_status == 0"
  ["low-peers"]="cinacoin_node_peer_count < 10"
)

# Parse arguments
TEST_TO_RUN=""
LIST_TESTS=false

for arg in "$@"; do
  case $arg in
    --list|-l)
      LIST_TESTS=true
      ;;
    --help|-h)
      echo "Usage: $0 [rule-id] [--list]"
      echo ""
      echo "Options:"
      echo "  --list, -l    List all available alert tests"
      echo "  --help, -h    Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 error-rate-critical"
      echo "  $0 --list"
      exit 0
      ;;
    *)
      if [[ -n "$arg" && "$arg" != "--"* ]]; then
        TEST_TO_RUN="$arg"
      fi
      ;;
  esac
done

# List tests
if [[ "$LIST_TESTS" == true ]]; then
  echo -e "${BLUE}Available Alert Tests:${NC}"
  echo ""
  for test in "${!ALERT_TESTS[@]}"; do
    echo -e "  ${GREEN}•${NC} $test"
  done
  exit 0
fi

# Check Prometheus connectivity
check_prometheus() {
  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" "$PROMETHEUS_URL/-/healthy" 2>&1) || {
    echo -e "${RED}✗ Cannot connect to Prometheus at $PROMETHEUS_URL${NC}"
    exit 1
  }
  
  if [[ "$response" != "200" ]]; then
    echo -e "${RED}✗ Prometheus is not healthy (HTTP $response)${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Connected to Prometheus at $PROMETHEUS_URL${NC}"
}

# Check AlertManager connectivity
check_alertmanager() {
  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" "$ALERTMANAGER_URL/-/healthy" 2>&1) || {
    echo -e "${YELLOW}⚠ Cannot connect to AlertManager at $ALERTMANAGER_URL${NC}"
    return 1
  }
  
  if [[ "$response" != "200" ]]; then
    echo -e "${YELLOW}⚠ AlertManager is not healthy (HTTP $response)${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Connected to AlertManager at $ALERTMANAGER_URL${NC}"
  return 0
}

# Test a single alert rule
test_alert_rule() {
  local rule_name="$1"
  local expr="${ALERT_TESTS[$rule_name]}"
  
  echo -e "\n${BLUE}Testing:${NC} $rule_name"
  echo -e "${BLUE}Expression:${NC} $expr"
  
  # Query Prometheus
  local query_url="$PROMETHEUS_URL/api/v1/query?query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$expr'))")"
  local response
  response=$(curl -s "$query_url" 2>&1) || {
    echo -e "${RED}✗ Query failed${NC}"
    return 1
  }
  
  # Parse response
  local status
  status=$(echo "$response" | jq -r '.status' 2>/dev/null) || {
    echo -e "${RED}✗ Invalid JSON response${NC}"
    return 1
  }
  
  if [[ "$status" != "success" ]]; then
    local error
    error=$(echo "$response" | jq -r '.error' 2>/dev/null)
    echo -e "${RED}✗ Query error: $error${NC}"
    return 1
  fi
  
  # Check result count
  local result_count
  result_count=$(echo "$response" | jq -r '.data.result | length' 2>/dev/null)
  
  if [[ "$result_count" -gt 0 ]]; then
    echo -e "${RED}⚠ ALERT FIRING: $result_count series match${NC}"
    echo "$response" | jq -r '.data.result[] | "  - \(.metric | to_entries | map("\(.key)=\(.value)") | join(", "))"' 2>/dev/null || true
    return 1
  else
    echo -e "${GREEN}✓ No alerts firing${NC}"
    return 0
  fi
}

# Get current active alerts
get_active_alerts() {
  echo -e "\n${BLUE}Active Alerts in AlertManager:${NC}"
  
  local response
  response=$(curl -s "$ALERTMANAGER_URL/api/v2/alerts" 2>&1) || {
    echo -e "${YELLOW}⚠ Cannot fetch alerts from AlertManager${NC}"
    return 1
  }
  
  local alert_count
  alert_count=$(echo "$response" | jq -r 'length' 2>/dev/null) || {
    echo -e "${YELLOW}⚠ Invalid response${NC}"
    return 1
  }
  
  if [[ "$alert_count" -eq 0 ]]; then
    echo -e "${GREEN}✓ No active alerts${NC}"
  else
    echo -e "${YELLOW}⚠ $alert_count active alerts:${NC}"
    echo "$response" | jq -r '.[] | "  - [\(.labels.severity)] \(.labels.alertname): \(.annotations.summary // "No summary")"' 2>/dev/null || true
  fi
}

# Main
main() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║       Cinacoin Alert Rule Testing                     ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  # Check connectivity
  check_prometheus
  check_alertmanager || true
  
  # Run tests
  local total=0
  local passed=0
  local failed=0
  
  if [[ -n "$TEST_TO_RUN" ]]; then
    # Test specific rule
    if [[ -z "${ALERT_TESTS[$TEST_TO_RUN]+_}" ]]; then
      echo -e "${RED}Error: Unknown test '$TEST_TO_RUN'${NC}"
      echo "Available tests: ${!ALERT_TESTS[*]}"
      exit 1
    fi
    test_alert_rule "$TEST_TO_RUN" && passed=$((passed + 1)) || failed=$((failed + 1))
    total=1
  else
    # Test all rules
    for test in "${!ALERT_TESTS[@]}"; do
      test_alert_rule "$test" && passed=$((passed + 1)) || failed=$((failed + 1))
      total=$((total + 1))
    done
  fi
  
  # Get active alerts
  get_active_alerts
  
  # Summary
  echo -e "\n${BLUE}Test Summary:${NC}"
  echo -e "  Total:    $total"
  echo -e "  Passed:   ${GREEN}$passed${NC} (no alerts firing)"
  echo -e "  Failed:   ${RED}$failed${NC} (alerts firing)"
  echo ""
  
  if [[ $failed -gt 0 ]]; then
    echo -e "${YELLOW}⚠ Some alert rules are currently firing${NC}"
    echo -e "This may be expected if you're testing in a production environment."
  else
    echo -e "${GREEN}✓ All alert rules are in normal state${NC}"
  fi
}

main

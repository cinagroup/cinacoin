#!/usr/bin/env bash
# =============================================================================
# Cinacoin — .NET Package Build & NuGet Publish
# =============================================================================
# Builds the .NET SDK and publishes to NuGet.
#
# Usage:
#   ./publish-dotnet.sh                     # Build + publish
#   ./publish-dotnet.sh --dry-run           # Pack only, no push
#   ./publish-dotnet.sh --version 1.1.0     # Set explicit version
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOTNET_DIR="$REPO_ROOT/packages/dotnet"
DRY_RUN=false
EXPLICIT_VERSION=""

log_info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)   DRY_RUN=true; shift ;;
    --version)   EXPLICIT_VERSION="$2"; shift 2 ;;
    --help)
      echo "Usage: $0 [--dry-run|--version X.Y.Z]"
      exit 0 ;;
    *) log_error "Unknown option: $1"; exit 1 ;;
  esac
done

# ─── Pre-flight ─────────────────────────────────────────────────────────────
preflight() {
  log_info "Pre-flight checks..."

  if ! command -v dotnet &>/dev/null; then
    log_error ".NET SDK is required but not installed."
    exit 1
  fi
  log_ok ".NET $(dotnet --version)"

  # NuGet API key
  if [[ "$DRY_RUN" != "true" && -z "${NUGET_API_KEY:-}" ]]; then
    log_warn "NUGET_API_KEY not set. Will attempt to use configured NuGet source."
  fi

  log_ok "Pre-flight complete."
}

# ─── Version Management ─────────────────────────────────────────────────────
update_version() {
  if [[ -z "$EXPLICIT_VERSION" ]]; then
    return 0
  fi

  log_info "Setting version to $EXPLICIT_VERSION..."
  local csproj="$DOTNET_DIR/Cinacoin.csproj"

  if [[ -f "$csproj" ]]; then
    sed -i "s|<Version>[^<]*</Version>|<Version>$EXPLICIT_VERSION</Version>|" "$csproj"
    log_ok "Version updated in Cinacoin.csproj"
  fi
}

# ─── Build & Pack ───────────────────────────────────────────────────────────
build_and_pack() {
  log_info "Building and packing .NET package..."
  cd "$DOTNET_DIR"

  dotnet restore -v q
  dotnet build -c Release --no-restore -v q
  dotnet pack -c Release --no-build -o ./nupkg

  log_ok "Package packed to ./nupkg/"
  ls -lh ./nupkg/ 2>/dev/null || true
}

# ─── Publish to NuGet ───────────────────────────────────────────────────────
publish_nuget() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would push packages to NuGet:"
    ls ./nupkg/*.nupkg 2>/dev/null || echo "  (none found)"
    return 0
  fi

  log_info "Pushing to NuGet..."

  local nupkg_file
  nupkg_file="$(ls ./nupkg/*.nupkg 2>/dev/null | head -1)"

  if [[ -z "$nupkg_file" ]]; then
    log_error "No .nupkg file found. Build first."
    exit 1
  fi

  dotnet nuget push "$nupkg_file" \
    --source "https://api.nuget.org/v3/index.json" \
    --api-key "${NUGET_API_KEY:-}" \
    --skip-duplicate

  log_ok "Published to NuGet."
}

# ─── Main ───────────────────────────────────────────────────────────────────
main() {
  echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  Cinacoin .NET NuGet Publish           ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
  echo ""

  preflight
  update_version
  build_and_pack
  publish_nuget

  echo ""
  log_ok "Cinacoin .NET NuGet publish pipeline complete."
}

main "$@"

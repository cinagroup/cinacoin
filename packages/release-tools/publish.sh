#!/usr/bin/env bash
# =============================================================================
# Cinacoin — Release & Publish Pipeline (npm)
# =============================================================================
# Publish all TypeScript packages to npm with version bumping,
# changesets integration, build verification, and dry-run support.
#
# Usage:
#   ./publish.sh                          # Full publish (after build + version bump)
#   ./publish.sh --dry-run                # Simulate, show what would be published
#   ./publish.sh --skip-build             # Skip build step (use prebuilt dist/)
#   ./publish.sh --skip-tests             # Skip test verification
#   ./publish.sh --only @cinacoin/core-sdk  # Publish a single package
#   ./publish.sh --tag next               # Publish under a dist-tag (e.g., next, beta)
#   ./publish.sh --changeset              # Use changesets workflow
#   ./publish.sh --manual <version>       # Manual version bump (e.g., 1.2.0)
# =============================================================================

set -euo pipefail

# ─── Colors ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─── Config ─────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PACKAGES_DIR="$REPO_ROOT/packages"
DRY_RUN=false
SKIP_BUILD=false
SKIP_TESTS=false
ONLY_PACKAGE=""
DIST_TAG=""
USE_CHANGESETS=false
MANUAL_VERSION=""
PUBLISHED=0
SKIPPED=0
FAILED=0

# ─── Packages to skip (private / non-publishable) ───────────────────────────
SKIP_PACKAGES=(
  "perf-benchmarks"
  "integration-tests"
  "testing"
  "release-tools"
  "cf-utils.ts"
)

# ─── Help ───────────────────────────────────────────────────────────────────
usage() {
  echo -e "${CYAN}Cinacoin Release Pipeline (npm)${NC}"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --dry-run              Simulate publish without uploading"
  echo "  --skip-build           Skip the build step"
  echo "  --skip-tests           Skip test verification"
  echo "  --only <pkg-name>      Publish only the specified package"
  echo "  --tag <dist-tag>       Publish under a specific dist-tag"
  echo "  --changeset            Use @changesets/cli for versioning + publishing"
  echo "  --manual <version>     Bump all packages to this version manually"
  echo "  --help                 Show this help message"
  exit 0
}

# ─── Parse Args ─────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)    DRY_RUN=true; shift ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --skip-tests) SKIP_TESTS=true; shift ;;
    --only)       ONLY_PACKAGE="$2"; shift 2 ;;
    --tag)        DIST_TAG="$2"; shift 2 ;;
    --changeset)  USE_CHANGESETS=true; shift ;;
    --manual)     MANUAL_VERSION="$2"; shift 2 ;;
    --help)       usage ;;
    *)            echo -e "${RED}Unknown option: $1${NC}"; usage ;;
  esac
done

# ─── Logging ────────────────────────────────────────────────────────────────
log_info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_skip()  { echo -e "${YELLOW}[SKIP]${NC} $*"; }

# ─── Pre-flight Checks ──────────────────────────────────────────────────────
preflight() {
  log_info "Running pre-flight checks..."

  # Check Node.js
  if ! command -v node &>/dev/null; then
    log_error "Node.js is required but not installed."
    exit 1
  fi
  log_ok "Node.js $(node --version)"

  # Check pnpm
  if ! command -v pnpm &>/dev/null; then
    log_error "pnpm is required but not installed."
    exit 1
  fi
  log_ok "pnpm $(pnpm --version)"

  # Check npm registry auth
  if [[ "$DRY_RUN" != "true" ]]; then
    if ! npm whoami &>/dev/null 2>&1; then
      log_error "Not authenticated with npm. Run: npm login"
      exit 1
    fi
    log_ok "npm user: $(npm whoami)"
  fi

  # Check git status
  cd "$REPO_ROOT"
  if [[ -n "$(git status --porcelain)" ]]; then
    log_warn "Working tree has uncommitted changes."
    read -r -p "Continue anyway? (y/N) " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      log_info "Aborted."
      exit 0
    fi
  fi

  log_ok "Pre-flight checks passed."
}

# ─── Check if a package should be skipped ───────────────────────────────────
should_skip() {
  local pkg_name="$1"
  for skip in "${SKIP_PACKAGES[@]}"; do
    if [[ "$pkg_name" == "$skip" ]]; then
      return 0
    fi
  done
  return 1
}

# ─── Check if version already published ─────────────────────────────────────
is_version_published() {
  local pkg_name="$1"
  local pkg_version="$2"

  if npm view "$pkg_name@$pkg_version" version &>/dev/null 2>&1; then
    return 0  # Already published
  fi
  return 1  # Not published
}

# ─── Check if package is private ────────────────────────────────────────────
is_private() {
  local pkg_json="$1"
  jq -e '.private == true' "$pkg_json" &>/dev/null 2>&1
}

# ─── Version Bump (Manual) ──────────────────────────────────────────────────
version_bump_manual() {
  local version="$1"
  log_info "Bumping all packages to version $version..."

  for pkg_json in "$PACKAGES_DIR"/*/package.json; do
    [[ -f "$pkg_json" ]] || continue
    local pkg_dir
    pkg_dir="$(dirname "$pkg_json")"
    local pkg_name
    pkg_name="$(basename "$pkg_dir")"

    if should_skip "$pkg_name"; then
      continue
    fi

    if is_private "$pkg_json"; then
      continue
    fi

    local current_version
    current_version="$(jq -r '.version' "$pkg_json")"

    # Bump workspace dependencies too
    if [[ "$current_version" != "$version" ]]; then
      log_info "  $pkg_name: $current_version → $version"
      local tmp_file
      tmp_file="$(mktemp)"
      jq --arg v "$version" '.version = $v' "$pkg_json" > "$tmp_file" && mv "$tmp_file" "$pkg_json"
    fi
  done

  log_ok "Version bump complete: $version"
}

# ─── Changesets Version ─────────────────────────────────────────────────────
version_bump_changesets() {
  log_info "Running changeset version..."
  cd "$REPO_ROOT"

  # Check for pending changesets
  if [[ -z "$(ls .changeset/*.md 2>/dev/null | grep -v config.json || true)" ]]; then
    log_warn "No pending changesets found."
    log_info "Run: pnpm changeset to create one."
    return 1
  fi

  pnpm changeset version
  log_ok "Changeset versioning complete."
  log_info "Review changes and commit before publishing."
}

# ─── Build ──────────────────────────────────────────────────────────────────
do_build() {
  if [[ "$SKIP_BUILD" == "true" ]]; then
    log_skip "Skipping build (--skip-build)"
    return 0
  fi

  log_info "Building all packages..."
  cd "$REPO_ROOT"
  pnpm run build
  log_ok "Build complete."
}

# ─── Tests ──────────────────────────────────────────────────────────────────
do_tests() {
  if [[ "$SKIP_TESTS" == "true" ]]; then
    log_skip "Skipping tests (--skip-tests)"
    return 0
  fi

  log_info "Running tests..."
  cd "$REPO_ROOT"
  if ! pnpm run test; then
    log_warn "Some tests failed. Review before publishing."
    read -r -p "Continue with publish? (y/N) " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      log_info "Aborted."
      exit 0
    fi
  else
    log_ok "All tests passed."
  fi
}

# ─── Publish a Single Package ───────────────────────────────────────────────
publish_package() {
  local pkg_json="$1"
  local pkg_dir
  pkg_dir="$(dirname "$pkg_json")"

  local pkg_name pkg_version is_workspace
  pkg_name="$(jq -r '.name' "$pkg_json")"
  pkg_version="$(jq -r '.version' "$pkg_json")"
  is_workspace="$(jq -r '.name // ""' "$pkg_json")"

  # Skip private packages
  if is_private "$pkg_json"; then
    log_skip "$pkg_name (private)"
    ((SKIPPED++))
    return 0
  fi

  # Check if already published
  if is_version_published "$pkg_name" "$pkg_version"; then
    log_skip "$pkg_name@$pkg_version (already published)"
    ((SKIPPED++))
    return 0
  fi

  # Dry-run mode
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would publish $pkg_name@$pkg_version"
    cd "$pkg_dir"
    npm publish --dry-run 2>&1 || true
    ((PUBLISHED++))
    return 0
  fi

  # Actual publish
  log_info "Publishing $pkg_name@$pkg_version..."
  cd "$pkg_dir"

  local publish_args=("npm" "publish")
  if [[ -n "$DIST_TAG" ]]; then
    publish_args+=("--tag" "$DIST_TAG")
  fi
  publish_args+=("--access" "public")

  if "${publish_args[@]}"; then
    log_ok "$pkg_name@$pkg_version published successfully"
    ((PUBLISHED++))
  else
    log_error "Failed to publish $pkg_name@$pkg_version"
    ((FAILED++))
  fi
}

# ─── Publish All ────────────────────────────────────────────────────────────
publish_all() {
  log_info "Scanning packages..."

  if [[ -n "$ONLY_PACKAGE" ]]; then
    local target="$PACKAGES_DIR/$ONLY_PACKAGE/package.json"
    if [[ -f "$target" ]]; then
      publish_package "$target"
    else
      log_error "Package '$ONLY_PACKAGE' not found at $target"
      exit 1
    fi
  else
    for pkg_json in "$PACKAGES_DIR"/*/package.json; do
      [[ -f "$pkg_json" ]] || continue
      local pkg_name
      pkg_name="$(basename "$(dirname "$pkg_json")")"

      if should_skip "$pkg_name"; then
        log_skip "$pkg_name (skip list)"
        ((SKIPPED++))
        continue
      fi

      publish_package "$pkg_json"
    done
  fi
}

# ─── Changesets Publish ─────────────────────────────────────────────────────
publish_changesets() {
  log_info "Publishing with changesets..."
  cd "$REPO_ROOT"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would run: pnpm changeset publish"
    log_info "Packages that would be published:"
    pnpm changeset status 2>/dev/null || true
  else
    pnpm changeset publish
  fi

  log_ok "Changesets publish complete."
}

# ─── Summary ────────────────────────────────────────────────────────────────
summary() {
  echo ""
  echo -e "${CYAN}══════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Cinacoin Release Summary${NC}"
  echo -e "${CYAN}══════════════════════════════════════════${NC}"
  echo -e "  ${GREEN}Published: $PUBLISHED${NC}"
  echo -e "  ${YELLOW}Skipped:   $SKIPPED${NC}"
  if [[ $FAILED -gt 0 ]]; then
    echo -e "  ${RED}Failed:    $FAILED${NC}"
  else
    echo -e "  ${GREEN}Failed:    0${NC}"
  fi
  echo -e "${CYAN}══════════════════════════════════════════${NC}"
  echo ""

  if [[ $FAILED -gt 0 ]]; then
    exit 1
  fi
}

# ─── Main ───────────────────────────────────────────────────────────────────
main() {
  echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  Cinacoin Release & Publish Pipeline   ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
  echo ""

  preflight

  # Handle changesets mode
  if [[ "$USE_CHANGESETS" == "true" ]]; then
    if [[ -n "$MANUAL_VERSION" ]]; then
      log_error "--changeset and --manual are mutually exclusive."
      exit 1
    fi

    if [[ "$DRY_RUN" != "true" ]]; then
      do_build
      do_tests
    fi

    if ! version_bump_changesets; then
      log_warn "No changesets to process. Use --manual <version> for manual bump."
      exit 0
    fi

    if [[ "$DRY_RUN" != "true" ]]; then
      # Commit the version changes
      cd "$REPO_ROOT"
      git add -A
      git commit -m "chore(release): version packages" || true
    fi

    publish_changesets
    summary
    return 0
  fi

  # Handle manual versioning
  if [[ -n "$MANUAL_VERSION" ]]; then
    version_bump_manual "$MANUAL_VERSION"

    # Commit version changes
    cd "$REPO_ROOT"
    if [[ "$DRY_RUN" != "true" ]]; then
      git add -A
      git commit -m "chore(release): bump version to $MANUAL_VERSION" || true
    fi
  fi

  # Build & test
  if [[ "$DRY_RUN" != "true" ]]; then
    do_build
    do_tests
  fi

  # Publish
  publish_all
  summary
}

main "$@"

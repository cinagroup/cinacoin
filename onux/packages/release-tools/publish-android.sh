#!/usr/bin/env bash
# =============================================================================
# Cinacoin — Android AAR Build & Maven Central Publish
# =============================================================================
# Builds the Android SDK (Kotlin) AAR and publishes to Maven Central.
# Supports snapshot and release builds, GPG signing, and version management.
#
# Usage:
#   ./publish-android.sh                        # Build + publish release
#   ./publish-android.sh --snapshot              # Publish as SNAPSHOT
#   ./publish-android.sh --version 1.1.0         # Set explicit version
#   ./publish-android.sh --dry-run               # Build only, skip upload
#   ./publish-android.sh --local                 # Publish to local Maven repo
#   ./publish-android.sh --skip-sign             # Skip GPG signing
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
ANDROID_DIR="$REPO_ROOT/packages/android-kotlin"
SNAPSHOT=false
DRY_RUN=false
LOCAL_ONLY=false
SKIP_SIGN=false
EXPLICIT_VERSION=""

log_info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ─── Parse Args ─────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --snapshot)     SNAPSHOT=true; shift ;;
    --dry-run)      DRY_RUN=true; shift ;;
    --local)        LOCAL_ONLY=true; shift ;;
    --skip-sign)    SKIP_SIGN=true; shift ;;
    --version)      EXPLICIT_VERSION="$2"; shift 2 ;;
    --help)
      echo "Usage: $0 [--snapshot|--dry-run|--local|--skip-sign|--version X.Y.Z]"
      exit 0 ;;
    *) log_error "Unknown option: $1"; exit 1 ;;
  esac
done

# ─── Determine Version ──────────────────────────────────────────────────────
if [[ -n "$EXPLICIT_VERSION" ]]; then
  SDK_VERSION="$EXPLICIT_VERSION"
else
  SDK_VERSION="$(grep -oP 'val sdkVersion = "\K[^"]+' "$ANDROID_DIR/build.gradle.kts" 2>/dev/null || echo "1.0.0")"
fi

if [[ "$SNAPSHOT" == "true" ]]; then
  SDK_VERSION="${SDK_VERSION}-SNAPSHOT"
fi

log_info "Android SDK version: $SDK_VERSION"

# ─── Pre-flight ─────────────────────────────────────────────────────────────
preflight() {
  log_info "Pre-flight checks..."

  # Gradle wrapper
  if [[ ! -f "$ANDROID_DIR/gradlew" ]]; then
    log_error "gradlew not found in $ANDROID_DIR"
    exit 1
  fi

  # ANDROID_HOME
  if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
    log_warn "ANDROID_HOME not set. Attempting to locate SDK..."
    if command -v sdkmanager &>/dev/null; then
      export ANDROID_HOME="$(sdkmanager --list 2>/dev/null | head -1 || echo "$HOME/Android/Sdk")"
    else
      export ANDROID_HOME="$HOME/Android/Sdk"
    fi
    log_info "Using ANDROID_HOME=$ANDROID_HOME"
  fi

  # GPG (for release signing)
  if [[ "$SKIP_SIGN" != "true" && "$SNAPSHOT" != "true" && "$LOCAL_ONLY" != "true" && "$DRY_RUN" != "true" ]]; then
    if ! command -v gpg &>/dev/null; then
      log_error "GPG is required for signing release artifacts. Install GPG or use --skip-sign."
      exit 1
    fi
    if [[ -z "${GPG_KEY_ID:-}" ]]; then
      log_warn "GPG_KEY_ID not set. Make sure signing.keyId is configured in gradle.properties."
    fi
    log_ok "GPG available for signing"
  fi

  log_ok "Pre-flight complete."
}

# ─── Update Version in build.gradle.kts ────────────────────────────────────
update_version() {
  local gradle_file="$ANDROID_DIR/build.gradle.kts"
  if [[ -n "$EXPLICIT_VERSION" ]]; then
    log_info "Updating version in build.gradle.kts: $EXPLICIT_VERSION"
    sed -i "s/val sdkVersion = \"[^\"]*\"/val sdkVersion = \"$EXPLICIT_VERSION\"/" "$gradle_file"
  fi
}

# ─── Build AAR ──────────────────────────────────────────────────────────────
build_aar() {
  log_info "Building Android AAR (release)..."
  cd "$ANDROID_DIR"

  chmod +x ./gradlew 2>/dev/null || true
  ./gradlew assembleRelease --no-daemon -q

  if [[ $? -eq 0 ]]; then
    log_ok "AAR build successful."
  else
    log_error "AAR build failed."
    exit 1
  fi

  # Show built artifacts
  log_info "Built artifacts:"
  find build/outputs/aar -name "*.aar" -exec ls -lh {} \; 2>/dev/null || true
}

# ─── Publish ────────────────────────────────────────────────────────────────
publish_aar() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would publish Cinacoin Android SDK $SDK_VERSION"
    log_info "Build artifacts:"
    find "$ANDROID_DIR"/build/outputs -name "*.aar" -o -name "*.pom" 2>/dev/null || echo "  (none found — run without --dry-run to build)"
    return 0
  fi

  cd "$ANDROID_DIR"

  if [[ "$LOCAL_ONLY" == "true" ]]; then
    log_info "Publishing to local Maven repository..."
    ./gradlew publishToMavenLocal --no-daemon
    log_ok "Published to local Maven repository."
    return 0
  fi

  # Publish to Maven Central via Gradle publishing plugin
  log_info "Publishing $SDK_VERSION to Maven Central..."
  ./gradlew publishReleasePublicationToSonatypeRepository --no-daemon

  log_ok "Published to Maven Central."
}

# ─── Main ───────────────────────────────────────────────────────────────────
main() {
  echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  Cinacoin Android AAR Publish          ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
  echo ""

  preflight
  update_version
  build_aar
  publish_aar

  echo ""
  log_ok "Cinacoin Android SDK $SDK_VERSION publish pipeline complete."
}

main "$@"

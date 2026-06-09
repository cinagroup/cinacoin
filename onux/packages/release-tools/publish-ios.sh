#!/usr/bin/env bash
# =============================================================================
# Cinacoin — iOS XCFramework Build & CocoaPods Publish
# =============================================================================
# Builds the iOS SDK as XCFramework and publishes to CocoaPods trunk.
#
# Usage:
#   ./publish-ios.sh                     # Build + publish
#   ./publish-ios.sh --dry-run           # Validate only, no upload
#   ./publish-ios.sh --skip-build        # Use existing XCFramework
#   ./publish-ios.sh --validate-only     # Just validate podspec
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
IOS_DIR="$REPO_ROOT/packages/ios-swift"
DRY_RUN=false
SKIP_BUILD=false
VALIDATE_ONLY=false

log_info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)       DRY_RUN=true; shift ;;
    --skip-build)    SKIP_BUILD=true; shift ;;
    --validate-only) VALIDATE_ONLY=true; shift ;;
    --help)
      echo "Usage: $0 [--dry-run|--skip-build|--validate-only]"
      exit 0 ;;
    *) log_error "Unknown option: $1"; exit 1 ;;
  esac
done

# ─── Pre-flight ─────────────────────────────────────────────────────────────
preflight() {
  log_info "Pre-flight checks..."

  # CocoaPods CLI
  if ! command -v pod &>/dev/null; then
    log_error "CocoaPods (pod) is required. Install: gem install cocoapods"
    exit 1
  fi
  log_ok "CocoaPods $(pod --version)"

  # Swift
  if ! command -v swift &>/dev/null; then
    log_error "Swift toolchain is required."
    exit 1
  fi
  log_ok "Swift $(swift --version | head -1)"

  # CocoaPods trunk auth
  if [[ "$DRY_RUN" != "true" && "$VALIDATE_ONLY" != "true" ]]; then
    if ! pod trunk me &>/dev/null 2>&1; then
      log_error "Not authenticated with CocoaPods trunk. Run: pod trunk register <email>"
      exit 1
    fi
    log_ok "CocoaPods authenticated: $(pod trunk me 2>/dev/null | head -1)"
  fi

  log_ok "Pre-flight complete."
}

# ─── Build XCFramework ─────────────────────────────────────────────────────
build_xcframework() {
  if [[ "$SKIP_BUILD" == "true" ]]; then
    log_skip "Skipping build (--skip-build)"
    return 0
  fi

  log_info "Building XCFramework..."
  cd "$IOS_DIR"

  # Build for iOS device
  xcodebuild -scheme OnChainUX \
    -sdk iphoneos \
    -configuration Release \
    -destination 'generic/platform=iOS' \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    ONLY_ACTIVE_ARCH=NO \
    clean build 2>&1 | tail -5

  # Build for iOS simulator
  xcodebuild -scheme OnChainUX \
    -sdk iphonesimulator \
    -configuration Release \
    -destination 'generic/platform=iOS Simulator' \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    ONLY_ACTIVE_ARCH=NO \
    clean build 2>&1 | tail -5

  # Create XCFramework
  rm -rf build/CinacoinSDK.xcframework
  xcodebuild -create-xcframework \
    -framework build/Release-iphoneos/OnChainUX.framework \
    -framework build/Release-iphonesimulator/OnChainUX.framework \
    -output build/CinacoinSDK.xcframework

  log_ok "XCFramework built at build/CinacoinSDK.xcframework"
}

# ─── Validate Podspec ───────────────────────────────────────────────────────
validate_podspec() {
  log_info "Validating podspec..."
  cd "$IOS_DIR"

  pod spec lint --allow-warnings --verbose || {
    log_error "Podspec validation failed."
    exit 1
  }

  log_ok "Podspec validation passed."
}

# ─── Publish to CocoaPods Trunk ─────────────────────────────────────────────
publish_pod() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would publish Cinacoin iOS SDK to CocoaPods trunk"
    return 0
  fi

  log_info "Publishing to CocoaPods trunk..."
  cd "$IOS_DIR"

  pod trunk push --allow-warnings

  log_ok "Published to CocoaPods trunk."
}

# ─── Main ───────────────────────────────────────────────────────────────────
main() {
  echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  Cinacoin iOS XCFramework Publish      ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
  echo ""

  preflight

  if [[ "$VALIDATE_ONLY" == "true" ]]; then
    validate_podspec
    return 0
  fi

  build_xcframework
  validate_podspec
  publish_pod

  echo ""
  log_ok "Cinacoin iOS SDK publish pipeline complete."
}

main "$@"

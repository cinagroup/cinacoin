#!/bin/bash
# deploy-pages.sh
# Deploy all Next.js apps to Cloudflare Pages
# Usage: ./scripts/deploy-pages.sh [app-name|--all]
# Examples:
#   ./scripts/deploy-pages.sh website
#   ./scripts/deploy-pages.sh --all

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

APPS=(
  "website"
  "demo"
  "backend-dashboard"
  "analytics-dashboard"
  "cloud-dashboard"
  "health-status"
  "wallet-explorer"
  "unified-dashboard"
)

deploy_app() {
  local app_name="$1"
  local project_name="cinacoin-${app_name}"
  local app_dir="${ROOT_DIR}/apps/${app_name}"

  echo "=========================================="
  echo "🚀 Deploying: ${app_name}"
  echo "   Project:  ${project_name}"
  echo "   Directory: ${app_dir}"
  echo "=========================================="

  if [ ! -d "$app_dir" ]; then
    echo "❌ Error: App directory not found: ${app_dir}"
    return 1
  fi

  cd "$app_dir"

  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
  fi

  # Build the Next.js app (static export)
  echo "🔨 Building..."
  npx next build

  # Deploy to Cloudflare Pages
  echo "☁️  Deploying to Cloudflare Pages..."
  npx wrangler pages deploy .vercel/output/static --project-name="${project_name}"

  echo "✅ Successfully deployed: ${app_name}"
  echo ""
}

# Main logic
if [ $# -eq 0 ]; then
  echo "Usage: $0 [app-name|--all]"
  echo ""
  echo "Available apps:"
  for app in "${APPS[@]}"; do
    echo "  - ${app}"
  done
  echo ""
  echo "Use '--all' to deploy all apps."
  exit 1
fi

if [ "$1" = "--all" ]; then
  echo "🚀 Deploying ALL apps to Cloudflare Pages..."
  echo ""
  for app in "${APPS[@]}"; do
    deploy_app "$app"
  done
  echo "=========================================="
  echo "🎉 All apps deployed successfully!"
  echo "=========================================="
else
  deploy_app "$1"
fi

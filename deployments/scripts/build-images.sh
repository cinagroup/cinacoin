#!/bin/bash
# Cinacoin Platform - Docker Build & Push Script
# Usage: ./build-images.sh [registry] [tag]

set -e

REGISTRY=${1:-"cinacoin"}
TAG=${2:-"latest"}
PLATFORM=${3:-"linux/amd64"}

echo "=========================================="
echo "Cinacoin Docker Image Build"
echo "=========================================="
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo "Platform: $PLATFORM"
echo "=========================================="

# Function to build and push image
build_and_push() {
    local service=$1
    local dockerfile=$2
    local context=$3
    
    echo ""
    echo "Building $service..."
    echo "  Dockerfile: $dockerfile"
    echo "  Context: $context"
    
    docker build \
        --platform $PLATFORM \
        --tag ${REGISTRY}/${service}:${TAG} \
        --tag ${REGISTRY}/${service}:latest \
        --file $dockerfile \
        $context
    
    echo "Pushing $service..."
    docker push ${REGISTRY}/${service}:${TAG}
    docker push ${REGISTRY}/${service}:latest
    
    echo "✓ $service completed"
}

# Build all services
build_and_push "auth-service" \
    "deployments/docker/Dockerfile.auth-service" \
    "apps/auth-service"

build_and_push "user-service" \
    "deployments/docker/Dockerfile.user-service" \
    "apps/user-service"

build_and_push "api-gateway" \
    "deployments/docker/Dockerfile.api-gateway" \
    "deployments/docker/gateway-config"

build_and_push "unified-dashboard" \
    "deployments/docker/Dockerfile.unified-dashboard" \
    "apps/unified-dashboard"

echo ""
echo "=========================================="
echo "All images built and pushed successfully!"
echo "=========================================="
echo ""
echo "Images:"
echo "  - ${REGISTRY}/auth-service:${TAG}"
echo "  - ${REGISTRY}/user-service:${TAG}"
echo "  - ${REGISTRY}/api-gateway:${TAG}"
echo "  - ${REGISTRY}/unified-dashboard:${TAG}"
echo ""

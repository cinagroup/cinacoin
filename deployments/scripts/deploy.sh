#!/bin/bash
# Cinacoin Platform - Kubernetes Deployment Script
# Usage: ./deploy.sh [environment] [namespace]

set -e

ENVIRONMENT=${1:-"dev"}
NAMESPACE=${2:-"cinacoin-${ENVIRONMENT}"}

echo "=========================================="
echo "Cinacoin Kubernetes Deployment"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "=========================================="

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting." >&2; exit 1; }
command -v kustomize >/dev/null 2>&1 || { echo "kustomize is required but not installed. Aborting." >&2; exit 1; }

# Verify cluster connection
echo ""
echo "Verifying cluster connection..."
kubectl cluster-info || { echo "Cannot connect to Kubernetes cluster. Aborting." >&2; exit 1; }

# Create namespace if it doesn't exist
echo ""
echo "Creating namespace $NAMESPACE..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets first (if using external secret management)
if [ -f "deployments/kubernetes/overlays/${ENVIRONMENT}/.env.${ENVIRONMENT}" ]; then
    echo ""
    echo "Applying secrets from .env.${ENVIRONMENT}..."
    kubectl create secret generic cinacoin-secrets \
        --namespace=$NAMESPACE \
        --from-env-file=deployments/kubernetes/overlays/${ENVIRONMENT}/.env.${ENVIRONMENT} \
        --dry-run=client -o yaml | kubectl apply -f -
fi

# Deploy using Kustomize
echo ""
echo "Deploying with Kustomize..."
kubectl apply -k deployments/kubernetes/overlays/${ENVIRONMENT}

# Wait for deployments to be ready
echo ""
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n $NAMESPACE || echo "PostgreSQL deployment timeout"
kubectl wait --for=condition=available --timeout=300s deployment/redis -n $NAMESPACE || echo "Redis deployment timeout"
kubectl wait --for=condition=available --timeout=300s deployment/auth-service -n $NAMESPACE || echo "Auth Service deployment timeout"
kubectl wait --for=condition=available --timeout=300s deployment/user-service -n $NAMESPACE || echo "User Service deployment timeout"
kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n $NAMESPACE || echo "API Gateway deployment timeout"
kubectl wait --for=condition=available --timeout=300s deployment/unified-dashboard -n $NAMESPACE || echo "Unified Dashboard deployment timeout"

# Show deployment status
echo ""
echo "=========================================="
echo "Deployment Status"
echo "=========================================="
kubectl get all -n $NAMESPACE

echo ""
echo "=========================================="
echo "Deployment completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Check pod logs: kubectl logs -n $NAMESPACE -l app.kubernetes.io/part-of=cinacoin-platform"
echo "  2. Check services: kubectl get svc -n $NAMESPACE"
echo "  3. Check ingress: kubectl get ingress -n $NAMESPACE"
echo "  4. Port-forward for testing: kubectl port-forward -n $NAMESPACE svc/api-gateway 8000:8000"
echo ""

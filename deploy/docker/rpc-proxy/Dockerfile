# syntax=docker/dockerfile:1
# ────────────────────────────────────────────────────────────────
# Multi-stage Go Dockerfile — RPC Proxy
# Optimized for minimal image size and security
# ────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Copy go modules first for layer caching
COPY rpc-proxy/go.mod rpc-proxy/go.sum ./
RUN go mod download

# Copy source and build
COPY rpc-proxy/ .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -extldflags '-static'" \
    -o /build/rpc-proxy \
    ./cmd/rpc-proxy

# ── Stage 2: Runtime ────────────────────────────────────────────
FROM scratch AS runtime

# Import CA certificates for TLS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy binary
COPY --from=builder /build/rpc-proxy /rpc-proxy
COPY rpc-proxy/config/providers.yaml /config/providers.yaml

# Set user (scratch doesn't have users, set uid/gid)
USER 1000:1000

# Expose ports
EXPOSE 8545 9090

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD ["/rpc-proxy", "-health"]

ENTRYPOINT ["/rpc-proxy"]

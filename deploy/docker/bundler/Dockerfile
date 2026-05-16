# syntax=docker/dockerfile:1
# ────────────────────────────────────────────────────────────────
# Multi-stage Rust Dockerfile — Bundler (ERC-4337)
# Optimized for minimal image size and security
# ────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ────────────────────────────────────────────
FROM rust:1.78-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo manifests first for layer caching
COPY bundler/Cargo.toml bundler/Cargo.lock ./

# Create dummy source to cache dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy actual source and build
COPY bundler/src ./src
RUN cargo build --release --locked

# ── Stage 2: Runtime ────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1000 onchainux && \
    useradd -u 1000 -g onchainux -m -s /bin/false onchainux

# Copy binary from builder
COPY --from=builder /build/target/release/bundler /app/bundler

# Set ownership
RUN chown -R onchainux:onchainux /app

# Switch to non-root user
USER onchainux

# Expose ports
EXPOSE 4337 9090

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:4337/health || exit 1

ENTRYPOINT ["/app/bundler"]

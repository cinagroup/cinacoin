# Multi-stage build for production-optimized push-server image.

# --- Builder stage ---
FROM rust:1.80-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Cache dependency compilation
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release --locked 2>/dev/null || true

# Copy actual source
COPY . .
RUN cargo build --release --locked

# --- Runtime stage ---
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r push && useradd -r -g push push

WORKDIR /app
COPY --from=builder /app/target/release/push-server .

RUN chown push:push push-server
USER push

EXPOSE 3000

ENV RUST_LOG=info \
    PUSH_SERVER_HOST=0.0.0.0 \
    PUSH_SERVER_PORT=3000 \
    PUSH_SHUTDOWN_TIMEOUT_SECS=30

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["curl", "-f", "http://localhost:3000/v1/health"] || exit 1

ENTRYPOINT ["./push-server"]

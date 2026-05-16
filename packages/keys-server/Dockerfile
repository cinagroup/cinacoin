# syntax=docker/dockerfile:1
# ────────────────────────────────────────────────────────────────
# Multi-stage Rust Dockerfile — Keys Server
# ────────────────────────────────────────────────────────────────

FROM rust:1.80-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release --locked 2>/dev/null || true

COPY . .
RUN cargo build --release --locked

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r keys && useradd -r -g keys keys

WORKDIR /app
COPY --from=builder /app/target/release/keys-server .

RUN chown keys:keys keys-server
USER keys

EXPOSE 3001

ENV RUST_LOG=info \
    KEYS_SERVER_HOST=0.0.0.0 \
    KEYS_SERVER_PORT=3001 \
    KEYS_SHUTDOWN_TIMEOUT_SECS=30

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["curl", "-f", "http://localhost:3001/v1/health"] || exit 1

ENTRYPOINT ["./keys-server"]

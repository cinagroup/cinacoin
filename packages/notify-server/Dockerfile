FROM rust:1.85-alpine AS builder
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM alpine:3.21
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/target/release/notify-server /usr/local/bin/
HEALTHCHECK --interval=30s --timeout=5s CMD wget -q -O /dev/null http://localhost:8080/v1/health
EXPOSE 8080
ENTRYPOINT ["notify-server"]

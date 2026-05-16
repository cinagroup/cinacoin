# syntax=docker/dockerfile:1
# ────────────────────────────────────────────────────────────────
# Multi-stage Static Site Build — Core UI Component Gallery
# Optimized for minimal static asset serving
# ────────────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Install dependencies
COPY core-ui/package.json core-ui/package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source and build
COPY core-ui/ .
RUN npm run build

# ── Stage 2: Serve (Nginx) ──────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

# Copy built assets
COPY --from=builder /build/dist /usr/share/nginx/html

# Custom nginx config
COPY deploy/docker/core-ui/nginx.conf /etc/nginx/conf.d/default.conf

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf.bak

# Security headers via nginx config are handled in nginx.conf

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

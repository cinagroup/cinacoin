# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY apps/user-service/package.json ./apps/user-service/

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/user-service ./apps/user-service
COPY tsconfig.json ./

# Build
RUN pnpm --filter user-service build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3201

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/apps/user-service/.next/standalone ./
COPY --from=builder /app/apps/user-service/.next/static ./apps/user-service/.next/static
COPY --from=builder /app/apps/user-service/public ./apps/user-service/public

# Set ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3201

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3201/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "apps/user-service/server.js"]

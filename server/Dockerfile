# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Install ripgrep for text search (used by extension's files.search handler)
RUN apk add --no-cache ripgrep

WORKDIR /app

# Only copy production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --silent

COPY --from=builder /app/dist ./dist

# Run as non-root
RUN addgroup -S mcp && adduser -S mcp -G mcp
USER mcp

EXPOSE 7337

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:7337/ping | grep -q '"ok":true' || exit 1

CMD ["node", "dist/index.js"]

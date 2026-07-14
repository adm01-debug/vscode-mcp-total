# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --silent

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Install ripgrep + curl for health check
RUN apk add --no-cache ripgrep curl

WORKDIR /app

# Only copy production dependencies
COPY package*.json ./
RUN npm install --omit=dev --silent

COPY --from=builder /app/dist ./dist

# Run as non-root
RUN addgroup -S mcp && adduser -S mcp -G mcp
USER mcp

EXPOSE 7337

# Health check using curl (available for mcp user)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD curl -sf http://localhost:7337/ping || exit 1

CMD ["node", "dist/index.js"]

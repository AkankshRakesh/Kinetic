# =========================
# Dependencies stage
# =========================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# =========================
# Build stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ==========================================
# Production auth configuration
# IMPORTANT:
# This MUST exist during `npm run build`
# because Next.js embeds NEXT_PUBLIC vars
# into the frontend bundle at build time.
# ==========================================

ENV NEXT_PUBLIC_AUTH_MODE=api
ENV NEXT_PUBLIC_AUTH_BACKEND=laravel-token

# CHANGE THIS TO YOUR REAL BACKEND URL
ENV NEXT_PUBLIC_AUTH_API_BASE_URL=http://YOUR-BACKEND.elasticbeanstalk.com
ENV NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=/api/auth/login
ENV NEXT_PUBLIC_AUTH_REGISTER_ENDPOINT=/api/auth/register
ENV NEXT_PUBLIC_AUTH_LOGOUT_ENDPOINT=/api/auth/logout
ENV NEXT_PUBLIC_AUTH_USER_ENDPOINT=/api/auth/user

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# =========================
# Runtime stage
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY package.json package-lock.json ./

# Install production deps only
RUN npm ci --omit=dev && npm cache clean --force

# Copy Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js
CMD ["node_modules/.bin/next", "start"]
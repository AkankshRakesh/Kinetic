# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for authentication configuration
ARG NEXT_PUBLIC_AUTH_MODE=api
ARG NEXT_PUBLIC_AUTH_BACKEND=laravel-sanctum
ARG NEXT_PUBLIC_AUTH_API_BASE_URL=
ARG NEXT_PUBLIC_AUTH_INCLUDE_CREDENTIALS=true
ARG NEXT_PUBLIC_AUTH_CSRF_ENDPOINT=/sanctum/csrf-cookie
ARG NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=/api/login
ARG NEXT_PUBLIC_AUTH_REGISTER_ENDPOINT=/api/register
ARG NEXT_PUBLIC_AUTH_LOGOUT_ENDPOINT=/api/logout
ARG NEXT_PUBLIC_AUTH_USER_ENDPOINT=/api/user

# Set environment variables from build arguments
ENV NEXT_PUBLIC_AUTH_MODE=$NEXT_PUBLIC_AUTH_MODE
ENV NEXT_PUBLIC_AUTH_BACKEND=$NEXT_PUBLIC_AUTH_BACKEND
ENV NEXT_PUBLIC_AUTH_API_BASE_URL=$NEXT_PUBLIC_AUTH_API_BASE_URL
ENV NEXT_PUBLIC_AUTH_INCLUDE_CREDENTIALS=$NEXT_PUBLIC_AUTH_INCLUDE_CREDENTIALS
ENV NEXT_PUBLIC_AUTH_CSRF_ENDPOINT=$NEXT_PUBLIC_AUTH_CSRF_ENDPOINT
ENV NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=$NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT
ENV NEXT_PUBLIC_AUTH_REGISTER_ENDPOINT=$NEXT_PUBLIC_AUTH_REGISTER_ENDPOINT
ENV NEXT_PUBLIC_AUTH_LOGOUT_ENDPOINT=$NEXT_PUBLIC_AUTH_LOGOUT_ENDPOINT
ENV NEXT_PUBLIC_AUTH_USER_ENDPOINT=$NEXT_PUBLIC_AUTH_USER_ENDPOINT

# Build the Next.js application
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --frozen-lockfile --production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose port for Elastic Beanstalk
EXPOSE 3000

# Health check for Elastic Beanstalk
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the application with exec to ensure proper signal handling
CMD ["node_modules/.bin/next", "start"]

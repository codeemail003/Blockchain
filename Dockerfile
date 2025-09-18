# Multi-stage Dockerfile for PharbitChain
# Stage 1: Build contracts
FROM node:18-alpine AS contracts-builder

WORKDIR /app/contracts

# Copy contracts package files
COPY contracts/package*.json ./

# Install contracts dependencies
RUN npm ci --only=production

# Copy contracts source code
COPY contracts/ ./

# Compile contracts
RUN npm run compile

# Stage 2: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 3: Build backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Stage 4: Production image
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pharbit -u 1001

# Set working directory
WORKDIR /app

# Copy built contracts
COPY --from=contracts-builder /app/contracts/artifacts ./contracts/artifacts
COPY --from=contracts-builder /app/contracts/cache ./contracts/cache

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy backend
COPY --from=backend-builder /app/backend ./backend

# Copy root package.json
COPY package*.json ./

# Install root dependencies
RUN npm ci --only=production

# Create necessary directories
RUN mkdir -p logs uploads

# Set ownership
RUN chown -R pharbit:nodejs /app

# Switch to app user
USER pharbit

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Default command
CMD ["node", "backend/index.js"]
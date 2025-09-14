# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app

# Copy installed node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy app source
COPY . .

# Ensure blockchain-db exists and is writable
RUN mkdir -p /app/blockchain-db && chown -R node:node /app

USER node

ENV NODE_ENV=production
EXPOSE 3000

# Use environment variables for config (dotenv also supported)
# VOLUME for LevelDB persistence
VOLUME ["/app/blockchain-db"]

CMD ["node", "src/index.js"]


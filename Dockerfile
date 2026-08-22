# Production Dockerfile for TRUSTX Server Deployment on Render
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package manifests for dependency installation
COPY package.json package-lock.json ./

# Copy workspace package manifests
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

# Install dependencies across all monorepo workspaces
RUN npm ci

# Copy source code for shared and server workspaces
COPY shared/ shared/
COPY server/ server/

# Build shared and server workspaces
RUN npm run build --workspace=shared && npm run build --workspace=server

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV AUTO_START=true
ENV PORT=5000

# Copy root package manifests
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/

# Copy installed node_modules and built artifacts from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json

EXPOSE 5000

CMD ["node", "server/dist/app.js"]

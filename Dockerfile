# Build stage for Web
FROM node:20-alpine AS web-builder
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies for web (ignore postinstall which requires api workspace)
RUN npm ci --workspace=web --include-workspace-root --ignore-scripts

# Copy web source and build
COPY apps/web ./apps/web
RUN npm run build --workspace=web

# Build stage for API
FROM node:20-alpine AS api-builder
WORKDIR /app

# Copy root package files and api package
COPY package*.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies for api
RUN npm ci --workspace=api --include-workspace-root --ignore-scripts

# Copy API source and prisma schema
COPY apps/api ./apps/api

# Generate Prisma client and build
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=api
# Compile production seed script (run from scripts dir so output goes to dist root)
RUN cd apps/api/scripts && npx tsc seed.production.ts --outDir ../dist --target es2020 --module commonjs --esModuleInterop --skipLibCheck

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files for production install
COPY package*.json ./
COPY apps/api/package.json ./apps/api/

# Install only production dependencies (ignore postinstall)
RUN npm ci --workspace=api --include-workspace-root --omit=dev --ignore-scripts

# Copy Prisma schema and generate client
COPY apps/api/prisma ./apps/api/prisma
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Copy built API from api-builder
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist

# Copy built Web (static files) from web-builder
COPY --from=web-builder /app/apps/web/dist ./public

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD ["node", "apps/api/dist/index.js"]

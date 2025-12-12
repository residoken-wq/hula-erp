# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:18 AS builder
WORKDIR /app

# Copy only dependency files for cache
COPY package*.json ./
COPY tsconfig.json ./

# Use npm ci for deterministic + faster install
RUN npm ci

# Copy full source
COPY . .

# Build NestJS (outputs to dist/)
RUN npm run build


# ==========================================
# Stage 2: Production Image
# ==========================================
FROM node:18-alpine AS prod
WORKDIR /app

# Copy only package.json
COPY package*.json ./

# Install only production modules
RUN npm ci --omit=dev

# Copy build output
COPY --from=builder /app/dist ./dist

# Start production mode
CMD ["node", "dist/main"]

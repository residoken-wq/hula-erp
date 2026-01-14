# Stage 1: Base (Dependency)
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install --legacy-peer-deps

# Stage 2: Development (Fast Start)
FROM base AS development
COPY . .
# Copy Firebase credentials if exists
COPY src/firebase/firebase-service-account.json ./src/firebase/ 2>/dev/null || true
CMD ["npm", "run", "start:dev"]

# Stage 3: Build (Production Build)
FROM base AS build
COPY . .
RUN npm run build
# Copy Firebase credentials to dist
RUN mkdir -p dist/firebase && cp src/firebase/firebase-service-account.json dist/firebase/ 2>/dev/null || true

# Stage 4: Production (Run App)
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
# Only install production deps
RUN npm install --only=production --legacy-peer-deps
COPY --from=build /app/dist ./dist
CMD ["node", "dist/main"]

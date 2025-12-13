# Stage 1: Build Stage
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

# COPY . . (Lệnh này copy cả src và các file khác)
COPY . . 

RUN npm run build

# Stage 2: Production/Development Stage
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./

# Copy node_modules từ stage build (Quan trọng)
COPY --from=build /app/node_modules ./node_modules
# Copy file build (JS code)
COPY --from=build /app/dist ./dist

# --- FIX: BỎ HOÀN TOÀN DÒNG LỖI ---
# Loại bỏ dòng này vì đã có Volume Mapping trong docker-compose.yml:
# COPY --from=build /app/src ./src # Cần thiết cho start:dev
# ------------------------------------

# Thay đổi lệnh chạy: Chuyển sang chế độ Watch (Development)
CMD ["npm", "run", "start:dev"]
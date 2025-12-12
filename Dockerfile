# Stage 1: Build Stage
FROM node:18-alpine AS build

# Sử dụng Yarn nếu có (hoặc npm)
WORKDIR /app
COPY package*.json ./
# --- BẮT BUỘC: Copy tsconfig.json ---
COPY tsconfig.json ./
# ------------------------------------

# Cài đặt dependency (sử dụng cache)
RUN npm install

# Copy source code
COPY . .

# Chạy build TypeScript (tạo thư mục dist)
RUN npm run build

# Stage 2: Production/Development Stage
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
# --- BẮT BUỘC: Copy tsconfig.json ---
COPY tsconfig.json ./
# ------------------------------------

# Copy node_modules từ stage build (Quan trọng)
COPY --from=build /app/node_modules ./node_modules
# Copy file build (JS code)
COPY --from=build /app/dist ./dist

# Thay đổi lệnh chạy: Chuyển sang chế độ Watch (Development)
CMD ["npm", "run", "start:dev"]
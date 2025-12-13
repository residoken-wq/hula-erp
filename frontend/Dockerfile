# Stage 1: Build (Tận dụng Cache cho Dependencies)
FROM node:18-alpine as build
WORKDIR /app

# 1. Copy file dependency list
COPY package.json ./
# Nếu có package-lock.json hoặc yarn.lock, copy chúng vào đây

# 2. Cài đặt dependencies (Layer này chỉ thay đổi khi package*.json thay đổi)
RUN npm install

# 3. Copy toàn bộ source code (Layer này thay đổi khi code thay đổi)
COPY . .

# Sửa lỗi build bộ nhớ nếu cần
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 4. Tạo bản build production
RUN npm run build


# Stage 2: Nginx (Chạy Production)
FROM nginx:alpine
# ... (Phần Nginx giữ nguyên)
# Stage 1: Build (Tận dụng Cache cho Dependencies)
FROM node:18-alpine as build
WORKDIR /app

# 1. Copy file dependency list
COPY package.json ./
# --- FIX: LOẠI BỎ LỆNH COPY package-lock.json GÂY LỖI ---
# COPY package-lock.json ./ 

# 2. Cài đặt dependencies (Layer này chỉ thay đổi khi package.json thay đổi)
RUN npm install

# 3. Copy toàn bộ source code (Layer này thay đổi khi code thay đổi)
COPY . .

# Sửa lỗi build bộ nhớ nếu cần
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 4. Tạo bản build production
RUN npm run build


# Stage 2: Nginx (Chạy Production)
FROM nginx:alpine

# Copy cấu hình Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
 
# Copy file build từ Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
 
CMD ["nginx", "-g", "daemon off;"]
# Stage 1: Build (Tận dụng Cache cho Dependencies)
FROM node:18-alpine as build
WORKDIR /app

# 1. Copy file dependency list (package.json BẮT BUỘC)
COPY package.json ./

# 2. Copy file lock (Tùy chọn: chỉ copy nếu tồn tại)
# Lệnh COPY này có thể bị lỗi nếu file không tồn tại. Tốt nhất là sử dụng một lệnh COPY chung.
# Tuy nhiên, để tránh lỗi, ta chỉ cần dựa vào package.json.
# Nếu bạn dùng Yarn, bạn cần đảm bảo file yarn.lock cũng được copy.

# Tôi sẽ loại bỏ lỗi này bằng cách chỉ tập trung vào package.json và toàn bộ source code sau đó.

# 2. Cài đặt dependencies 
RUN npm install
 
# 3. Copy toàn bộ source code (Bao gồm cả file lock, nếu có)
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
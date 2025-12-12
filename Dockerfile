# Đảm bảo bạn đang ở thư mục backend/Dockerfile
# GHI ĐÈ FILE Dockerfile

# Stage 1: Build Stage
FROM node:18-alpine AS build

# Sử dụng Yarn nếu có (hoặc npm)
WORKDIR /app
COPY package*.json ./
# Cài đặt dependency (sử dụng cache)
RUN npm install

# Copy source code
COPY . .

# Chạy build TypeScript (tạo thư mục dist)
RUN npm run build

# Stage 2: Production Stage (Nhỏ gọn hơn)
FROM node:18-alpine

WORKDIR /app
# Chỉ copy những file cần thiết cho môi trường Production/Dev
COPY package*.json ./

# Copy node_modules từ stage build (Quan trọng)
COPY --from=build /app/node_modules ./node_modules
# Copy file build (JS code)
COPY --from=build /app/dist ./dist

# Thay đổi lệnh chạy: Chuyển sang chế độ Watch (Development)
# Điều này giúp thay đổi code TS được nạp lại mà không cần rebuild Docker
CMD ["npm", "run", "start:dev"] 
# HOẶC nếu bạn muốn chạy Production chính thức, dùng: CMD ["npm", "run", "start:prod"]
# Sử dụng Node.js 18 trên nền Alpine Linux (nhẹ)
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file định nghĩa thư viện trước (để tận dụng cache của Docker)
COPY package*.json ./

# Cài đặt thư viện
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Build code TypeScript sang JavaScript (thư mục dist)
RUN npm run build

# Mở cổng 3000
EXPOSE 3000

# Lệnh chạy server
CMD ["npm", "run", "start:prod"]
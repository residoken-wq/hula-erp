# Dockerfile cho Development Mode (Frontend)
FROM node:18-alpine

WORKDIR /app

# Copy dependency list
COPY package.json ./
COPY package-lock.json ./ 

RUN npm install

# Copy toàn bộ source code
COPY . .

# Thêm VOLUME để tận dụng Hot Reloading
# VOLUME /app/src 

# Lệnh chạy Dev Server (Sử dụng lệnh start dev/serve trong package.json)
# Giả định lệnh này là "npm run dev"
CMD ["npm", "run", "dev"]
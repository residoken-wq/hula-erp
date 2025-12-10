FROM node:18-alpine

WORKDIR /app

# Copy file cau hinh
COPY package*.json ./

# Cai dat dependencies (bao gom ca Nest CLI)
RUN npm install
# Cai dat them CLI toan cuc de chac chan lenh 'nest' ton tai
RUN npm install -g @nestjs/cli

# Copy source code
COPY . .

# Build code
RUN npm run build

# Chay ung dung
CMD ["npm", "run", "start:prod"]

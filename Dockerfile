# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# 複製本地 SDK 與 package 定義
COPY package*.json ./
COPY taishinsdk.tgz ./ 

# 安裝依賴 (包含本地 .tgz)
RUN npm install

COPY . .

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/taishinsdk.tgz ./

RUN npm install -g ts-node typescript

# 台新 API 可能需要憑證，確保憑證路徑正確
# 可以透過環境變數傳入憑證內容或使用 Secret Manager 映射

CMD ["ts-node", "src/index.ts"]

# syntax=docker/dockerfile:1

FROM node:22-slim AS builder
WORKDIR /repo

COPY package.json package-lock.json ./
COPY lib/db/package.json lib/db/package.json
COPY artifacts/api-server/package.json artifacts/api-server/package.json
COPY artifacts/cintexa/package.json artifacts/cintexa/package.json
RUN npm ci

COPY lib/db lib/db
COPY artifacts/api-server artifacts/api-server
RUN npm run build -w @cintexa/db && npm run build -w api-server

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/lib/db/dist ./lib/db/dist
COPY --from=builder /repo/lib/db/package.json ./lib/db/package.json
COPY --from=builder /repo/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /repo/artifacts/api-server/package.json ./artifacts/api-server/package.json

EXPOSE 8080
CMD ["node", "artifacts/api-server/dist/index.js"]

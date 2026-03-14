FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

COPY --from=builder /app/dist ./dist

# App writes generated invoices to /app/invoices at runtime.
RUN mkdir -p /app/invoices && chown -R node:node /app

USER node

EXPOSE 4100
CMD ["node", "dist/main"]

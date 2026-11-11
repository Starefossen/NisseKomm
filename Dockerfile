# syntax=docker/dockerfile:1
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prod bakes NEXT_PUBLIC_* at build time: refuse test mode or mocked dates
RUN if ls -a | grep -q '^\.env' || env | grep -qE '^NEXT_PUBLIC_(MOCK_|TEST_MODE)'; then \
      echo "Byggekonteksten har .env* eller NEXT_PUBLIC_MOCK_*/TEST_MODE" >&2; exit 1; fi
RUN pnpm build \
 && cp -r public .next/standalone/public \
 && cp -r .next/static .next/standalone/.next/static

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
USER node
EXPOSE 8080
CMD ["node", "server.js"]

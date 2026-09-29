# syntax = docker/dockerfile:1

# Long Scroll: a plain Node HTTP server, node:sqlite for persistence (no
# native module to compile), one runtime dependency (marked, for /readme/).
# Serves HTTP on 0.0.0.0:$PORT (fly.toml sets PORT) and publishes README.md
# at /readme/ (spec/README.md says what's checked).

FROM node:24.21.0-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY src/ ./src/
COPY public/ ./public/
COPY README.md ./

ENV DATA_DIR=/data

CMD ["node", "src/server.ts"]

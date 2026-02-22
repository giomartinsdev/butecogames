# Stage 1: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace config and package.jsons for cache-friendly install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/

RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/

# Build shared, then client with placeholder env vars
# Placeholders get replaced at container startup with real values
ENV VITE_API_URL=__VITE_API_URL__
ENV VITE_WS_URL=__VITE_WS_URL__

RUN pnpm --filter @butecogames/shared run build && \
    pnpm --filter @butecogames/client run build

# Stage 2: Production (nginx)
FROM nginx:alpine

# Copy built static files
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# Copy nginx config template and entrypoint
COPY packages/client/nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY packages/client/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]

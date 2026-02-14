FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/

# Build shared package
RUN pnpm --filter @butecogames/shared run build

# Start client dev server
WORKDIR /app/packages/client
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]

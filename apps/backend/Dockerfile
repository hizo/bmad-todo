FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy package.json files for all workspaces
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["pnpm", "dev"]

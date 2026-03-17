FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy package.json files for all workspaces
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

WORKDIR /app/apps/frontend

EXPOSE 5173

CMD ["pnpm", "dev"]

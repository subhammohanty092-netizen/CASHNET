FROM node:22-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY lib/ lib/
COPY artifacts/api-server/package.json artifacts/api-server/
RUN pnpm install --frozen-lockfile --prod=false
RUN ls -la /app/artifacts/api-server/node_modules
COPY artifacts/api-server/ artifacts/api-server/
RUN ls -la /app/artifacts/api-server/node_modules || true
RUN ls -la /app/artifacts/api-server/node_modules/esbuild || true

FROM node:22-bookworm-slim AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @bazaar/contracts build
RUN pnpm --filter @bazaar/api build

FROM node:22-bookworm-slim
WORKDIR /repo
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 8000
CMD ["node", "dist/main.js"]

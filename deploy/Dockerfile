# Images for a hosted Oryx Live site. Build from the repository root:
#   docker build -f deploy/Dockerfile --target web .
#   docker build -f deploy/Dockerfile --target gateway .
# See docs/deployment.md.

ARG NODE_IMAGE=node:24-bookworm-slim

# Workspace dependencies, installed once from the lockfile.
FROM ${NODE_IMAGE} AS deps
RUN npm install -g bun@1.3.14
WORKDIR /app
# The desktop shell is not built here; skip Electron's binary download.
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/desktop/package.json apps/desktop/
COPY apps/gateway/package.json apps/gateway/
RUN bun install --frozen-lockfile

FROM deps AS web-build
COPY . .
RUN bun run build:web

# The web application: static files, with /api passed to the backend and /realtime to the gateway.
FROM nginx:1.27-alpine AS web
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
RUN mkdir -p /srv/downloads

# The notification gateway (apps/gateway), with only its own runtime dependencies.
FROM ${NODE_IMAGE} AS gateway-deps
RUN npm install -g bun@1.3.14
WORKDIR /app
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/desktop/package.json apps/desktop/
COPY apps/gateway/package.json apps/gateway/
RUN bun install --frozen-lockfile --production --filter @oryx/gateway

FROM ${NODE_IMAGE} AS gateway
WORKDIR /app
ENV NODE_ENV=production ORYX_GATEWAY_HOST=0.0.0.0 ORYX_GATEWAY_PORT=4100
COPY --from=gateway-deps /app/node_modules node_modules
COPY --from=gateway-deps /app/apps/gateway apps/gateway
COPY apps/gateway/src apps/gateway/src
USER node
EXPOSE 4100
CMD ["node", "apps/gateway/src/main.ts"]

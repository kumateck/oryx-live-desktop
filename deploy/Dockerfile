# Images for a hosted Oryx Live site. Build from the repository root:
#   docker build -f deploy/Dockerfile --target web .
#   docker build -f deploy/Dockerfile --target gateway .
# See docs/deployment.md.

ARG NODE_IMAGE=node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205
ARG BUN_IMAGE=oven/bun:1.4.4@sha256:1d22548f177f4ff38e0c15baa3c2c46c6c2060ba2d1bc573bb4720b407548f1d
ARG NGINX_IMAGE=nginx:1.30.6-alpine@sha256:47928bf67eb62a1863cb08d9ecb52d3e704304ba614eaee17884204677702951
FROM ${BUN_IMAGE} AS bun

# Workspace dependencies, installed once from the lockfile.
FROM ${NODE_IMAGE} AS deps
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx
RUN apt-get update -qq && apt-get install -y --no-install-recommends procps util-linux python3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# The desktop shell is not built here; skip Electron's binary download.
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1 HUSKY=0 CI=1
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/desktop/package.json apps/desktop/
COPY apps/gateway/package.json apps/gateway/
RUN bun install --frozen-lockfile

FROM deps AS web-build
# The web typecheck (part of the build) needs more than Node's default heap.
ENV NODE_OPTIONS=--max-old-space-size=6144
COPY . .
ARG RELEASE_SHA
ARG RELEASE_BRANCH=entrance-server
ENV RELEASE_SHA=${RELEASE_SHA} RELEASE_BRANCH=${RELEASE_BRANCH}
RUN bun run check && bun run build:web
RUN node deploy/customer-docker/build-metadata.ts

# CI and pre-push use the same isolated installation checks; this stage is never deployed.
# Keep the cheap installer checks independent so they fail before the full web build.
FROM ${NODE_IMAGE} AS customer-validation
WORKDIR /app
RUN apt-get -o Acquire::http::Timeout=30 -o Acquire::Retries=2 update && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::http::Timeout=30 -o Acquire::Retries=2 install -y --no-install-recommends nginx systemd util-linux git ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY deploy/customer-server deploy/customer-server
COPY contracts/openapi/backend.v1.json contracts/openapi/backend.v1.json
COPY scripts/customer-install-fixture.ts scripts/customer-install-fixture.ts
RUN ORYX_CUSTOMER_INSTALL_FIXTURE=container-only node scripts/customer-install-fixture.ts

# The web application: static files, with /api passed to the backend and /realtime to the gateway.
FROM ${NGINX_IMAGE} AS web
ARG RELEASE_SHA
LABEL org.opencontainers.image.revision=${RELEASE_SHA}
ENV ORYX_API_ORIGIN=http://oryx_api:5001 ORYX_GATEWAY_UPSTREAM=disabled.invalid:4100 ORYX_PUBLIC_PROTO=auto NGINX_ENVSUBST_FILTER="^ORYX_(API_ORIGIN|GATEWAY_UPSTREAM|PUBLIC_PROTO)$"
COPY --chmod=755 deploy/customer-docker/runtime.envsh /docker-entrypoint.d/15-oryx-runtime.envsh
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
COPY --chmod=755 deploy/keep-assets.sh /docker-entrypoint.d/40-keep-assets.sh
RUN mkdir -p /srv/downloads /srv/assets
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

# The notification gateway (apps/gateway), with only its own runtime dependencies.
FROM ${NODE_IMAGE} AS gateway-deps
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx
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

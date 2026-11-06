# The authoritative formula service is released separately from site and Electron updates.
FROM oven/bun:1.3.14@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4 AS build
WORKDIR /app
ENV HUSKY=0 ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/desktop/package.json apps/desktop/
COPY apps/gateway/package.json apps/gateway/
COPY services/formula-calculation/package.json services/formula-calculation/
RUN bun install --frozen-lockfile --ignore-scripts
COPY apps/web/src/shared/formula/core apps/web/src/shared/formula/core
COPY services/formula-calculation services/formula-calculation
RUN bun run --filter @oryx/formula-calculation typecheck \
    && bun run --filter @oryx/formula-calculation test
RUN bun build services/formula-calculation/host/main.ts services/formula-calculation/host/worker-entry.ts \
    --target=node --format=esm --outdir=/out --entry-naming='[name].mjs'

FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS runtime
WORKDIR /app
ARG ENGINE_BUILD_HASH
LABEL org.opencontainers.image.source=https://github.com/kumateck/oryx-live-desktop
LABEL com.oryx.formula.engine=$ENGINE_BUILD_HASH
ENV NODE_ENV=production FORMULA_V2_INTERNAL_SERVICE_ENABLED=false \
    FORMULA_SERVICE_HOST=0.0.0.0 FORMULA_SERVICE_PORT=3101 \
    FORMULA_SERVICE_RELEASE_ENGINE_HASH=$ENGINE_BUILD_HASH
RUN groupadd --gid 10001 formula && useradd --uid 10001 --gid formula --no-create-home formula
# Root-owned and read-only to the service user: the process cannot rewrite its own code.
COPY --from=build /out ./formula-service
USER formula
EXPOSE 3101
CMD ["node", "formula-service/main.mjs"]

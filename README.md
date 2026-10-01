# Oryx Live Desktop

Electron Forge shell plus a separately deployed React application for Oryx customer servers. The shell connects to a site-specific trusted HTTPS origin. The React app is built and served by that customer server; ordinary UI releases therefore do not require reinstalling clients.

This repository is in the first module stage. It has a typed file-route generator, compact workspace, configurable appearance, desktop connection screen, sign-in against the existing Oryx backend (the same one Oryx Next uses, unchanged), the backend's published OpenAPI contract, and strictly typed generated hooks for 20 API domains (1,078 of 1,324 backend operations; the rest are listed in `docs/api-untyped-operations.md`). Roles and Users are the migrated modules. Most ERP routes, live notification data, and native updates are **not yet integrated**. See [PLAN.md](PLAN.md) for the sequence and open decisions.

## Requirements

- Node.js 22.22 or newer; Bun 1.3.14 for package management.
- A customer server with a trusted HTTPS certificate for the address clients use. When clients use an IP address, that IP must be present in the certificate.
- macOS or Windows for Electron development. Windows installer verification must run on Windows.

## Development

```sh
bun install
bun run routes:generate
bun run api:export
bun run api:generate
bun run test
bun run typecheck
bun run dev:web
```

Use `bun install --frozen-lockfile` in CI. The root override pins `@electron/node-gyp` to its published Electron package because the transitive Git archive in `@electron/rebuild` prevents a reliable frozen Bun install.

Copy `apps/web/.env.example` to `apps/web/.env` (ignored by git); it points `ORYX_DEV_API_ORIGIN` at the shared backend `http://164.90.142.68:8086`. `bun run dev:web` proxies requests to `/api` there; requests to `/api` are proxied there. HTTPS and loopback addresses are accepted. A plain-HTTP remote address sends passwords and tokens unencrypted and is refused unless `ORYX_DEV_ALLOW_INSECURE_API=1` is also set. A missing API origin leaves the UI runnable without a backend proxy.

In another terminal, run `bun run dev:desktop`. On the connection screen, use `http://127.0.0.1:5173` only for local development. A packaged app requires trusted HTTPS. `bun run build:web` creates `apps/web/dist` for the customer server; the server must serve `index.html` for client-side routes and keep the hashed assets of prior releases during refresh transitions.

## Repository layout

- `apps/web`: customer-hosted React SPA. `src/pages` contains file routes; `src/routes/generated.tsx` is generated.
- `apps/web/src/shared/theme`: system/light/dark appearance settings, Oryx accent presets, and derived shell colors.
- `apps/web/src/shared/forms`: typed FormWizard, React Hook Form wiring, and lazily loaded shadcn field renderers. See `docs/forms.md`.
- `apps/web/src/components/ui`: current shadcn source components on Tailwind CSS 4. Add components only as workflows need them.
- `apps/web/src/modules`: small typed module manifests and domain-owned implementation. Roles and Users are the migrated modules.
- `apps/desktop`: Electron Forge shell and local server-connection view.
- `scripts/routes`: route parser and generator.
- `contracts/openapi`: versioned API contracts used by `scripts/generate-api.ts`.
- `tests`: focused route and site-address tests.
- `docs`: architecture and verification notes.

The module boundary and migration rules are in [docs/module-architecture.md](docs/module-architecture.md).
API generation and its current scope are in [docs/api-codegen.md](docs/api-codegen.md).
Session handling, permission guards, and user display are in [docs/session-and-access.md](docs/session-and-access.md).
The four data tables (server-paged, client-paged, list, draggable) are in [docs/datatable.md](docs/datatable.md).
Appearance behavior and the Oryx accent list are in [docs/appearance.md](docs/appearance.md).

## Quality checks

`bun run routes:check` ensures generated routes are current and enforces the 200-line page limit. `bun run api:check` checks generated API drift, rejects untyped output, and fails on a backend tag with no domain. `bun run test` covers route collisions/nesting, appearance tokens, session behavior, role permissions and table paging, and server URL validation. `bun run typecheck` checks application and generated TypeScript. `bun run build:web` builds the hosted SPA. The `AGENTS.md` guide defines ownership, business safeguards, and verification requirements for later migration work.

No packaged-app or customer-server deployment has been validated yet; those are explicit phase gates in `PLAN.md`.

# Oryx Live Desktop

Electron Forge shell plus a separately deployed React application for Oryx customer servers. The shell connects to a site-specific HTTP or HTTPS frontend origin. The React app is built and served by that customer server; ordinary UI releases therefore do not require reinstalling clients.

This repository is in the first module stage. It has a typed file-route generator, compact workspace, configurable appearance, desktop connection screen, sign-in against the existing Oryx backend (the same one Oryx Next uses, unchanged), the backend's published OpenAPI contract, and strictly typed generated hooks for 20 API domains (1,079 of 1,325 backend operations; the rest are listed in `docs/api-untyped-operations.md`). Roles and Users are the migrated modules. Most ERP routes, live notification data, and native updates are **not yet integrated**. See [PLAN.md](PLAN.md) for the sequence and open decisions.

Purchase-unit synchronization requires the companion backend migration/API before
frontend rollout. See [supplier purchase units](docs/supplier-purchase-units.md)
for symbol storage, approval behavior and verification.

## Requirements

- Node.js 22.22 or newer; Bun 1.3.14 for package management.
- A customer server serving the Oryx frontend over HTTP or HTTPS. Intranet HTTP is supported in installed clients. For HTTPS, the certificate must be trusted and cover the hostname or IP clients use.
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

In another terminal, run `bun run dev:desktop`. On the connection screen, enter the frontend origin: `http://127.0.0.1:5173` for local development, or your customer's HTTP/HTTPS web application address. Do not enter the backend API address; the frontend proxies `/api` to the backend. HTTP sends session traffic without transport encryption, so HTTPS remains preferred when available. `bun run build:web` creates `apps/web/dist` for the customer server; the server must serve `index.html` for client-side routes and keep the hashed assets of prior releases during refresh transitions.

Desktop sources and Forge/Vite configuration use TypeScript with ES module imports. Forge emits the main process as `.vite/build/main.cjs` and the sandboxed preload as `.vite/build/preload.cjs`; keep these filenames aligned with `package.json` and the window's preload path. The explicit CommonJS extensions avoid conflict with the desktop package's `"type": "module"`. A sandboxed Electron preload requires CommonJS ([Electron module support](https://www.electronjs.org/docs/latest/tutorial/esm)). After changing build configuration, stop the previous Forge process and restart `bun run dev:desktop`.

The local connection view links its stylesheet directly and keeps its wordmark as an external asset so both load under its restrictive Content Security Policy. Its setup URL is canonicalized before exact IPC sender validation (including the development server's trailing slash).

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
Attachment filenames and View actions across the application use Oryx’s built-in read-only viewer for PDF, DOCX, XLSX and images, with an in-viewer explanation for unsupported formats; see [docs/attachment-viewers.md](docs/attachment-viewers.md) and the [application-wide attachment audit](docs/attachment-audit.md). Web development/build commands verify and extract pinned local engines automatically, with no Rust toolchain or Artcraft/Dodo service required.
The four data tables (server-paged, client-paged, list, draggable) are in [docs/datatable.md](docs/datatable.md).
Appearance behavior and the Oryx accent list are in [docs/appearance.md](docs/appearance.md).

## Quality checks

`bun run routes:check` ensures generated routes are current and enforces the 200-line page limit. `bun run api:check` checks generated API drift, rejects untyped output, and fails on a backend tag with no domain. `bun run test` covers route collisions/nesting, appearance tokens, session behavior, role permissions and table paging, and server URL validation. `bun run typecheck` checks application and generated TypeScript. `bun run build:web` builds the hosted SPA. The `AGENTS.md` guide defines ownership, business safeguards, and verification requirements for later migration work.

A testing site and Windows installer are deployed from the `testing` branch; see [docs/deployment.md](docs/deployment.md). The [customer-server deployment package](deploy/customer-server/README.md) polls `entrance-server`, uses a permanent customer `.env` for the existing backend, and provides validated releases and rollback. Customer installation/acceptance and signed shell updates remain phase gates in `PLAN.md`.

Engine maintainers can rebuild reviewed viewer-only WASM adapters with `bun scripts/build-readonly-viewers.ts /absolute/isolated-workspace <engine>`; see the attachment viewer guide for pinned toolchain, source and provenance requirements. Ordinary builds continue to use verified local bundles.

## Desktop companion

View → Show / Hide ORYX Companion controls the optional local Operations Watch character. Click the character for notifications, or click an alert in its growing feed to open the linked shipment details; drag to move; right-click for quiet mode. See [companion behavior and limits](docs/companion.md).

System alerts also appear while Oryx is in front. Closing to the tray keeps delivery running; use Quit Oryx to exit. Missed alerts remain in backend unread history. [Notification delivery and backend requirements](docs/notifications.md).

Companion device controls are under Settings → Appearance. Run `bun run --filter @oryx/desktop test` for renderer/persistence tests; these also run in the root `bun run test` command. Native alert clicks locate the matching unread/history entry without marking it read.

## Manual customer Docker installation

Use [the customer Docker package](deploy/customer-docker/README.md) for the Ubuntu `entrance` account: production follows **`origin/entrance-server` only**, project **`oryx-live`**, port **3001**, existing external **`sail`** network and backend **`oryx_api:5001`**. It reuses the existing web Docker build with pinned **Bun 1.4.4**. The administrator installs it through SSH commands and enables Cron; no Codex installation is needed. Deployment checks, Discord reporting, locking, pause/resume and archived-image rollback are included. The host-Nginx agent remains separate.

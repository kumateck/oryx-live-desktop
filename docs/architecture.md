# Foundation architecture

## Delivery boundary

The customer server serves the React SPA and API at one configured HTTP or HTTPS origin. Installed clients support intranet HTTP, as requested on 2026-10-02; HTTPS remains preferred and requires a trusted certificate. The installed Electron shell stores only that origin in its user-data directory and loads it in a sandboxed renderer. UI and shell releases follow separate paths. The initial scaffold does not implement either release pipeline yet.

## Route convention

`apps/web/src/pages` uses `page.tsx`, `layout.tsx`, `loading.tsx`, and `error.tsx`. Route groups such as `(workspace)` do not add URL segments. `[id]` creates a named parameter; `[...rest]` is a terminal catch-all. Nested layouts follow the folder tree. Run `bun run routes:generate` after adding a route, and commit the generated output. Generation rejects duplicate effective URLs, ambiguous dynamic siblings, invalid segments, missing default exports, and route pages longer than 200 lines.

React Router 8.4 data route objects lazy-load page and layout modules. `loading.tsx` supplies a hydration fallback; the persistent shell also shows navigation progress in its footer. Future data-loading behavior must be verified in the pilot workflow rather than assuming hydration fallback covers every transition.

## ERP module boundary

Each business module has a small typed manifest in `apps/web/src/modules/<module>/manifest.ts`. Vite discovers these manifests without importing page implementations. Registry validation rejects duplicate module IDs/roots, duplicate navigation IDs, and paths outside a module. Navigation access rules are typed and deny anonymous access. The current foundation has only a workspace manifest; module navigation will be wired to the final authenticated session when that contract is implemented. See [module-architecture.md](module-architecture.md).

## Security boundary

The connection view is local. It can set a site origin through a narrow preload bridge. The main process accepts configuration IPC only from that view. The remote customer site receives the same preload bundle, but main rejects its configuration requests. Remote navigation and new windows are restricted; renderer Node integration is off, context isolation and sandboxing are on, and permission requests are denied by default. The customer server must supply a restrictive production Content Security Policy; HTTPS deployments must supply a trusted certificate. HTTP does not encrypt session traffic; allowing it does not disable certificate validation or Chromium security protections.

## Current limits

The current UI is a layout foundation, not a migrated ERP workflow. A desktop-session flow and its first generated RTK Query hooks exist, but the full backend OpenAPI export, business-module data integration, live update safety, MinIO shell update feed, and notification gateway remain implementation gates. Do not use the foundation build for production customer work.

## Desktop menu bar and server connection

The desktop shell loads the **Oryx web application**; the web application talks to the backend API. The address entered on the setup page is the web application's, never the backend's. An address that answers but is not the web application (it has no `<meta name="application-name" content="Oryx Live">`) is refused with a message.

The menu bar (`apps/desktop/src/menu.ts`) carries what the shell itself can do:

| Menu | Item | Does |
| --- | --- | --- |
| Server | Connected to … | Shows the saved address. |
| Server | Reconnect (Ctrl/Cmd+Shift+R) | Loads the saved server again. |
| Server | Change Server… (Ctrl/Cmd+Shift+S) | Back to the setup page with the address filled in. |
| Server | Forget Server… | After confirming: removes the saved address and the sign-in kept for it. |
| File | Print… | Prints the open page. |
| Go | Back, Forward, Home | Moves within the connected server only. |

In development the setup page is served on port 5273, so port 5173 stays free for `bun run dev:web`. The saved address is `site-url.txt` in the app's user-data folder.

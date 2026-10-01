# Oryx Live Desktop agent guide

This guide applies to work in `oryx-live-desktop`. Read `PLAN.md` before changing architecture. Preserve Oryx business behavior while building a compact, responsive desktop experience. Follow the user's current instructions when they supersede this guide. This file does not authorize implementation while a decision remains in planning.

## Priorities and ownership

When concerns conflict, prioritize data integrity, backend authorization, auditability, user task completion, security, then visual polish.

| Area | Owns | Does not own |
| --- | --- | --- |
| Electron main/preload | Window lifecycle, connection, updates, narrow native bridge | ERP business rules or broad renderer access to Node |
| Route pages | Params, access/loading/error states, section composition | API mapping, validation, workflow logic, long JSX |
| Domain components | Feature presentation and interaction | Fetching unrelated domains or hidden global state |
| Domain hooks | React state, composed generated queries/mutations, actions | Pure formatting or giant multi-purpose controllers |
| Domain functions/schemas | Mapping, calculation, formatting, validation | React state or Electron APIs |
| Generated API | OpenAPI types and RTK Query endpoints | Handwritten edits |
| Shared UI/lib | Proven cross-domain primitives and contracts | Domain-specific business rules |

For substantial features, use `apps/web/src/modules/<module>/{components,hooks,lib,schemas,api,types}`. Use fewer folders for small features. Route files stay in the file-routing tree; reusable code belongs outside them.

For the desktop application, each ERP module also owns a small typed manifest under `apps/web/src/modules/<module>/manifest.ts`. The registry discovers manifests without eager-loading pages. A module owns its navigation entries, permission requirements, detail components, hooks, schemas, API adapters, and tests. Cross-module imports use explicit shared contracts; do not reach into another module's internal files. See `docs/module-architecture.md`.

## Architecture

- Keep Electron main and preload small. The renderer is a React SPA served by the customer's server over trusted HTTPS. Expose only narrowly scoped, typed native actions through preload; validate IPC origin and input.
- Use React Router file routing generated from route files. Keep route paths, layout nesting, loading/error boundaries, and imports deterministic. Do not maintain a second manual route list.
- Retain RTK Query and generated OpenAPI DTOs/hooks. Put handwritten API behavior, cache policy, and transformations outside generated files. Do not edit generated output manually.
- Before adding an API hook, inspect `docs/api-codegen.md` and the backend controller contract. Generate domain-scoped RTK Query endpoints from a versioned OpenAPI file, run `bun run api:check`, and reject untyped generated fallbacks. Keep operation IDs stable and avoid importing every domain endpoint into the shell.
- Keep site-delivered UI releases and installed shell updates separate. Respect API and minimum-shell compatibility before activating a site release.
- Tailwind CSS 4 and current shadcn source components are the shared component foundation. Add only the needed shadcn components and verify their generated source under strict TypeScript; keep the Oryx theme tokens in `apps/web/src/shared/theme` authoritative.

## Page and reuse rules

- Write handwritten application code, scripts, and tests in TypeScript with strict compiler settings. Do not use explicit `any` or `unknown`; define domain types and use narrow type guards for external data. Do not silence errors with broad casts, `@ts-ignore`, or non-null assertions. Prefer discriminated unions for loading, error, permission, and workflow states.
- A handwritten route `page.tsx` or `page.ts` must be **200 physical lines or fewer**, including blank lines and comments. Treat 160 lines as the point to extract logic or UI. Do not evade the limit with compressed lines or giant JSX expressions. Add a CI check when route scaffolding begins.
- Pages compose: route data, permissions, loading/error states, and a few domain sections. Extract repeated presentation to components, repeated behavior to hooks, and pure transformations/validation to functions. Keep domain-specific code close to its domain; promote it to shared code only after a real second use or a clear cross-domain contract.
- A route page is an orchestration file: read route parameters, call a page-level hook, select loading/error/access states, and assemble sections. Do not put API transformations, complex state machines, form schemas, or long JSX blocks in a page.
- Split by responsibility within each domain: `components/` for display and interaction, `hooks/` for React state and composed query/mutation behavior, `lib/` or `utils/` for pure functions, `schemas/` for validation, and `types/` for handwritten types. Keep generated API types and hooks in the generated API area. A hook should not become a hidden 500-line page; split query, action, and presentation concerns when they grow.
- Prefer explicit inputs and outputs for hooks and functions. Keep side effects at the boundary, make pure functions easy to verify, and avoid circular imports or domain code reaching into another domain's internals.
- Follow React's rules: keep rendering pure, call hooks only at the top level of components or other hooks, and update state immutably. Split a large extracted hook by query, action, or interaction responsibility instead of hiding a whole page inside it.
- Reuse existing Oryx domain components and functions when they fit. Prefer one source of truth for status labels, permission checks, money/date formatting, workflow actions, and API mapping. Do not duplicate business rules in page JSX.
- Before creating or changing any component, check whether the needed component or behavior already exists in the current shadcn registry and in `apps/web/src/components/ui`. Use the current shadcn component when it fits, add only what is needed, and review its generated source and dependencies. Build a custom component only for behavior shadcn does not provide, such as Oryx's width-aware multi-select. Preserve the existing datatable for lists. Avoid wrappers that merely rename a shadcn primitive; wrap when adding repeated Oryx behavior or styling.
- Keep forms on React Hook Form and Zod. Rebuild FormWizard as a small typed core with field renderers owned by separate modules. Load a renderer only when a form declares that field type; keep heavy editors, uploads, signatures, and table inputs in lazy chunks. Do not copy the old eager registry or its broad casts.
- Declare form field types with `InputTypes` (`shared/forms/input-types.ts`), as in Oryx Next: `type: InputTypes.SELECT`, not `type: "select"`.
- Follow `docs/forms.md` when migrating forms. Keep schemas and API mutation behavior in the owning module; use the shared field composer only for control wiring and presentation. Set field arrays outside render when static, and use a stable lazy loader for domain controls.
- Show quantities with `toLargestUnit` / `formatQuantityNumber` (`shared/units/quantity.ts`). A number a person entered keeps every decimal they typed; a number the system calculated is passed as `"calculated"` and shown to at most four decimals. Never round an entered value for display, and never show a non-zero amount as zero.
- Use shared theme variables through Tailwind and shadcn controls. Scope ordinary CSS to the shell or named feature classes; avoid global element selectors that silently change module pages. Use direct named React Icons imports when a filled icon is needed; do not add Iconsax or a runtime icon-name registry.
- Preserve list and detail responsibilities. Detail pages may be rebuilt visually, but must retain fields, actions, validations, permissions, approvals, and audit behavior.

## Desktop UX and performance

- Keep the header and footer visible; scroll the central content vertically. No window or page horizontal scrollbar at 1366×768 and 1280×720, including Windows 125% and 150% scaling. Do not hide important fields or actions to satisfy this rule.
- Start from the typography and spacing tokens in `PLAN.md`. Prefer clear hierarchy and restrained surfaces over oversized cards, nested borders, and large loading overlays.
- While a page's data loads, show a skeleton shaped like the page (`shared/skeleton`: `DetailPageSkeleton`, `FormPageSkeleton`, `PageSkeleton`, or `Skeleton` blocks), not a spinner with text. Tables show their own skeleton rows. Keep spinners for buttons and short in-place waits.
- Row actions use `TableMenu` and grouped actions use `DropdownButton` from `apps/web/src/shared/actions`; do not list action buttons in a table cell. Put permissions on the items with `require`. See `docs/actions.md`.
- Lazy-load routes and genuinely heavy panels such as charts, editors, and print views. Keep the first visible screen useful while secondary data loads. Avoid request waterfalls, duplicate polling, broad cache invalidation, and unnecessary global re-renders.
- Measure startup, route transition, bundle weight, and memory on target-class laptops before setting hard budgets. Test with realistic long names, dense records, restricted permissions, slow network, and server outages.
- Ensure keyboard navigation, visible focus, accessible labels, readable text, and usable controls at display scaling. Motion must be subtle and respect reduced-motion preferences.

## ERP integrity and security

- Preserve backend authority for permissions and regulated actions. Never bypass approval gates, silently change quality/production/logistics status, or omit audit records for sensitive operations.
- Keep inventory and financial events traceable. Verify reconciliation and reporting effects when a workflow changes.
- Never persist session secrets in renderer local storage. Do not weaken TLS, Electron sandboxing, context isolation, navigation restrictions, or content security to make a feature work.
- Keep `nodeIntegration` off, `contextIsolation` and renderer sandbox on, and a restrictive Content Security Policy. Restrict navigation, window creation, permissions, and external URLs; validate IPC sender, origin, channel, and arguments. Never expose generic IPC or raw Electron/Node APIs to the remote renderer.
- Deploy site assets as immutable versioned builds, validate before switching, and retain prior assets for active sessions. Sign shell releases and test rollback, interrupted updates, and API/minimum-shell compatibility.
- Handle unsaved work before a live-UI refresh. Show connection failure and retry clearly; do not imply that work was saved when the server is unreachable.

## Working and verification

Use Bun 1.3.14 as the sole package manager for this workspace. Commit `bun.lock`, use `bun install --frozen-lockfile` for reproducible installs, and use `bunx shadcn@latest add <component>` when the reviewed shadcn registry has the control needed. Keep package overrides documented and scoped to the dependency that needs them.

1. Inspect the affected route, API contract, existing components, and workflow before editing. State assumptions when evidence is incomplete.
2. Make the smallest coherent change. Keep dependencies and generated output reproducible; avoid unrelated refactors.
3. Verify behavior at the right level: typecheck/build for changed code; focused tests for business logic and risky interactions; a route-generation check for route changes; visual checks at target sizes for shell and detail layouts. Test the packaged app and installed update path for shell/update work.
4. For a business-critical change, account for API contract, validation, permissions, workflow events, audit, and failure/retry behavior.
5. Update the relevant documentation when commands, architecture, deployment, or workflow behavior changes. Report what changed, what was verified, and any remaining risk.

During the planning phase, record decisions in `PLAN.md`. Do not treat a proposed design token or performance budget as measured fact.

## Definition of done

The requested behavior works; permissions, audit, and failure paths remain correct; page limits and ownership boundaries hold; accessibility and target-screen behavior are checked where relevant; verification appropriate to the risk passes; and affected documentation is current. Report checks that were not run rather than implying they passed.

Reference guidance: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [Electron updates](https://www.electronjs.org/docs/latest/tutorial/updates), and [React rules](https://react.dev/reference/rules).

# ERP module architecture

Oryx will migrate about 27 business modules. The current `oryx-next` permission navigation has 16 top-level groups (such as procurement, logistics, warehouse, production planning, R&D, QC, QA, finance, HR, settings and reports). Those groups are presentation categories, not a verified one-to-one module inventory. The migration inventory must map every existing route and workflow to an owning module before all modules are implemented.

## Ownership model

```text
apps/web/src/
  pages/                         file routes: thin page/layout/error/loading files
  modules/
    contract.ts                  typed manifest, navigation and access contracts
    registry-model.ts            pure validation and visibility rules
    registry.ts                  automatic manifest discovery
    <module>/
      manifest.ts                small metadata, no page imports
      components/               module UI sections and interactions
      hooks/                    query/mutation and local interaction hooks
      lib/                      pure mapping, formatting, calculations
      schemas/                  form and command validation
      api/                      handwritten adapters around generated endpoints
      types/                    handwritten domain types only
      __tests__/                focused business and interaction tests
  shared/                        cross-module contracts and proven UI primitives
  shared/api/generated/          reproducible OpenAPI output, split by domain
```

Create only the folders a module needs. A route `page.tsx` stays under 200 physical lines and assembles module sections. It does not own business rules. A module's `manifest.ts` declares its ID, root path, ordering, route access rules, and navigation; the shell enforces the route rules (see `docs/session-and-access.md`); it must not import heavy components, API hooks, or generated endpoint modules. The registry discovers new manifests automatically.

## Dependency direction

```text
page → module public entry → module components/hooks/functions → generated API + shared contracts
module A ↔ shared contract ↔ module B
```

No module imports another module's internal component, hook, or utility path. Shared primitives are promoted after real reuse, with a stable contract and tests. Generated DTOs and hooks remain the transport contract; modules may map them into display models or validated commands. Backend checks remain authoritative for permissions and actions.

## Route and navigation relationship

The route generator remains the source of URL matching. Manifests describe navigation and access, not another route table. Detail routes can be absent from navigation while still belonging to a module. A future validation step should check manifest paths against generated routes and require an explicit module owner for migrated business routes. Navigation visibility never substitutes for backend authorization.

`PageHeader` / `PageBreadcrumbs` infer the navigation ancestors and accept record/action crumbs. An explicitly supplied first parent with the same destination replaces the inferred parent and its descendants; it is shown once. The explicit link can add filters to a generic parent, but must preserve any query constraints on the inferred parent (for selected queues or material types). Equal labels alone are never collapsed because a record may share its parent's name.

The module icon rail shows each group's display name on hover and keyboard focus using the shared shadcn Tooltip, portalled to the right so the scrolling rail cannot clip it. Icons retain accessible names and pressed state; Escape dismisses the tooltip. The root TooltipProvider uses a 200ms hover delay. The shared source follows [shadcn's Radix Tooltip](https://ui.shadcn.com/docs/components/radix/tooltip) and uses the already installed Radix dependency.

`WorkspaceHeader` owns the logo, shadcn panel toggle, divider, title, and header actions. Shared shell width variables align the divider to the sidebar/content boundary and the title to the content gutter while navigation is expanded. The wordmark stays visible in every navigation state, including narrow windows. Collapsed navigation reserves a compact 136px header brand area for the logo and panel toggle; the title follows it without overlapping the logo.

The shell uses a 56px icon rail with 36px controls and 10px side padding. The secondary sidebar is 296px wide, reducing to 264px below 1100px and 240px below 850px; the existing narrow-window behavior hides it below 650px. A separated 64px heading and independently scrolling entries keep navigation clear. Shared surface geometry in `shared/theme/surfaces.css` uses 6px control, 8px card, and 10px panel radii, with quiet outer borders and a visible sidebar/content divider. Theme-derived colors continue to respect saved appearance profiles and contrast.

Expandable navigation entries place their chevrons at the right edge. Desktop label overrides live in `scripts/import-navigation.ts`, so re-importing Oryx Next navigation retains concise names (for example General, Collections, Inventory, Organization and Procedure Areas) while preserving route addresses, IDs and permission requirements. Avoid cutting off labels just to make them fit; use concise, meaningful names and allow wrapping for unusual lengths or larger text settings.

## Performance at 27 modules

Route pages and layouts are lazy imports. The small manifests may load at startup; module implementations and domain API endpoint chunks load when a route needs them. Keep the core shell, session, navigation, and error UI independent of large generated API files. A module should split expensive editors, reports, charts, and secondary detail sections further. Measure initial bundle, first route, route transitions, and memory on target laptops before setting budgets.

## Migration gate for each module

1. Inventory routes, list/detail/edit/review flows, permission keys, backend endpoints, and shared dependencies.
2. Define its manifest and map existing navigation without inventing a second route list.
3. Migrate a representative detail flow with field/action/validation/approval/audit parity; retain the existing datatable for lists.
4. Add focused tests for permission visibility, pure rules, mutations, error/retry, and route generation. Verify at target screen sizes and display scaling.
5. Document release compatibility and update the module inventory when the ownership mapping changes.

## First slice: Roles

`modules/roles` owns its permission keys, audit headers, response validation, list table, role editor, and permission picker. The file routes under `pages/(workspace)/access-management/roles` are thin compositions. The list uses the shared `ClientDataTable` (see `docs/datatable.md`). Create loads the permission catalog once and clears default access before editing; detail loads one role by ID rather than fetching a full list. Detail and permission saves are separate because the backend exposes separate mutations. Role and list cache tags are invalidated narrowly. A permission save rechecks the current session so navigation reflects newly granted or revoked rights.

The backend checks `CanViewRoles`, `CanCreateRole`, `CanEditRole`, and `CanDeleteRole` on role endpoints, and `CanUpdateExistingPermission` on permission changes. The UI uses the same keys for visibility, but server authorization remains authoritative.

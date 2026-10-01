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

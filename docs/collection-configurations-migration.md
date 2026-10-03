# Configuration collections

The desktop route is `/settings/config`. `?collection=<id>` identifies the selected collection, supports direct links, and works with browser history. It replaces the Oryx Next collection workspace with a compact collection picker and the existing searchable, sortable, paginated datatable. Only the selected, permitted collection is fetched. Forms and their FormWizard renderers load when needed.

## Coverage

| Group | Collections |
| --- | --- |
| Categories | Product, raw material, packaging, item, QC equipment categories |
| Procedures | Resources, operations, work centers, sites |
| Products | Material types, units of measure, package styles, product states |
| Address | Countries |
| Schedules | Shift categories |
| Payments | Payment terms, delivery modes, charges |

`modules/collection-configurations/lib/collections.ts` owns labels, model names, material kinds, field limits, and exact Oryx permissions. The module guard and sidebar use its view permissions. Each collection and each action require their own permission; product-category access is no longer required to view unrelated collections. Inaccessible query parameters never fetch another collection silently.

## Integration and integrity

No backend code or generated transport code is changed. The module enhances existing generated settings hooks with scoped cache tags. Requests preserve the Oryx Next audit headers `Module: Settings` and `SubModule: Configurations`.

- Generic lists: `GET /api/v1/collection/{itemType}`. Raw and packaging categories pass `materialKind=0` and `materialKind=1` respectively; create/edit payloads preserve the same kind.
- Generic create, update, and removal: `POST /{itemType}`, `PUT /{itemType}/{id}`, `DELETE /{itemType}/{id}` under the collection root. Successful removal returns 204 in the controller despite the OpenAPI declaration of a GUID; the UI does not depend on a response body.
- Units use dedicated create/update/remove endpoints under `/api/v1/collection/uom`. Editing first reads the complete unit through `POST /uom/{id}`, exposed as a cached query using the generated response type. Symbol, scalability, type, category, and description are retained; no default classification is silently applied to a partial list record.
- Zod validates transport data before enabling mutations and validates trimmed names, duplicate names within the fetched collection, field lengths, resource type, whole nonnegative payment due days, and required unit classifications. The backend remains authoritative for cross-collection uniqueness and dependencies.
- Removal requires confirmation. Failed operations keep the dialog and entered values, expose the server error, and do not report success. Dirty forms ask before dismissal, including Escape and outside clicks. Dialog bodies scroll between fixed headers and footers.
- Successful mutations invalidate only their model's collection cache and affected full unit cache. Both raw/packaging views share their material model's invalidation. Failed mutations do not invalidate cached lists.

## Existing backend constraints

These constraints were confirmed in `oryx-backend/APP/Repository/CollectionRepository.cs`, `API/Controllers/CollectionController.cs`, and the collection DTO/mapping definitions. They are not resolved by this frontend integration:

1. Generic resource reads omit type and availability. Generic payment-term reads omit due days. Updates map the full request and could erase those values. **Edits are disabled with an explanation** until a complete read contract is available. Create and confirmed removal remain available with the corresponding permissions.
2. Countries can be read, but the generic repository does not support country writes. Countries are read-only in this workspace.
3. Unit update uniqueness checks include the record being updated. Keeping the existing name or symbol can produce a duplicate error even when changing another field. The desktop sends the correct full payload and retains the user's draft when the server rejects it; it never renames a unit to bypass the check.
4. The paginated unit endpoint ignores nonempty search text in its current repository condition. This workspace searches and pages the basic unit list locally and fetches complete details only when editing. The generic endpoint returns the whole collection; client pagination limits rendered rows, but does not reduce downloaded rows. Server pagination remains a future backend improvement for very large reference collections.
5. The generic controller requires authentication but does not itself declare per-action permission policies. Desktop permission guards preserve Oryx access rules; they do not replace backend authorization.

## Verification

Focused tests cover independent access, no inaccessible fetches, one active collection request, material-kind separation, audit headers, local search, required fields, duplicate names, payload trimming, scoped refetch, failed saves and dirty dismissal, confirmed removal, unsafe-edit blocking, and complete unit payload preservation. Navigation tests check each independent collection viewer can reach the page.

Verified on 2026-10-01: 15 focused collection tests and eight navigation tests passed; full workspace typechecking, route-generation checks, generated API checks, production web build, and diff whitespace checks passed. The route page is 27 physical lines. The production build emits separate item-dialog and unit-dialog chunks (1.34 kB and 2.12 kB gzip respectively, excluding shared dependencies); this confirms code splitting, not measured startup performance on customer computers.

React Doctor's full scan reported a collection-panel complexity warning. The module separates its typed definitions, schemas, API adapter, table columns, and editors, with a small route page; no behavior defect was identified by that warning. Its reported supplier timer error is unrelated: the cited `setInterval` is a React state setter for requalification days, not a timer. The scan still exits with findings across the broader workspace and is not a clean lint gate.

```bash
bun run --filter @oryx/web test src/modules/collection-configurations
node --test tests/navigation.test.ts
bun run routes:check
bun run typecheck
bun run build:web
bunx react-doctor@latest apps/web --verbose --scope full
```

Live authenticated integration and customer-laptop visual acceptance are still required. Mocked tests do not prove deployed server behavior or real display scaling. Do not run production create/update/delete actions solely for verification.

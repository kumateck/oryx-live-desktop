# API contracts and generated hooks

The desktop keeps one RTK Query API in `apps/web/src/shared/api/base-api.ts`. Domain outputs inject endpoints into it. Route chunks import only their domain output, keeping the shell and login path free of the full ERP endpoint graph.

## Reproduce the contract

Run from `oryx-live-desktop`:

```bash
bun run api:export
bun run api:generate
bun run api:check
```

The desktop uses the same backend as Oryx Next. Additive features such as purchase-unit synchronization require their companion backend migration/API before frontend rollout. `api:export` downloads the OpenAPI document the backend already publishes at `/swagger/v1/swagger.json` and saves it as `contracts/openapi/backend.v1.json`. By default it reads `http://localhost:5299` (the backend started locally; no database is needed to serve the document); set `ORYX_OPENAPI_URL` to use another running instance. The backend declares its `Module` and `SubModule` audit headers without a type, so the export records them as strings; nothing else is altered.

`api:generate` writes one file per domain to `apps/web/src/shared/api/generated/`. These are transport code and must never be edited by hand. `scripts/api-domains.ts` assigns every backend controller tag to exactly one domain; generation fails when the contract contains a tag that no domain owns, so a new controller cannot be missed. An operation is generated once, into the domain of its first tag.

Generation is strict per operation, not per domain. `scripts/api-contract.ts` reads the contract and skips any operation that would produce `any` or `unknown`: a 2xx response other than 204 with no declared body type, or a request, parameter, or response schema that reaches an untyped property. Skipped operations are listed with their reason in the generated `docs/api-untyped-operations.md`, which is the backend typing backlog. A 204 response becomes `void` automatically. ASP.NET ProblemDetails extensions are arbitrary JSON, represented by a recursive `JsonValue` type. Any `any` or `unknown` that still reaches the output fails generation. `api:check` regenerates everything, compares it with the committed files and the backlog, and leaves the working tree unchanged.

The current contract has 1,325 operations: 1,079 have hooks across 20 domains and 246 are skipped. To get a missing hook, declare the type on the controller (`[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(...))]`), then run `api:export` and `api:generate`.

Sign-in and session restore call the existing auth endpoints directly and validate the replies with Zod, which keeps Redux out of the login bundle. Authenticated routes mount the RTK Query store; it is rebuilt when the signed-in user changes, so one account never receives another account's cached records. Requests carry the bearer token; a 401 renews the token once and repeats the request before the session is treated as expired. See `docs/session-and-access.md`.

## Use a domain in a module

1. Check `docs/api-untyped-operations.md`. If an operation the module needs is listed, its response type has to be declared on the backend before a strict hook exists; until then, define that one endpoint by hand in the module's `api/` file with a Zod-validated response. After a backend update, run `bun run api:export` and `bun run api:generate` and review the changed paths.
2. A new backend controller tag must be added to a domain in `scripts/api-domains.ts`. Add a new domain only when no existing one fits; keep a domain to what one area of the ERP loads together.
3. Put cache tags and invalidation in the module's handwritten `api/` file with `enhanceEndpoints`. Register module-owned tags through its `addTagTypes` option (as in configuration collections); use `base-api.ts` for tags shared across modules. Do not edit generated output or invalidate every ERP query after one mutation.
4. Import hooks only from that `api/` file, inside lazy module routes, so the shell and login path never load a domain's endpoints. Validate critical nullable transport fields before rendering or mutating.
5. Run `bun run check` and the web build.

The first identity slice is Roles. Its mutation headers identify `Access Management / Manage Roles` for audit, matching Oryx Next.

## Cache tags

A save must refresh what it changed, wherever it is shown, and nothing else. `bun run api:generate` tags every generated endpoint from its URL (`scripts/api-cache-tags.ts`), so no endpoint is ever left untagged and new backend operations are covered as soon as they are generated.

| Endpoint | Tags |
| --- | --- |
| Query without a path parameter (a list), e.g. `GET /warehouse/grns` | provides `warehouse/grn:LIST` and `warehouse:LIST` |
| Query with a path parameter (a record or something of it), e.g. `GET /procurement/shipment-document/{id}/material-distribution` | provides `procurement/shipment-document:{id}` |
| Mutation, e.g. `PUT /warehouse/grn/{id}` | invalidates `warehouse/grn:LIST`, `warehouse:LIST`, and `warehouse/grn:{id}` when the path names a record; nothing when the save failed |

A resource is the first two literal path segments, singular (`grns` and `grn` are one resource); its family is the first. The tag types are generated into `generated/cache-tag-types.ts`. Generation fails if an endpoint's URL cannot be read.

Two rules keep this precise:

- **Modules add tags; they never replace them.** In `enhanceEndpoints`, use the function form with `addTags` (`shared/api/add-tags.ts`): `name: (definition) => { definition.providesTags = addTags(definition.providesTags, [...]); }`. The object form `name: { providesTags: … }` would drop the generated tags, and a test (`tests/api-cache-tags.test.ts`) fails on it.
- **Effects a URL cannot show are declared once**, in `shared/api/cache-effects.ts`: deciding an approval refreshes the document decided (by model type and id), and assigning, sampling or starting a test refreshes its batch, its goods receipt note and the test-request lists. Add a row there when a save changes a record under another URL.

Changes made elsewhere (another user, another window, Oryx Next) cannot be seen by tags. A page reads its data again when it opens on data older than 30 seconds, when the window regains focus, and after a reconnect (`shared/api/base-api.ts`). Live updates of other people's changes are proposed in `docs/proposals/entity-changed-events.md`.

Purchase-unit additions are staged in the versioned contract from the companion
backend controller/DTO declarations; generated clients pass through the normal
generator. Re-export from the upgraded backend during release verification. See
[supplier purchase units](supplier-purchase-units.md).

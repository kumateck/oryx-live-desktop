# Customer backend contract review — 2026-10-27

**Decision: compatible OpenAPI contract; approve the exact raw customer fingerprint alongside the existing typed-contract fingerprint. No frontend compatibility changes are required.**

| Evidence | Canonical SHA-256 |
| --- | --- |
| Pinned `contracts/openapi/backend.v1.json` | `4727f9d426d4fa53cdf6ee93f2b5df1edb959d6fa83d705ebdfc7fb2ca9648ae` |
| Raw Swagger matching the reported customer backend | `c89615ea1e0050bbb0ed5f61f9308ee87e5398e79b3972b00e4dee33587abdc1` |

The review used the cached metadata-only companion-backend export from the earlier quality-workflow work. Its canonical digest **exactly matches** the customer's reported digest, identifying the same JSON content under the deployment verifier's canonical hashing rules. No customer server access was needed. The unmodified raw export is preserved, gzip-compressed, in [reviewed evidence](../contracts/openapi/reviewed/customer-c89615ea.swagger.json.gz); its decompressed document is verified by regression tests. Whitespace and object-key order do not affect the canonical digest.

## Exact difference

Both documents contain **1,056 paths, 1,358 operations and 1,531 component schemas**. The only differences are **2,716 absent `schema: { "type": "string" }` declarations** on the `Module` and `SubModule` audit-header parameters: two headers on each operation. Parameter names, locations, required flags and all other metadata are unchanged.

This is the existing, documented adjustment in [scripts/export-openapi.ts](../scripts/export-openapi.ts): the backend's raw document leaves those two header types unspecified, and the frontend import supplies string schemas so generated hooks remain strictly typed. Reproducing **only** that adjustment on the preserved raw document gives the pinned digest `4727…48ae`; the resulting **entire document is deeply equal** to the pinned contract. The deployment verifier intentionally hashes the raw response, so it previously rejected this already-understood export distinction.

| Reviewed area | Result |
| --- | --- |
| Removed/added/changed endpoints and HTTP methods | None. All 1,358 operations retained. |
| Request bodies, media types and required/optional input fields | Identical. |
| Response status definitions, media types, DTOs, enums, nullability and references | Identical. |
| Query/path/header parameters other than the two missing audit-header types | Identical. |
| Authentication metadata | Identical global `Bearer` requirement and `Authorization` header security scheme; operation-level metadata also matches. |
| Permission endpoints and schemas | Identical, including `/permission/user/{userId}`, role permissions and all permission DTOs. |
| Operation IDs, tags, descriptions, constraints and all remaining document metadata | Identical. |

## Live operations reviewed

Frontend source baseline: `3009ef919fad449009a6b6d52d6bd6789a4817de` on `entrance-server`; this approval changes no application source.

The equality check covers **every published operation**, including operations handled through handwritten adapters when their generated fallback is intentionally skipped. An AST identifier scan of the current 2,129 non-test web source files outside the generated API area found references to **677 of 1,114 generated endpoint definitions**, counting exported query/mutation hooks, lazy hooks and direct endpoint identifiers. This is a conservative source-reference inventory, not a count of network calls or proof every export is executed.

| Generated API domain | Definitions referenced by non-test web code |
| --- | ---: |
| Analytical | 71 |
| Approvals | 14 |
| Auth | 2 |
| Forms | 31 |
| HR | 58 |
| Identity | 21 |
| Inventory | 45 |
| Materials | 29 |
| Procurement | 55 |
| Production | 59 |
| Products | 19 |
| QA | 0 |
| QC | 43 |
| Reports | 65 |
| R&D | 6 |
| Sales | 15 |
| Services | 50 |
| Settings | 34 |
| Templates | 0 |
| Warehouse | 60 |

Zero references to a particular generated domain does not imply the business module is absent: handwritten adapters and other domains may own its transport. Those routes remain covered by whole-document equality.

Direct session transport was also inspected: login, refresh-token renewal, authenticated user and user permission reads retain their contracts. [base-api.ts](../apps/web/src/shared/api/base-api.ts) still sends the bearer access token, renews on 401 and refreshes access without retrying a forbidden mutation on 403. The generated client still sends `Module` and `SubModule` as strings. Production activity, QA/rework/retesting/OOS, generic approvals, stock and shipment discrepancy contracts have no schema/operation changes. No generated API file, request mapping, permission check or UI workflow needs modification for this fingerprint difference.

Swagger does not fully express controller middleware, permission enforcement or the customer's actual role grants. This approval records **contract equivalence**, not a new runtime authorization audit. Customer permissions remain backend-authoritative; existing authentication, guards, approval gates and rollout acceptance still apply. The separate localhost-only Swagger access behavior is handled by the existing local host-network probe; no Host header spoofing or backend change is introduced here.

## Approval and regression protection

[release.json](../deploy/customer-server/release.json) preserves the prior fingerprint and adds **only** the exact reviewed raw fingerprint. Runtime hashing is unchanged. It does not normalize arbitrary documents, ignore fields, fetch a different contract, learn digests automatically or skip verification.

[Regression tests](../tests/customer-backend-contract-review.test.ts) verify the preserved raw fingerprint, exact audit-only normalization, whole-document/schema/security equality, acceptance of both explicitly reviewed documents, and rejection of unreviewed endpoint, request-body, response, authentication/security-scheme and permission-DTO changes. Future changes require another review; this is not approval for all backend versions.

Run `bun run check` and `bun run build:web`. Customer Docker validation also builds the existing `web` image and runs the isolated Nginx/proxy smoke suite. No customer backend is modified, no deployment is performed, and this review does not push or merge code.

## Local CI verification

The reused customer Docker build completed with the frozen Bun 1.4.4 install, `bun run check`, `bun run build:web` and release-policy validation. The checks passed **99 Linux root/deployment tests, 1,576 web tests, 12 gateway tests and 8 desktop tests**, plus workspace TypeScript, route generation and strict API-generation checks. The isolated customer Docker smoke suite also passed Nginx syntax, health/version, SPA routes, API/auth forwarding, optional gateway/WebSocket, retained assets and runtime-content checks. The four review tests use the preserved export and do not call the customer's backend. Native customer acceptance and actual role grants remain outside this contract comparison.

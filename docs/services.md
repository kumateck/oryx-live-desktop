# Desktop service integrations

## Quarantine GRNs and distribution (2026-10-20)

`modules/quarantine-area/api/quarantine-api.ts` (reads) and the lazily loaded `api/distribution-api.ts` (writes) compose the existing generated warehouse and procurement endpoints. No generated code or server endpoint was changed.

| Endpoint | Responsibility |
| --- | --- |
| `GET /api/v1/warehouse/grns` | List notes for the allowed material kind. |
| `GET /api/v1/warehouse/grn/{id}` | Read batches and `checkLists[].distributedRequisitionMaterial.distributedRequisitionItems`; also used with a forced network read before distribution. |
| `POST /api/v1/procurement/distribute-material` | Write one reviewed warehouse allocation as an array of `{ warehouseId, materialBatchId, uoMId, distributedRequisitionItemId, quantity }`; success is 204. |

Read audit headers: `Module: Warehouse`, `SubModule: Quarantine Area`. Distribution uses Oryx Next's headers: `Module: Warehouse`, `SubModule: Quality Assurance Goods Receipt Note`. The normal authenticated transport supplies the user token. No separate quality-status update is issued.

Successful distribution invalidates shared `Grns` and `DistributedStock` tags, alongside the generated endpoint tags. Rejected mutations do not invalidate unrelated modules or retry automatically. See [workflows.md](workflows.md) for eligibility, validation, failure handling, and the existing backend enforcement limitation.

The shared `shared/material-batches/received-batch.ts` schema retains material id/kind, unit id, assigned quantity and distributed quantity for receiving and quarantine. Missing assigned/distributed values remain null; the app does not turn missing distribution evidence into zero.

QC GRNs and warehouse GRNs now share `shared/material-batches/batch-status.ts`, preventing their status definitions from drifting.

## Attachment preview (2026-10-20)

PDF, DOCX and XLSX render inside Oryx from pinned local WASM assets. No new backend or document-service endpoint was added. Existing `GET /api/v1/file/{modelType}/{modelId}/{reference}` and `GET /api/v1/file/{modelType}/{reference}` stream MinIO files; signed direct links also work when their storage origin allows browser CORS. No attachment upload or mutation is issued by the viewer. See [attachment-viewers.md](attachment-viewers.md) for build assets, bounds, isolation, current anonymous-file transport assumptions and release checks.

Controlled STP version previews reuse `GET /api/v1/stp-documents/documents/{documentId}/versions/{versionId}/file`, through the existing authenticated RTK Query adapter with `Module: Quality Assurance` and `SubModule: Standard Test Procedure`. The adapter returns an owned local object URL; the caller reads its bytes and revokes it, then the document renderer consumes those bytes directly. Image previews own a separate temporary object URL until close. Tokens, endpoints and cookies are not sent to the sandbox. A refused read never opens the viewer or falls back to an unauthenticated request. No server contract or permission/approval rule changed.

New form selections enter the same viewer directly as local Blob sources. Rich-text file links and filename buttons use the central opener, while ordinary web links and explicit download/export actions retain their purpose. No backend upload, conversion or document-service connection is required for preview.

Shipment attachment follow-up: the existing file endpoint successfully returns the reported PDF with `Content-Disposition: attachment`. The viewer consumes its bytes rather than navigating an iframe to that response. `/viewers/` is a static web-asset namespace (not a new document API), retained alongside versioned SPA chunks. Missing engine URLs return 404 and incomplete engine releases fail startup. See [attachment-audit.md](attachment-audit.md) and [deployment.md](deployment.md).

The shared viewer no longer exposes a separate **Open original** action: it displays the attachment returned by the existing file transport. Only image previews need a viewer-owned object URL; document bytes go straight to validation and the isolated engine. No backend endpoint, permission, audit header or persistence behavior changed.

Read-only viewer builds expose only an assigned-file read and render-error callback from Rust; they do not register save/checkpoint handlers. The parent save guard remains defensive and reports a viewer error on any mutation notification. No service endpoint or permission contract changed. Engine assets are addressed by both source revision and archive hash.

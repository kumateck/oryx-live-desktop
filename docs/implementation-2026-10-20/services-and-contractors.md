# Services and contractors — 2026-10-21

## Implemented in Live

Four reference routes: `/extrals/services`, `/extrals/services/:id`, `/extrals/services-providers` and `/extrals/services-providers/:id`. Their module manifests require the actual CanViewServices/CanViewContractors keys before data hooks mount. Create/edit/delete use CanCreateService/CanEditService/CanDeleteService and CanCreateContractors/CanEditContractors/CanDeleteContractors. No invented permission or administrator bypass is added.

Service register/detail retains name, code, description, dates, active state, creation date and all attachments. Lists preserve paging/search and explicitly request active or inactive status because omission defaults to active-only on the server. Service code suggestion uses the shared code configuration/count logic and remains manually editable. Forms enforce end >= start and preserve original timestamps for unchanged dates. Complete bounded active and inactive register reads prevent duplicate names/codes in the client; the backend still needs authoritative uniqueness/concurrency enforcement.

Creation/edit checks current permissions, session identity and frozen current-record evidence. Files upload only after the service's saved UUID is confirmed. The saved identity remains visible if attachment upload fails; no primary save or uncertain file upload is replayed. Inspecting the saved service is linked from the dialog. An unconfirmed upload may have partially reached MinIO, so it must be inspected before selecting files again.

All service attachments use the central in-app read-only viewer. Attachment removal is separately confirmed, rereads the service/file identity and submits the actual stored `reference`. The reference UI incorrectly passes the unrelated attachment record ID; Live's interaction test verifies different IDs use the correct stored reference. Deletion retains the backend soft-deletion audit behavior. Service deletion itself has no backend linked-record guard; this is an explicit remaining backend limitation, not a claim of comprehensive integrity enforcement.

Contractors retain international contacts, address, country/currency and every service association. Read-only details include the full linked service table and permission-controlled service links. Editing loads the complete detail DTO and freezes its initial evidence instead of relying on the reduced register row. Inactive existing associations may be retained; new ones must identify an active service and require current service-read access. Country/currency are revalidated. After save, Live rereads and verifies all persisted contact/reference fields and the exact service ID set; it detects an old server accepting an association edit without saving it. Sent changes cannot be replayed from the same dialog after refusal or uncertain reconciliation.

## Matching backend repair

`oryx-backend/APP/Repository/ServiceProviderRepository.cs` now loads and replaces Services with the verified requested association set. It also corrects the inverted contractor deletion null check, returns missing records as NotFound and protects current/historical job-provider, execution, quotation, proforma invoice and memo references before audited soft deletion. The endpoints/DTOs are unchanged. Nine isolated backend tests pass, including fresh-context association persistence and each historical-link guard.

This source repair is part of the requested stores/services work and is **not deployed**. The running server must include it before association changes and eligible contractor deletion work correctly. Existing granular authorization gaps in the service/provider/file controllers remain; Live's exact permission gates do not replace backend authorization.

## Verification

Service/contractor/vendor and route suites: 323 passing checks across nine files, plus one focused attachment-reference interaction test. Backend contractor maintenance: nine passing tests. Web TypeScript and the production build pass. The latest complete web suite passes all 1,280 tests across 244 files without unhandled errors. No real service, file, contractor or workflow record was changed in verification. Visual and deployed-server acceptance remain pending.

The remaining general inventory, receiving/stock, purchase/quotation/memo and job execution workflows are unfinished. Personal performance ownership and public onboarding also remain incomplete. Full five-domain parity is not claimed.

Documentation updated: this file, implementation README/scope.csv, store-vendors.md, performance.md, services.md and workflows.md; backend docs/service-provider-maintenance.md, services.md and workflows.md.

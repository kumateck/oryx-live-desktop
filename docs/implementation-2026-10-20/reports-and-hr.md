# Reports and employee migration — 2026-10-21

## Report contracts and output

`modules/reports` owns the catalog, filters, loaders and domain adapters. Generated API code is unchanged. Report reads send `Module: Reports`, `SubModule: Report generation`. Each report group uses its existing permission key. HR attendance aliases restrict the catalog to attendance reports and use `CanViewAttendanceReportUpload`.

Four published response annotations do not match repository results. Handwritten validated adapters normalize supplier mappings (actual list), employee movements (actual object), approved department materials (complete list), and vendor summary (actual vendor count DTO). A multi-page envelope from the department material endpoint is rejected because that endpoint offers no page arguments.

Paginated catalogs/schedules must return every page. Missing/repeated IDs, moving page/count metadata, incomplete reads and cancellation prevent a partial export. Optional numeric values remain absent; actual zero values are retained. Material kind/division/store zero and supplier/date filters are not dropped through truthiness. Product categories are sent by name, as the repository expects. Store stock filters are joined through unique item code/store identities because the summary endpoint has no filtering contract; ambiguous matches fail explicitly.

Reports retain their applied filters, generation time and warnings. Shared client-paged tables show a compact set of columns with full-row details. Print groups wide columns into readable sections, retaining row references. Excel exports every row/field with provenance. CSV bundles include each sheet and report metadata; formula-like text is escaped. Export does not refetch a different dataset.

Monthly/daily production plans filter actual overlapping schedules, cancelled batches and department identity, count half batches as 0.5, group by market/product/packing and calculate expected output/shippers/loose packs. Missing output definitions are unrecorded, not zero. Readiness bounds requests and distinguishes 404/missing from unavailable checks; failures cannot mark a product ready.

The Next departmental attendance sample data is not migrated. The existing general-summary endpoint provides current counts only, so the UI states that historical totals are unsupported and offers no misleading date filter. Department filtering suppresses organisation-wide totals. Daily attendance uses the real date/department-name endpoint.

## Employee workflows

The employee register has permission-specific active/inactive/new tabs, server paging/search/sorting and department filters. Profile/details access uses the dedicated existing keys rather than assuming active-list access permits every record. All row actions declare their permissions and repeat current checks at the mutation boundary.

The profile editor includes personal/employment/payroll identifiers, parents/spouse, emergency contact/next of kin, children, siblings, education, employment history and a photograph. Forms use RHF, Zod and the shared FormWizard. Enum zero is retained. The editor freezes original evidence, rereads before update, rejects concurrent changes and explicitly preserves status, disciplinary/exit state, grade and suspension dates. A profile edit does not activate an inactive employee. Successful profile creation/update and photograph upload are separate confirmed stages; a failed photograph retries only the attachment, with the saved identity retained.

Assignment validates the current department, designation membership and complete intended production warehouse assignment. Permanent staff require a grade. The dialog explains the backend side effects: activation, designation leave entitlement, linked-user update and acceptance email. The current employee read DTO omits assigned warehouses, so the UI requires explicit selection rather than inventing existing assignments. The backend does not reliably clear warehouse associations through an empty list; clearing remains a server-contract limitation.

Status, type and email dialogs capture evidence, reread and check permission before writing. Suspensions require ordered dates. New employees activate through designation assignment. Invitations validate unique addresses/types, send only on explicit submission and do not automatically repeat a failed batch; a failed response warns that some recipients may already have been sent mail.

## Attendance import

The upload uses a bounded, validated XLSX preview with at most 10,000 rows. It verifies required column positions, literal staff/timestamp/state values and the selected calendar date. Legacy XLS is explicitly unsupported by the preview rather than silently uploaded unread. The user reviews the full paginated preview and confirms before multipart submission. The server still validates employee identities and applies its transaction/deduplication behavior. No payroll action is issued. Failures remain visible and are not automatically replayed.

## Existing server limitations

- Production transfer approve/reject currently lack authoritative action/department/state/concurrency enforcement. Frontend preflight cannot close the race with another client.
- Several employee endpoints, including creation/invitations, are anonymous in the backend; other profile/status operations use authentication without fine-grained policy checks. Live uses explicit UI/action permissions, but this is not server enforcement.
- The employee update DTO inherits non-nullable date/enum fields while publishing them as optional. Existing incomplete records require careful server validation; the client never invents missing employment status.
- Assignment activates employees and sends acceptance mail. It does not return full warehouse assignment state.
- Attendance general summary is current-only. Shift import can skip rows while its controller returns an empty 204; a future desktop import must verify or clearly report this, not claim every row imported.
- Payment workflows with no configured stages autoapprove on the existing server and log the reason; the UI states this behavior. Financial state remains server-authoritative.

## Verification and remaining work

Automated suites verify complete snapshots, legal unique worksheet names, literal/formula-like export text, date/enum handling, half batches, profile status preservation, stale-record refusal, photo-only retry and refused Finance decisions. A signed-in local desktop generated the 991-row stock summary. All mutation tests were mocked.

Visual checks on every report, Windows scaling, integrated inventory/Finance acceptance and the remaining HR/general-stores workflows are outstanding. This document does not mark the five-domain request complete.

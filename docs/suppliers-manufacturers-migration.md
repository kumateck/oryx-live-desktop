# Supplier and manufacturer desktop migration

The desktop groups Suppliers, Manufacturers, and Supplier compliance under Procurement in the sidebar. Supplier and manufacturer record addresses remain under `/settings`. Oryx Next and the backend were used to inventory business rules; the desktop presentation is designed for narrower screens and faster first load. No backend code was changed.

## Workflow coverage

| Oryx Next workflow | Desktop route or section | Behavior |
| --- | --- | --- |
| Supplier list, create, detail, edit | `/settings/suppliers`, `/create`, `/:id`, `/:id/edit` | Server-paged datatable; supplier company, country, currency, contact, material/purchase-unit/default/alternate manufacturer associations; status change and delete |
| Manufacturer list, create, detail, edit | `/settings/manufacturers`, `/create`, `/:id`, `/:id/edit` | Server-paged datatable; company and validity; manufactured materials and single/range/list quantities per pack; delete |
| Supplier relationship workspace | `/settings/suppliers/:id/relationship` | Certifications, contacts, banking, pricing approvals, performance scorecards, approved-payment spend |
| Supplier compliance | `/procurement/supplier-compliance` | Expiring certificates and requalification due, with an as-of date and window |

The sidebar inventory from Oryx Next omitted the supplier entry and placed Manufacturers under System Settings. `scripts/import-navigation.ts` adds Suppliers and moves Manufacturers to Procurement during reproducible navigation import, preserving each entry's permissions. Supplier compliance is in the same group. Direct detail and relationship routes stay out of the sidebar.

## Better desktop interaction

- Lists reuse the existing server datatable, with search and pagination. Opening a row loads that record only.
- The detail pages use compact, wrapping information grids and searchable supplier associations. The app shell owns vertical scrolling; no detail section requires a wide table.
- Create and edit forms use FormWizard, React Hook Form, and Zod. Material options load by search and page. The supplier form requests country, currency, and unit options together; the manufacturer form requests country and currency; banking and pricing request currency only.
- A supplier material link now records its purchase unit. Oryx Next omitted the available `uoMId` field, leaving pricing agreements with no material/unit choice. Editing reads the dedicated association endpoint so existing unit IDs are preserved; legacy links without a unit must be completed before saving.
- The material-specific UoM endpoint currently declares a list in OpenAPI but returns one department UoM from the repository. The supplier form uses the typed `UnitOfMeasure` collection instead of trusting that mismatched contract.
- The relationship workspace loads only the active section's code and data. It uses shadcn Tabs, Dialog, Badge, Input, Button, and a small skeleton while the section chunk loads.
- Contacts and banking have separate sections, so permissioned banking details are not mixed into a long contact page. Pricing agreements use wrapping records instead of Oryx Next's fixed-width table and horizontal scrollbar.
- Bank account numbers start masked and can be revealed deliberately. Pricing cards show approval status and distinguish new, replacement, and archive proposals.
- Failure states show the server message with Retry. Mutations report errors in place and only show a success toast when the API succeeds.
- Forms guard unsaved work. Dialog bodies scroll within a fixed header/footer. Route files stay below 200 lines.

## Permissions and backend effects

| Action | Permission |
| --- | --- |
| View/create/edit/delete supplier | `CanViewVendors` / `CanCreateVendor` / `CanUpdateVendorDetails` / `CanDeleteVendor` |
| View/create/edit/delete manufacturer | `CanViewManufacturers` / `CanCreateManufacturer` / `CanUpdateManufacturerDetails` / `CanDeleteManufacturer` |
| View/manage certifications | `CanViewSupplierCertifications` / `CanManageSupplierCertifications` |
| Manage contacts, banking, pricing | `CanManageSupplierContracts` |
| View performance and compute/preserve scorecards | `CanViewSupplierPerformance` |
| View spend | `CanViewSupplierSpend` |

The SRM endpoints enforce their listed permissions on the server. **The core Supplier and Manufacturer CRUD/status endpoints currently use `[Authorize]` without an action-specific permission key.** The desktop hides those actions according to Oryx's existing permission model, but a caller could invoke the authenticated core API directly. Closing that authorization gap requires a separate backend change and is outside this integration-only task.

Approving a supplier also approves its associated manufacturers; the status dialog warns before sending the change. A pricing create, replacement, or archive is an approval proposal. The UI never claims that a proposed price is effective. Supplier and manufacturer requests retain the backend's `Module` and `SubModule` audit headers.

## API contract and release boundary

Core CRUD comes from the versioned OpenAPI procurement domain and its generated RTK Query hooks. The SupplierController relationship operations appear in `docs/api-untyped-operations.md`: their current OpenAPI responses have no schema, so the strict generator skips them. Until the server publishes typed responses, `modules/suppliers/relationship/relationship-api.ts` is the narrow typed bridge. Each response is parsed by Zod at the HTTP boundary; request DTOs follow the inspected backend classes. Remove this bridge in favor of generated hooks only after the published contract includes response schemas and parity tests pass.

The desktop reads the customer's server through the configured same-origin API proxy. The supplied development backend is `http://164.90.142.68:8086` in `apps/web/.env.example`; production transport and credentials follow the existing deployment policy.

## Related routes left with their owning modules

Supplier/manufacturer references also appear in Oryx Next procurement reports, pricing-approval details, purchase/material choices, sales quotations, and logistics documents. Those screens are not duplicated here; each belongs to its future report, approval, sales, or logistics migration. This module supplies the core records and SRM workspace they rely on.

## Verification

Run `bun run routes:check`, `bun run api:check`, `bun run --filter @oryx/web test`, `bun run typecheck`, and `bun run build:web`. Focused tests cover association and quantity validation, DTO mapping, pricing material choices, date boundaries, and SRM response validation. An authenticated manual pass against a customer server is still required for create/edit/status, pricing approval, and permission variants; no credentials are stored in the repository.

## Supplier page

`/settings/suppliers/:id` is the one page for a supplier. The separate "relationship workspace" page is gone; its sections are tabs here, and `/settings/suppliers/:id/relationship` redirects to the Certifications tab.

From top to bottom:

1. **Header**: name, status, type, country, trading currency, and the actions the user holds (Edit, Change status, Delete).
2. **Needs attention**: rejected or not yet approved, requalification overdue or due within 60 days, expired or expiring certificates, an approved supplier with no materials. Problems come before warnings; an item about records in a tab has a Review link to it. Nothing is shown when all is in order.
3. **Key facts**: qualification, requalification due date with the days left or overdue, materials supplied and from how many manufacturers, certificates (valid, expiring, expired), and the latest saved score.
4. **Tabs**, kept in the address as `?tab=`: Overview, Materials, Certifications, Contacts, Banking, Pricing, Performance and spend.

Access: Overview and Materials are open to anyone who can view suppliers. The other tabs, and the certificate and score figures above them, appear only with their permission (`CanViewSupplierCertifications`, `CanManageSupplierContracts`, `CanViewSupplierPerformance`, `CanViewSupplierSpend`), and their records are not requested without it.

Materials are a sortable, paged table (material and code, manufacturer linked to its page, purchase unit, preferred or alternative source) with a search box. Email and phone on the Overview are links.

The rules for "due soon", certificate counts, alerts, and tabs are in `modules/suppliers/detail/supplier-overview.ts`.

### Supplier tabs

Certifications, Contacts, Bank accounts, Pricing agreements, and Scorecards are tables, each with an "add" button and a row menu (`TableMenu`). Removing a record, and requesting a pricing archive, ask first and show the server's reason if refused.

- Certifications: expired first, then soonest to expire; each shows Valid, Expires in N days, or Expired. Actions need `CanManageSupplierCertifications`.
- Contacts: the primary contact first; email and phone are links.
- Bank accounts: the account number is masked to its last four characters until "Show account number" is chosen, one account at a time.
- Pricing: the agreed price beside the one it replaces, the effective period, and the approval state. A change or archive can be proposed only for an approved agreement; otherwise the menu says why not.
- Scorecards: newest first, with the counts behind each rate.

## Manufacturer page

`/settings/manufacturers/:id` follows the supplier page: header, "Needs attention", key facts, then tabs (Overview, Materials) kept in the address as `?tab=`.

- **Approval** is worked out from the record: approved from its approval date until its validity date passes, then "Approval lapsed". The old page showed "Approved" beside an expired date.
- **Needs attention**: approval lapsed, approval running out within 60 days, approved with no validity date, not yet approved, no materials recorded.
- **Key facts**: approval, valid until with days left, materials made split into raw and packaging.
- **Materials** are a sortable, paged, searchable table with the kind and the quantity per pack (pack sizes or a range).

The backend has no request for "which suppliers offer this manufacturer's materials", so the page does not list them; a supplier's own page lists its manufacturers.

Shared by both pages: `shared/detail/record-alerts.tsx`, `shared/detail/key-facts.tsx`, and `shared/format/due-dates.ts` (60 days counts as "due soon").

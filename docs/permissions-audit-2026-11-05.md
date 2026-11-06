# Permissions and authorization audit (5 November 2026)

**Status (5 November 2026): approved; the recommended answer to each decision in [section 12](#12-decisions-needed) was taken.**

| Phase | State |
| --- | --- |
| 0 | Done. Critical findings C1–C10 fixed, except anonymous file *reads*: the desktop shows signatures and attachments as plain images, so reads need signed links first (phase 3). The 11 undefined desktop keys are fixed. The rules for future work are in `AGENTS.md` here and `docs/agent-guide.md` in the backend. |
| 1 | Done. One generated permission catalog (`docs/permission-catalog.json` in the backend), and build tests that fail on duplicate or unregistered keys, unknown keys on endpoints, unreviewed anonymous endpoints, and any new endpoint without a named permission. |
| 2 (products) | Done for product writes and every product page, tab and action, in Production, QA and FG. Each page, tab and action has its own key, `products/lib/product-keys.ts` (desktop) and `ProductPermissions` (backend) define them, and the server checks bulk section saves row by row. The role-grant migration keeps every role's current access. Product *reads* stay signed-in only until lookup keys (decision D3), because eight other modules read products as lookups. Materials: the master and department-link writes check the raw or packaging key against the stored material, and the desktop already used one key per kind. Requisitions: Production's list has its own keys (`CanViewProductionRawMaterialRequisitions`, `CanViewProductionPackagingMaterialRequisitions`), no longer aliases of Warehouse's. Left for phase 3: material reads and batch, warehouse and requisition endpoints; the Extra Packaging Requisitions key; White Placebo, which is not in the repositories yet. |
| 3 (in progress) | QC documents: every STP, specification and ARD write checks its key, by the material's stored kind for material documents. Warehouse: location, rack and shelf writes, and checklist and GRN creation by material kind; warehouse create/edit/delete have new keys, granted to nobody. Procurement: every purchase-order write uses the foreign or local key of the order's supplier; cancel and delete have their own keys (cancel granted to the roles that could revise). Manufacturers, suppliers, billing, shipments, waybills, invoices, discrepancies and distribution writes check their keys. Left: stores, approvals per document type, purchase-order invoices, swap and arrival endpoints. |
| 4–5 | Planned below. The findings tables describe the state before phase 0. |

Phase 0 changes:

- **Access check:** server policies read current grants on every request, through the same rules as the service checks. Disabled accounts and deleted roles grant nothing, and the 12-hour cache is gone.
- **Accounts:** self sign-up is refused, and user creation needs `CanCreateUser`.
- **Roles:**
  - changing a role needs `CanAssignUserRole` (new; granted to roles that hold `CanEditUser`);
  - role permission edits need `CanUpdateExistingPermission`, and role creation needs `CanCreateRole`;
  - nobody changes their own role or account, or grants a permission they do not hold, and only catalog keys can be stored.
- **User management:**
  - user edit needs `CanEditUser`, and user delete needs `CanDeleteUser` (new; granted to nobody). Delete now removes the named user; it used to remove the caller;
  - block and unblock need `CanBlockUser` / `CanUnblockUser` by direction.
- **Signatures and avatars:** own only; a signature also needs `CanCreateSignatureSettings`.
- **Files and stock:** file uploads and the department stock list need sign-in.
- **Quality gates:**
  - batch approval needs `CanApproveMaterialBatch` (new; granted to nobody);
  - ATR retest request and completion need `CanRequestRetestProductTest` / `CanCompleteRetestProductTest` (new);
  - approval workflow create and delete need `CanCreateNewApproval` / `CanDeleteApprovals`, and rights transfer needs `CanTransferApprovalRights`;
  - QA/QC verification needs the specific verify key for that kind of document.
- **Permission reads:** reading a role's permissions needs `CanViewPermissions`, and so does reading another user's.

Scope: `oryx-backend` (all 152 controller files, 1,402 actions, the permission registry and both enforcement paths) and `oryx-live-desktop` (152 module manifests, 392 route/query rules, every permission-key literal, every mutation call site).

Generated appendices (one row per item, regenerate with the audit scripts in [section 13](#13-method-and-limits)):

| Appendix | What it lists |
| --- | --- |
| [Endpoint matrix](permissions-audit/endpoint-matrix.md) | Every backend action grouped by module › submodule: route, task, current server check, desktop call sites, desktop keys, proposed key |
| [Key catalog](permissions-audit/key-catalog.md) | Every key in Manage Permissions order: desktop usage, endpoints that enforce it, flags (unregistered, shared, alias, unused) |
| [Desktop access rules](permissions-audit/frontend-rules.md) | Every manifest root/route/query rule with findings (OR rules, multi-key rules, undefined keys) |
| [Controller summary](permissions-audit/controller-summary.md) | Per controller: how many actions are checked and how, and how many writes are unprotected |
| [Unchecked desktop writes](permissions-audit/unchecked-writes.md) | Desktop files that call a mutation without an execution-time permission check |

---

## 1. Summary

| Measure | Count |
| --- | ---: |
| Backend permission keys defined | 862 (722 `PermissionKeys`, 71 `FullProcedurePermissionKeys`, 69 `QcWorksheetPermissionKeys`) |
| Keys defined but never registered (cannot be granted) | 2 |
| Keys registered under more than one submodule (one tick box, several screens) | 17 |
| Constants that alias another key (two names, one permission) | 2 |
| Keys not following the `Can…` naming (description text is garbled) | 7 |
| Keys used by the desktop that the backend does not define (always deny) | 11 |
| Backend actions | 1,402 |
| — checked by a permission policy attribute | 449 |
| — checked in controller/service code | 42 |
| — checked only for historical (`asOfDate`) reads | 1 |
| — **sign-in only, no permission check** | **895 (64%)** |
| — **anonymous** | **15** |
| **Unprotected writes** (POST/PUT/PATCH/DELETE needing only sign-in or nothing) | **429** |
| Desktop rules using any-of (`some`) across several keys | 133 |
| Desktop rules needing several keys at once | 26 |
| Desktop files calling mutations with no execution-time check | 57 (after excluding read-only POST lookups) |
| Backend keys never referenced by the desktop | 241 |

The structural picture:

1. **The server does not enforce most permissions.** Two thirds of endpoints, including product, BOM, material, warehouse, procurement, production-schedule and report endpoints, check only that the caller is signed in. The desktop hides buttons, but any signed-in user can call these endpoints directly.
2. **Access management itself is unprotected** (section 2). Any signed-in user can rewrite any role's permissions or assign themselves roles, and an anonymous caller can create a signed-in account. With 1 and 2 together, every permission in the system can be obtained without authorization.
3. **Many keys cover several tasks, and many tasks borrow another task's key.** Products are the clearest case: one key (`CanEditProductionPlan`) controls all nine product edit sections, and products have no QA-specific keys at all.
4. **The desktop substitutes OR-rules for specific keys** on 133 rules, some sensible (a page shell whose every tab is separately checked) and many not (a page opened by any of several unrelated action keys).

## 2. Critical security findings (fix first)

These are independent of the redesign and are exploitable today by anyone who can reach the API port. I recommend a small hotfix PR for these before the redesign ([decision D1](#12-decisions-needed)).

| # | Finding | Evidence | Impact | Proposed fix |
| --- | --- | --- | --- | --- |
| C1 | **Anonymous sign-up creates a `super` account and returns a token** | `POST /api/v1/user/sign-up` is `[AllowAnonymous]` ([UserController.cs:28](../../oryx-backend/API/Controllers/UserController.cs#L28)); `CreateNewUser` adds the new user to role `super` and calls `AuthenticateNewUser` ([UserRepository.cs:63-89](../../oryx-backend/APP/Repository/UserRepository.cs#L63)) | Anyone on the network gets a signed-in account, in `super` if that role exists in the database | Remove the endpoint, or require `CanCreateUser` and never assign a role implicitly |
| C2 | **Anonymous user creation** | `POST /api/v1/user` is `[AllowAnonymous]` ([UserController.cs:19](../../oryx-backend/API/Controllers/UserController.cs#L19)) | Anyone can create an account with a password they choose, then sign in | Require `CanCreateUser` (existing key, IT Support › Manage User Directory) |
| C3 | **Any signed-in user can rewrite any role's permissions** | `PUT /api/v1/permission/role/{roleId}` has only `[Authorize]` ([PermissionController.cs:73](../../oryx-backend/API/Controllers/PermissionController.cs#L73)); `UpdateRolePermissions` does no permission check and accepts keys not in the catalog ([PermissionRepository.cs:210](../../oryx-backend/APP/Repository/PermissionRepository.cs#L210)) | Full privilege escalation in one request | Require `CanUpdateExistingPermission` (existing); validate keys against `GeneratePermissions()`; refuse changes to a role the actor holds unless they hold the key being granted; one transaction (today two `SaveChanges` leave a role with no permissions if the second fails) |
| C4 | **Any signed-in user can assign roles to any user, including themselves** | `PUT /api/v1/user/role/{id}`: the permission attribute is commented out ([UserController.cs:113](../../oryx-backend/API/Controllers/UserController.cs#L113)) | Full privilege escalation | Require `CanAssignUserRole` (new) |
| C5 | Role create, user edit, user delete and **account disable/enable** need only sign-in | `POST /role` ([RoleController.cs:53](../../oryx-backend/API/Controllers/RoleController.cs#L53), attribute commented out), `PUT /user/{id}`, `DELETE /user/{id}` (attribute commented out), `PUT /user/toggle-disable/{id}` | Account takeover; any user can disable every administrator | `CanCreateRole`, `CanEditUser`, `CanDeleteUser` (new), `CanBlockUser`/`CanUnblockUser` (existing; the toggle becomes two endpoints or checks the key for the direction) |
| C6 | **Anonymous upload of any user's signature and avatar** | `POST /api/v1/user/signature/{id?}` and `avatar/{id?}` are anonymous ([UserController.cs:150-170](../../oryx-backend/API/Controllers/UserController.cs#L150)) | A forged e-signature on any user is a GxP data-integrity failure (21 CFR Part 11 / EU Annex 11) | Own signature: signed-in user, own id only. Another user's: `CanEditUserSignature` (new) |
| C7 | Anonymous file upload/read on any record | `FileController` upload and image reads are anonymous ([FileController.cs:25-150](../../oryx-backend/API/Controllers/FileController.cs#L25)); deletes are sign-in only | Tampering with attachments of controlled records; data disclosure | Authorize by the owning record's key (attachments inherit the parent record's View/Edit key) |
| C8 | Anonymous stock disclosure | `GET /api/v1/material/batches/departments` is anonymous ([MaterialController.cs:1172](../../oryx-backend/API/Controllers/MaterialController.cs#L1172)) | Stock data readable without sign-in | Require the warehouse stock view key for the material kind |
| C9 | **Quality gates need only sign-in** | `POST /verification` (QA verifies products, specifications, ARDs), `PUT /material/batch/{id}/approve`, `POST /material/batch/{id}/complete-retest`, `POST/DELETE /approval`, `POST /approval/delegate`, `POST /approval/transfer-rights`, ATR assign/reassign/complete-retest, job-execution verify/approve, stock issue against requisitions; 135 sensitive writes in all (approve, verify, reject, issue, complete, delete, role, user, password) (see the endpoint matrix, "unprotected write") | Any signed-in user can release material, verify product documents, or move approval rights | Enforce the existing specific key on each (for example `CanVerifyProduct`, `CanTransferApprovalRights`) in phase 0 |
| C10 | The policy handler grants from stale and deleted data | [PermissionAuthorizationHandler.cs](../../oryx-backend/APP/Claims/PermissionAuthorizationHandler.cs): caches grants for 30 minutes sliding / **12 hours absolute**; reads roles and claims with `IgnoreQueryFilters()` (soft-deleted roles still grant); never checks `IsDisabled`; counts any permission type, not only `Access` | A revoked permission or a disabled account keeps working for up to 12 hours on the 449 attribute-guarded endpoints; the 42 code-checked endpoints use `CurrentPermissionSet` (no cache, honours disabled users and deleted roles), so the two paths disagree | One authorization source: the handler calls `CurrentPermissionSet` (or a short cache keyed by a role-permission version that every role/user change bumps) |

Smaller access-management defects: `GET /permission/role/{roleId}`, `GET /user`, `GET /user/by-permission` and `GET /user/role/{roleId}` disclose role and user data to any signed-in user; `GET /permission/user/{userId}` returns another user's permissions.

## 3. Registry defects

### 3.1 Defined but never registered

Not in `GeneratePermissions()`, so they never appear in Manage Permissions and no role can hold them.

| Key | Where it is used | Effect |
| --- | --- | --- |
| `CanEditWaybillForFgw`, `CanDeleteWaybillForFgw` | nowhere (desktop or server) | Dead constants. FG waybills have view and create keys only, and their edit/delete endpoints (if any) need only sign-in. Register them under FG › Allocations and enforce, or delete them |

(The four OOS investigation keys are registered through a `foreach` loop at `PermissionUtils.cs:2366`; they are fine.)

### 3.2 One key, several submodules

The same key is registered under several submodules, so Manage Permissions shows several tick boxes that are in fact one permission. Ticking it on one screen silently grants it on the others.

| Key | Registered under |
| --- | --- |
| `CanViewForeignPurchaseOrder`, `CanViewLocalPurchaseOrder` | Procurement › Create PO page, Check PO page, Approve PO page, PO list page |
| `CanViewApprovedForeignPurchaseOrder`, `CanViewApprovedLocalPurchaseOrder` | Create, Check, Approve (+ list for local) |
| `CanCreateForeignPurchaseOrder`, `CanCreateLocalPurchaseOrder` | Create PO page, PO list page |
| `CanViewRawMaterials`, `CanViewPackagingMaterials` | Warehouse › Quarantine Area / GRN, Distributed Area, Materials |
| `CanAssignPackagingMaterialsStockToShelves` | Warehouse › Distributed Area, Material Return Note |
| `CanViewPackagingMaterialRequisitions`, `CanIssuePackagingMaterialRequisitions` | Warehouse › Issue Stock Requisitions, Extra Packaging Requisitions |
| `CanViewRawMaterialTransferList`, `CanViewPackagingMaterialTransferList` | Warehouse › Stock Transfer Issues, Stock Transferred Allocated |
| `CanViewVendors`, `CanCreateVendor`, `CanUpdateVendorDetails`, `CanDeleteVendor` | STORES › Vendor Management **and** Inventory Management › Suppliers |

Proposal: one key per screen task (for example `CanViewPurchaseOrdersForChecking` vs `CanViewPurchaseOrdersForApproval`, each split foreign/local), and STORES vendors separate from inventory suppliers.

### 3.3 Aliases: two names, one permission

| Constant | Value | Effect |
| --- | --- | --- |
| `CanViewRawMaterialRequisitionsForProduction` (Production › Requisitions) | `CanViewRawMaterialRequisitions` (Warehouse › Issue Stock Requisitions) | Production's "view requisitions" and Warehouse's "view requisitions to issue" are the same permission; the Production tick box duplicates the Warehouse one |
| `CanViewPackagingMaterialRequisitionsForProduction` | `CanViewPackagingMaterialRequisitions` | Same for packaging |

### 3.4 Naming defects

`ViewCustomerCreditStatus`, `ManageCustomerContracts`, `ManageCosting`, `ViewCustomerQuotations`, `CreateCustomerQuotation`, `ApproveCustomerQuotation`, `ConvertCustomerQuotation` lack the `Can` prefix. `CreateDescription` strips three characters, so Manage Permissions describes them as "Allows the user to w customer credit status." and similar. Their constants are named `Can…`, which hides the mismatch in code.

22 keys use `Manage` (create + edit + delete in one key): `CanManageActivityTemplateRevision`, `CanManageAiWorksheetExtractionSettings`, `CanManageBatchRecordMaster`, `CanManageCompensation`, `CanManageCosting`, `CanManageCustomerContracts`, `CanManageFormTemplateRevision`, `CanManageMicrobialRequirements`, `CanManagePayrollConfiguration`, `CanManagePerformanceCycles`, `CanManageQuestionRevision`, `CanManageRndRedevelopmentCandidate`, `CanManageRndStabilityChambers`, `CanManageRoutineSetup`, `CanManageSamplingPointGroups`, `CanManageSamplingPoints`, `CanManageSupplierCertifications`, `CanManageSupplierContracts`, `CanManageTemplateAreas`, `CanManageWaterQuality`, `CanManageWorkflowTemplateRevision`, `CanManageWorkingHoursPolicy`. Each becomes `Create`/`Edit`/`Delete` (plus any workflow verbs) keys.

### 3.5 Desktop keys the backend does not define

Always deny: no role can hold them.

| Desktop key | Backend key that exists | Where |
| --- | --- | --- |
| `CanViewQcRoutineTests` | `CanViewRoutineTests` | `modules/qc-routines/manifest.ts`, `lib/routines.ts` — **the QC Routines module is unreachable for everyone** |
| `CanCreateQcRoutineTest`, `CanPerformQcRoutineTest` | `CanCreateRoutineTest`, `CanPerformRoutineTest` | `modules/qc-routines/lib/routines.ts` |
| `CanViewQcRoutineSetup`, `CanManageQcRoutineSetup` | `CanViewRoutineSetup`, `CanManageRoutineSetup` | same |
| `CanManageQcMicrobialRequirements` | `CanManageMicrobialRequirements` | same |
| `CanViewQcRoutineWaterQuality`, `CanManageQcRoutineWaterQuality` | `CanViewWaterQuality`, `CanManageWaterQuality` | same |
| `CanRequestRetestProductTest`, `CanCompleteRetestProductTest` | none | `modules/analytical-test-requests/lib/atr.ts` — the ATR retest actions never show |
| `CanViewProductCategory` | `CanViewProductCategories` | test fixture only |

A generated constants file (section 9.6) makes this class of defect a compile error.

## 4. Permissions that cover several tasks

| Key | Tasks it covers today | Evidence |
| --- | --- | --- |
| `CanEditProductionPlan` | Product info, specification, packing style, BOM, packing materials, procedure, STP, ARD and packing order editing (all 9 product edit tabs); also White Placebo recipe editing | `modules/products/manifest.ts` (`/production/products/:id/edit/:tab`), `WhitePlaceboController.cs:23` |
| `CanCreateNewProductionPlan` | Creating a product (the name says "production plan") | `modules/products/lib/product-access.ts` |
| `CanViewPlannedProducts` | Product list, every product detail tab (BOM, procedure, packaging, quality), Product Board (`/production/activities`), Production Health dashboard, production step records (server) | navigation catalog, `ProductionStepRecordsQuery.cs:25` |
| `CanViewApprovedProducts` | FG "Products" page and FG "Approved Products" page | navigation catalog (`/warehouse/fg-products`, `/warehouse/approved-products`) |
| `CanViewRawMaterialRequisitions` | Production requisition list (alias), Warehouse issue list, White Placebo list and creation prerequisite | sections 3.3, `WhitePlaceboController.cs:15` |
| `CanIssueRawMaterialRequisitions` / `…Packaging…` | Issuing, viewing the swap-request page, viewing the extra-material page, White Placebo posting | `swap-requests`, `extra-material-issue` manifests; `WhitePlaceboService.Posting.cs:16` |
| `CanCreateRawMaterialRequisitions` | Production requisitions, White Placebo preparation, White Placebo posting (with `CanCreateGrnForRawMaterials`) | `WhitePlaceboService.*` |
| `CanEditRawMaterials` | Warehouse material editing and White Placebo recipe editing | `WhitePlaceboController.cs:24` |
| `CanViewQcAndQaReport` | Every QC and QA report, including the issued-BMR history report, and the historical view of product and material lists | `ReportRepository.IssuedBmr.cs:15`, `[ReportHistory]` attributes |
| `CanViewWarehouseReport`, `CanViewProcurementReport`, `CanViewFgtnReport`, `CanViewStoreAndInventoryReport`, `CanViewHumanResourcesReport` | Each covers a whole family of reports; 104 of 106 report endpoints are sign-in only | `ReportController` |
| `CanViewQuestions` | Viewing questions and a prerequisite for formula repair | `QuestionFormulaRepairService.cs:31` |
| The 22 `Manage…` keys | Create + edit + delete (+ sometimes activate) | section 3.4 |

## 5. Variants that share permissions or lack them

| Domain | Variants | Keys today | Gaps |
| --- | --- | --- | --- |
| **Products** | Production, QA, QC, FG warehouse | Production: 7 keys for everything; QA: `CanVerifyProduct` only; QC: STP/spec/ARD keys exist; FG: approved products | No QA product view/section keys; Production product sections share one edit key; `GET /product` and `GET /product/{id}` serve every context with no check |
| Materials | Raw, packaging | Split view/create/edit/delete keys exist under Warehouse › Materials | `GET /material?kind=`, `POST /material/upload?kind=`, `PUT /material/{id}`, `DELETE /material/{id}` check nothing; 15 MaterialController actions take the kind from the request; record-kind checks absent |
| Material QC documents | Raw, packaging | STP, specification, ARD keys split by kind | `MaterialStandardTestProcedureController`, `MaterialSpecificationController`, `MaterialAnalyticalRawDataController` (35 actions) are sign-in only |
| Warehouse areas | Raw, packaging | Split keys for receiving, quarantine, distributed, approved, rejected, linked/unlinked, location chart, transfers | `WarehouseController`: 52 actions, all sign-in only |
| Requisitions | Raw, packaging; Production vs Warehouse | Production view keys alias the Warehouse keys | Section 3.3 |
| Purchase orders | Foreign, local; create/check/approve/list | Split view keys, but one key registered on four pages | Section 3.2; `ProcurementController`: 73 of 79 actions sign-in only |
| Stores | IT, General, Equipment, Reagent | Split keys for items, receiving, stock, requisitions, issue, returns, damage | Server enforcement only in part (`StoreWorkflowAccess`); `ItemController` 33 actions sign-in only |
| Store procurement | Trusted vendors, open market | Split keys | `InventoryProcurementController`: 27 actions sign-in only |
| Analytical test requests | Material, product; QA sampling vs QC analysis | Split view keys | `AnalyticalTestRequestController`: 11 actions sign-in only |
| Approvals | Per document type | Single pending-approval keys | Approve/reject is not scoped by document type (a user who may approve a leave request may also approve a COA) |

## 6. Desktop gaps

### 6.1 Any-of rules instead of a specific key (133)

All listed in the [rules appendix](permissions-audit/frontend-rules.md). Four kinds:

| Kind | Examples | Proposal |
| --- | --- | --- |
| **A. Page shell over variant tabs** (acceptable if every tab and every request is checked) | `/warehouse/materials` (raw ∨ packaging), `/procurement/purchase-orders` (foreign ∨ local), store pages (IT ∨ General ∨ Equipment ∨ Reagent), QC GRN, material STP/spec/ARD | Keep the shell rule, but declare per-choice `query` access on every one (only the store pages and ATR do today) and enforce the variant key on the server for each request |
| **B. Borrowed action keys used as a view key** | `/qc/commercial-certificates` opened by `CanCheckRawMaterialTestResult ∨ CanCheckPackagingMaterialTestResult ∨ CanCheckProductTest`; `/warehouse/swap-requests` and `/warehouse/extra-material` opened by issue keys; `/it/support-tickets` by any of view/assign/close/comment; `/qa/issue-bmr` by view ∨ issue; `/finance` by view payments ∨ approve payment ∨ cashflow | A view key per page (`CanViewSwapRequests`, `CanViewExtraMaterialIssues`, `CanViewCommercialCertificates`, …) |
| **C. Dashboards opened by unrelated keys** | HR dashboard (10 keys), services dashboard (9), stores dashboard (8+), QA/QC dashboard, logistics, procurement (`CanViewPurchaseRequisitions`), production health (`CanViewPlannedProducts`), FGTN (`CanViewOrder`), warehouse and inventory command center (receiving keys), upload center (4 unrelated keys), reports | A key per dashboard (`CanViewHrDashboard`, …); each widget additionally hidden without its own data key |
| **D. Create/edit page needs view + create** (26 multi-key `all` rules) | staff requisitions, overtime, leave, form templates, questions, white placebo | One key per task; Manage Permissions ticks prerequisites automatically (decision D4) |

The single `anyPermissions` use is the formula repair route: `/settings/questions/formula/:id/repair` requires `CanViewQuestions` and any of `CanRepairQuestionFormula`/`CanRepairTestFormula`; the backend mirrors it (`QuestionFormulaRepairService.CanRead`). Proposal: one view key for the repair page (`CanViewFormulaRepairs`), keep the two apply keys as they are (each is one task: repair the question's formula, repair the test results), and drop `anyPermissions` from the access model.

### 6.2 Views and actions with no permission of their own

| Area | Gap |
| --- | --- |
| Product detail tabs | BOM, procedure, packaging, quality and summary tabs render for anyone with `CanViewPlannedProducts`; no tab has a view key |
| Product header | Edit button guarded by `CanEditProductionPlan` regardless of tab |
| Products are limited to production departments in the desktop (`departmentType: 0`), but not on the server | Any non-production user can read and write products through the API |
| Signed-in-only roots | `/extrals` root (`store-stock`), `/settings`, `/home`, `/it`: personal pages are fine; `/extrals` root should declare its children |
| Read-only POST lookups (`/collection`, `/collection/uom/paginated`) | Used by many pickers; sign-in only on the server (decision D3) |
| Execution checks | 57 files call mutations without `usePermissionAction` or a confirmation `require` ([list](permissions-audit/unchecked-writes.md)), including purchase-order check/finalise/send, material retest actions, OOS case actions, pending-approval decisions, billing sheets, shipment documents, upload center, warehouse store/location/rack/shelf dialogs, department and working-day editors. Some are checked by a parent; each needs review |

### 6.3 Broken desktop keys

Section 3.5: QC Routines and ATR retest actions are dead because the keys do not exist.

## 7. Backend gaps

[Controller summary](permissions-audit/controller-summary.md) has every controller. The largest unprotected areas:

| Controller | Actions | Sign-in only | Unprotected writes (approx.) |
| --- | ---: | ---: | --- |
| ReportController | 106 | 104 | reads only |
| ProductionScheduleController | 82 | 80 | schedule, start/complete activities, FGTN, returns, extra packing |
| ProcurementController | 79 | 73 | POs, invoices, shipments, billing sheets, waybills, suppliers, manufacturers |
| MaterialController | 57 | 52 (+1 anonymous) | create/edit/delete materials, batch approve/move/consume/status, uploads |
| WarehouseController | 52 | 52 | warehouses, locations, racks, shelves, checklists, GRN, distribution |
| FormController | 43 | 40 | form templates, questions, assignee submissions |
| ProductController | 35 | 34 | products, routes, packages, packing, BOM archive, equipment, uploads |
| ItemController | 34 | 33 | store items, logistics documents |
| InventoryProcurementController | 27 | 27 | store procurement, item approval/rejection |
| ProductionOrderController | 26 | 26 | orders, allocation, proforma, invoices, waybills |
| RequisitionController | 25 | 20 | requisitions, sourcing |
| MaterialAnalyticalRawDataController | 16 | 16 | ARDs |
| QualityAuditController | 14 | 14 | audits |
| CollectionController | 13 | 13 | all reference data (create/edit/delete included) |

Other patterns:

- **Variant taken from the request, never checked.** 55 actions take `MaterialKind`, `kind`, `type`, `storeType` or `source` from the request (flagged in the endpoint matrix). Industry practice: map the variant to its key and check it, and for record endpoints check the key for the record's stored kind after loading it, so a URL parameter cannot reach another kind of record.
- **Bulk "replace" endpoints.** `POST /bom`, `POST /product/{id}/packages`, `POST /product/{id}/packing` and `POST /product/{id}/routes` replace a whole section. Separate Add/Edit/Delete keys need the server to diff the submitted rows against the stored rows and require the key for each kind of change (or separate row endpoints).
- **Two checking mechanisms.** Attribute policies (cached, section C10) and ad-hoc `CurrentPermissionSet.Load` calls. Several services check with OR logic (`WhitePlaceboService`, `QuestionFormulaRepairService.CanRead`, `ReportHistory` "any of").
- **No guard against new unprotected endpoints.** Nothing fails the build when an action lacks a permission.

## 8. What industry practice suggests

Summarised from OWASP ASVS v4 (V4 Access Control), OWASP Top 10 A01 (Broken Access Control), NIST SP 800-162/RBAC, and GxP data-integrity guidance (21 CFR Part 11, EU GMP Annex 11):

1. **Deny by default, enforce on the server, on every request.** Client checks are for usability only.
2. **One permission per action on a resource** (view, create, edit, delete, plus the domain's workflow verbs: approve, reject, verify, issue, release…). No permission that means "everything about X".
3. **Least privilege and separation of duties.** Distinct permissions for preparing and approving the same record; context-specific permissions where departments do different jobs on the same data (Production authoring vs QA verification of a product).
4. **Object-level checks.** When the record decides the variant (raw vs packaging, store type, foreign vs local), check against the stored record, not a request parameter.
5. **Fresh decisions.** Revocation takes effect promptly; disabled accounts and deleted roles grant nothing.
6. **Auditable administration.** Changes to roles and grants are themselves permissioned and logged.
7. **One source of truth** for permission names shared by server and client, so names cannot drift.

## 9. Proposed model

### 9.1 Naming

`Can{Verb}{Context?}{Variant?}{Resource}{Section?}`

- **Verb** from a closed list: `View`, `Create`, `Edit`, `Delete`, `Import`, `Export`, `Print`, `Approve`, `Reject`, `Verify`, `Review`, `Submit`, `Assign`, `Reassign`, `Issue`, `Release`, `Cancel`, `Archive`, `Restore`, `Repair`, plus documented domain verbs (`Sample`, `Distribute`, `Link`, `Unlink`, `Swap`…). `Manage` is retired.
- **Context** when the same resource is worked on by different departments: `Production`, `Qa`, `Qc`, `Fg`.
- **Variant**: `RawMaterial` / `PackagingMaterial`; `Foreign` / `Local`; `ItStore` / `GeneralStore` / `EquipmentStore` / `ReagentStore`; `TrustedVendor` / `OpenMarket`.
- **Section** for parts of a record edited separately (product BOM, procedure…).
- Existing keys that already follow this are kept unchanged; renaming a working, specific key brings no benefit and costs a migration.

### 9.2 Products (the user's example)

Products are worked on in four contexts. Each gets its own keys; nothing in one context grants anything in another.

**Production › Products** (desktop `/production/products`; replaces `CanViewPlannedProducts`, `CanCreateNewProductionPlan`, `CanEditProductionPlan` for products)

| Section | View | Add | Edit | Delete | Other | Backend endpoints | Desktop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Product list | `CanViewProductionProducts` | — | — | — | `CanImportProductionProducts`, `CanExportProductionProducts` | `GET /product` (production context), `POST /product/upload`, `GET /product/download` | manifest root, products table |
| Info (general details, equipment link, division) | `CanViewProductionProductInfo` | `CanCreateProductionProduct` | `CanEditProductionProductInfo` | `CanDeleteProductionProduct` | — | `GET /product/{id}`, `POST /product`, `PUT /product/{id}`, `DELETE /product/{id}`; `POST /product/{id}/finished` | create route, `info` tab, header |
| Bill of materials | `CanViewProductionProductBom` | `CanAddProductionProductBom` | `CanEditProductionProductBom` | `CanDeleteProductionProductBom` | `CanArchiveProductionProductBom`, `CanImportProductionProductBom` | `GET /product/{id}/bom`, `POST /bom`, `PUT /bom/{id}`, `DELETE /bom/{id}`, `PUT /product/{id}/bom/archive`, `POST /product/bom/upload`, `GET /bom`, `GET /bom/{id}` | `bom` tab, detail BOM table |
| Packing materials | `CanViewProductionProductPackingMaterials` | `CanAddProductionProductPackingMaterials` | `CanEditProductionProductPackingMaterials` | `CanDeleteProductionProductPackingMaterials` | `CanImportProductionProductPackingMaterials` | `GET /product/{id}/packages`, `GET /product/packages/{id}`, `POST /product/{id}/packages`, `PUT /product/packages/{id}`, `DELETE /product/packages/{id}`, `POST /product/packages/upload` | `packaging` tab, detail packaging tabs |
| Packing style | `CanViewProductionProductPackingStyles` | `CanAddProductionProductPackingStyles` | `CanEditProductionProductPackingStyles` | `CanDeleteProductionProductPackingStyles` | — | `GET /product/{id}/packing`, `POST /product/{id}/packing` | `packing-style` tab |
| Packing order (package description) | `CanViewProductionProductPackingOrder` | `CanAddProductionProductPackingOrder` | `CanEditProductionProductPackingOrder` | `CanDeleteProductionProductPackingOrder` | — | `PUT /product/package-description/{id}` (read via `GET /product/{id}`) | `packing-order` tab |
| Procedure (routes) | `CanViewProductionProductProcedure` | `CanAddProductionProductProcedure` | `CanEditProductionProductProcedure` | `CanDeleteProductionProductProcedure` | `CanCopyProductionProductProcedure` | `GET /product/{id}/routes`, `GET /product/routes/{id}`, `POST /product/{id}/routes`, `DELETE /product/routes/{id}` | `procedure` tab, detail procedure tab |
| Specification (product's own view of the QC document) | `CanViewProductionProductSpecifications` | `CanAddProductionProductSpecifications` | `CanEditProductionProductSpecifications` | `CanDeleteProductionProductSpecifications` | — | `GET /product-specifications/product/{id}`, `POST/PUT/DELETE /product-specifications…` (product context) | `spec` tab |
| STP | `CanViewProductionProductStps` | `CanAddProductionProductStps` | `CanEditProductionProductStps` | `CanDeleteProductionProductStps` | — | `GET /product-stps/{productId}/product`, `POST/PUT /product-stps…`, STP document upload | `stp` tab |
| ARD | `CanViewProductionProductArds` | `CanAddProductionProductArds` | `CanEditProductionProductArds` | `CanDeleteProductionProductArds` | — | `GET /product-ard/product/{id}`, `POST/PUT /product-ard…`, ARD attachments | `ard` tab |
| Print | — | — | — | — | `CanPrintProductionProduct` | client-side print of the detail | product print |
| Post-issue repairs (already specific, kept) | — | — | — | — | `CanRepairProcedure`, `CanRepairIssuedBom`, `CanRepairIssuedPackaging`, `CanUnstartProduction` | issued-material repair, unstart | activities |

Whether the Production product edit area should include Specification/STP/ARD tabs at all, or show the QC documents read-only and leave authoring to QC, is decision D5. The table assumes they stay, each with its own keys.

**Quality Assurance › Products** (new submodule; today QA has only `CanVerifyProduct`)

| Section | View | Verify | Notes |
| --- | --- | --- | --- |
| Product list | `CanViewQaProducts` | — | QA reaches products for verification without holding any Production key |
| Info | `CanViewQaProductInfo` | `CanVerifyProduct` (kept) | `POST /verification` with product entity must require it (today sign-in only) |
| BOM | `CanViewQaProductBom` | — | read-only in QA |
| Packing materials | `CanViewQaProductPackingMaterials` | — | |
| Packing style | `CanViewQaProductPackingStyles` | — | |
| Packing order | `CanViewQaProductPackingOrder` | — | |
| Procedure | `CanViewQaProductProcedure` | — | |
| Specification | `CanViewQaProductSpecifications` | `CanVerifyProductSpecification` (kept) | |
| ARD | `CanViewQaProductArds` | `CanVerifyProductArd` (kept) | |

If QA also edits product sections, add the matching `Add/Edit/Delete` keys (`CanEditQaProductBom`…) in the same pattern (decision D5).

**Quality Control › Product STP / Specification / ARD** — existing keys are already one per task (`CanViewProductStps`, `CanCreateProductStp`, `CanEditProductStp`, `CanDeleteProductStp`, and the same for specifications and ARDs). Kept; enforced on the server (today `ProductStandardTestProcedureController`, `ProductSpecificationController` and `ProductAnalyticalRawDataController` are sign-in only, 27 actions).

**Finished Goods Warehouse › Products**

| Page / task | Today | Proposed |
| --- | --- | --- |
| FG products list (`/warehouse/fg-products`) | `CanViewApprovedProducts` | `CanViewFgProducts` |
| Approved products list (`/warehouse/approved-products`) | `CanViewApprovedProducts` | `CanViewApprovedProducts` (kept) |
| Approved product packing style | `CanEditApprovedProductPackingStyle` (enforced) | kept |

**Settings › Product categories** — existing `CanView/Create/Edit/DeleteProductCategories`; enforce on `GET /product/categories` and the collection endpoints.

### 9.3 Server design for products

- Context-scoped reads: `GET /product?context=production|qa|fg` (or separate routes) with the context mapped to its list key; `GET /product/{id}` returns only the sections the caller may view (or per-section endpoints, which the desktop already uses for BOM, routes, packages and packing).
- Bulk section saves diff old against new rows: added rows need `Add`, changed rows need `Edit`, removed rows need `Delete`. The permission is rechecked inside the transaction immediately before the write, as AGENTS.md requires.
- The production-department restriction moves from the desktop-only `departmentType` rule into the server check for Production product keys (or is dropped if the keys alone are enough; decision D6).

### 9.4 Other domains (summary; full per-endpoint drafts in the endpoint matrix)

| Domain | Proposal |
| --- | --- |
| Access management | Enforce existing `CanViewRoles`, `CanCreateRole`, `CanEditRole`, `CanDeleteRole`, `CanViewPermissions`, `CanUpdateExistingPermission`, `CanResetPermission`, `CanViewActiveUser`, `CanViewInactiveUser`, `CanCreateUser`, `CanEditUser`, `CanBlockUser`, `CanUnblockUser`; new `CanDeleteUser`, `CanAssignUserRole`, `CanEditUserSignature`, `CanViewUserPermissions` |
| Materials (Warehouse) | Keep split raw/packaging keys; enforce per kind from the query, and per stored kind for record endpoints; new `CanImportRawMaterials`/`CanImportPackagingMaterials`, `CanEditRawMaterialReorderLevel`/`…Packaging…`, `CanApproveRawMaterialBatch`/`…Packaging…`, `CanMoveRawMaterialBatch`/`…Packaging…`, `CanConsumeRawMaterialBatch`/`…Packaging…`; separate the "Materials" tick box from Quarantine and Distributed |
| Requisitions | Production keys get their own values (`CanViewProductionRawMaterialRequisitions`, `CanViewProductionPackagingMaterialRequisitions`) instead of aliasing Warehouse; Warehouse keeps `CanViewRawMaterialRequisitions` for issuing; new `CanViewSwapRequests`, `CanViewExtraMaterialIssues` |
| White Placebo | Own keys instead of borrowed ones: `CanViewWhitePlaceboPreparations`, `CanCreateWhitePlaceboPreparation`, `CanEditWhitePlaceboRecipe`, `CanPostWhitePlaceboPreparation`, `CanIssueWhitePlaceboPreparation` |
| Purchase orders | One view key per page and variant: `CanViewForeignPurchaseOrdersForCreation`/`Local`, `…ForChecking`, `…ForApproval`, `CanViewForeign/LocalPurchaseOrderList`; existing create/check/approve/revise keys kept and enforced |
| Stores | Existing four-way split kept; enforce on `ItemController`, `ItemGrnController`, `ItemStockRequisitionController`, `DamagedStocksController`, `InventoryProcurementController` per store type and per stored record |
| Vendors vs suppliers | STORES vendors keep `CanViewVendors`…; Inventory Management suppliers get `CanViewSuppliers`, `CanCreateSupplier`, `CanEditSupplier`, `CanDeleteSupplier` |
| QA verification and approvals | Enforce existing verify keys per entity type on `POST /verification`; approval decisions per document type (`CanApprove{DocumentType}`) or the existing pending-approval keys plus the approval stage's configured approver (decision D7); enforce `CanTransferApprovalRights` |
| QC routines | Fix the desktop to the backend names (`CanViewRoutineTests`…) and split `CanManageRoutineSetup`, `CanManageMicrobialRequirements`, `CanManageWaterQuality` into create/edit/delete |
| ATR | Register `CanRequestProductRetest` and `CanCompleteProductRetest` (or drop the desktop actions) |
| Formula repair (keys from the parallel session) | Keep `CanRepairQuestionFormula` (Settings › Workflow Builder) and `CanRepairTestFormula` (QC › Testing) unchanged as the two apply tasks; add `CanViewFormulaRepairs` for opening the repair page and its history, replacing `CanViewQuestions ∧ (repair ∨ repair)` |
| Dashboards | One key each: `CanViewHrDashboard`, `CanViewHrExecutiveSummary`, `CanViewServicesDashboard`, `CanViewStoresDashboard`, `CanViewWarehouseDashboard`, `CanViewInventoryCommandCenter`, `CanViewLogisticsDashboard`, `CanViewProcurementDashboard`, `CanViewProductionHealthDashboard`, `CanViewQaQcDashboard`, `CanViewFgtnDashboard`, `CanViewUploadCenter` |
| Reports | One key per report (106 report endpoints) under Reports › {family}; the family keys retire. Historical (`asOfDate`) reads use the same per-report key |
| Reference data lookups | Decision D3 |
| `Manage…` keys | Split into create/edit/delete (section 3.4) |

### 9.5 Server enforcement design

1. **Fix the handler** (C10): the policy handler delegates to `CurrentPermissionSet` semantics (disabled users, deleted roles, `Access` type) with either no cache or a short cache invalidated by a role-permission version bumped on every role, role-assignment and user-status change.
2. **Every action declares its permission.** `[Authorize(PermissionKeys.X)]` for fixed keys. For variant endpoints, a small `[RequiresVariantPermission]` filter or a service helper `RequirePermission(actor, KeyFor(kind))`, with record endpoints checking the stored kind after loading.
3. **Recheck before each write.** Services that mutate recheck the key inside the transaction immediately before writing (the pattern already used by migration retest, unstart and formula repair).
4. **Build-time test**: reflect over all controller actions; each must carry a permission attribute, an `[AllowAnonymous]` on an explicit allow-list (sign-in, refresh, forgot/reset password, OnlyOffice callback with its own token), or an `[AuthenticatedSelfService]` marker on a reviewed list (own profile, own password, own notifications, own payslip). Every key referenced must be registered exactly once.
5. **No OR-substitutes on the server.** A check names the one key for the task; where a page legitimately aggregates (dashboards, reports), it gets its own key.

### 9.6 One source of truth for keys

- Backend: a structured catalog (module, submodule, key, task, optional `implies`, optional `replaces`) replaces the 3,600 lines of `addPermission` calls; `GeneratePermissions()` and the role migration both read it. A test asserts unique keys, one registration each, no orphaned constants.
- Backend writes `docs/permission-catalog.json` from that catalog in a test (snapshot: the test fails when the catalog changes and the file was not regenerated).
- Desktop: `bun run permissions:import` reads that JSON and writes `apps/web/src/shared/auth/permission-keys.generated.ts`: a `PermissionKeys` object and a `PermissionKey` string-literal union. `AccessRule`, manifests, `require` and `usePermissionAction` accept only `PermissionKey`, so an undefined key (section 3.5) fails `bun run check`. A test forbids raw `"Can…"` literals outside the generated file.
- Navigation: `catalog.generated.ts` keeps its import from Oryx Next for paths and titles, but its permission keys are checked against `PermissionKey` and overridden where this redesign assigns a new key.

## 10. Migration (existing roles keep working)

How grants are stored: a `RoleClaims` row (`ClaimType = "Permission"`, `ClaimValue = key`) plus a `PermissionTypes` row (`Key`, `RoleClaimId`, `Type = "Access"`). The desktop counts a key as held when its type includes `Access`.

1. **Mapping table.** Each new key lists the old key(s) it replaces (`replaces` in the catalog). Examples:

   | New key | Granted to roles that hold |
   | --- | --- |
   | `CanViewProductionProducts`, `CanViewProductionProductInfo`, `CanViewProductionProductBom`, …(all Production product view keys) | `CanViewPlannedProducts` |
   | `CanCreateProductionProduct` | `CanCreateNewProductionPlan` |
   | `CanEditProductionProductInfo`, all `CanAdd/Edit/DeleteProductionProduct{Section}` | `CanEditProductionPlan` |
   | `CanDeleteProductionProduct` | `CanEditProductionPlan` (no delete key exists today; decision D8) |
   | `CanViewQaProducts`, `CanViewQaProduct{Section}` | `CanVerifyProduct` |
   | `CanViewFgProducts` | `CanViewApprovedProducts` |
   | `CanViewProductionRawMaterialRequisitions` | `CanViewRawMaterialRequisitions` (only roles where the Production tick box was the source cannot be told apart; both get it) |
   | `CanViewHrDashboard` | any of the ten keys the dashboard accepts today (an any-of rule is used only here, to reproduce today's access exactly) |
   | `CanCreate/Edit/DeleteX` from `CanManageX` | `CanManageX` |
   | Endpoint keys for today's sign-in-only endpoints | the desktop key that guards the endpoint's call sites today (endpoint matrix, "frontend guard") |

2. **Data migration.** An EF migration with idempotent SQL: for each (new, old) pair, insert a `RoleClaims` row and an `Access` `PermissionTypes` row for every role holding the old key with `Access`, skipping roles that already hold the new key. It writes one audit row per grant (role, new key, source key, migration id) so the change can be reviewed and reversed.
3. **Dry run first.** The same mapping runs as a read-only report against a copy of production data, listing per role the keys it will gain, for sign-off by the system owner before the migration runs.
4. **Retiring old keys.**
   - Release N: new keys added and granted; server and desktop switch to the new keys together; old keys stay registered but are shown under a "Retired (do not use)" submodule and grant nothing.
   - Release N+1: old keys removed from the catalog; a migration deletes their `RoleClaims`/`PermissionTypes` rows (after a backup), and the mapping table stays in the repository as history.
   - Rollback within release N: re-deploy the previous build; old grants are untouched, so access returns to its prior state.
5. **Endpoints protected for the first time.** Enforcing a key on a previously open endpoint can lock out users who relied on the gap. The dry run lists, per endpoint, which roles hold its new key; any business user who used the endpoint without it is surfaced before release (decision D9).
6. **Deployment order.** The desktop's dev server proxies `/api` to the remote backend `164.90.142.68:8086`, so new keys appear in Manage Permissions only once that backend (or a local one) runs the new build. Desktop and backend must be released together for the switch in step 4.

## 11. Delivery plan

| Phase | Contents | Size |
| --- | --- | --- |
| 0 | Critical fixes C1–C10 (no new keys except `CanAssignUserRole`, `CanEditUserSignature`, `CanDeleteUser`); handler fix; enforce existing keys on access management, verification, approvals, batch approval | small, separate PR per repo |
| 1 | Catalog refactor, generated JSON, generated desktop constants, build-time endpoint test (initially reporting, not failing), fix the 11 undefined desktop keys and the 2 unregistered keys | medium |
| 2 | Products (all contexts and sections), materials raw/packaging, requisitions, White Placebo, with allow/deny tests | large |
| 3 | Procurement, warehouse, stores, QC/QA documents, approvals | large |
| 4 | HR, settings, reports, dashboards, remaining controllers; build-time test becomes failing | large |
| 5 | Retire old keys (release N+1) | small |

Tests each phase adds: backend allow/deny per new key on its endpoint (for example "QA product viewer cannot read Production BOM", "Production BOM editor cannot delete BOM rows", "raw-material editor cannot edit a packaging material by id"), the build-time endpoint test, the catalog uniqueness test; desktop route and action deny/allow tests for the same pairs, and `bun run check`.

## 12. Decisions needed

| # | Question | Recommendation |
| --- | --- | --- |
| D1 | Ship the critical fixes (section 2) as an immediate, separate hotfix before the redesign? | Yes. They are exploitable today |
| D2 | Is the four-context product split (Production, QA, QC, FG) and the section list in 9.2 right? Any other product sections (for example equipment or finished-product details as their own section)? | As in 9.2 |
| D3 | Shared lookups (material, product, UoM and collection pickers used by many screens): a lookup key per reference type (`CanLookUpMaterials`…), or purpose-scoped lookup endpoints authorized by the consuming task's key? | Lookup keys per reference type, granted by migration to every role that holds a task using them; simpler and still one key per task |
| D4 | Should a create/edit key imply its view key (Manage Permissions ticks view automatically), instead of pages requiring two keys? | Yes: one key checked per task, prerequisites ticked by the UI and recorded in the catalog |
| D5 | Production product edit: keep Specification/STP/ARD tabs with Production keys, or show QC's documents read-only there? Does QA edit any product section? | Keep them read-only in Production and author in QC, unless Production authors them today |
| D6 | Keep the production-department restriction on Production products in addition to the keys? | Drop it once the keys exist: one mechanism |
| D7 | Approvals: one approve/reject key per document type, or the existing pending-approval keys plus the configured approver for the stage? | Configured approver plus a per-document-type key, so a leave approver cannot approve a COA |
| D8 | Product delete has no key today (the endpoint is open). Who should get `CanDeleteProductionProduct`: holders of `CanEditProductionPlan`, or nobody until assigned? | Nobody until assigned (deletion of master data is rare and sensitive) |
| D9 | For endpoints protected for the first time, grant the new key to roles that hold the desktop key guarding that screen today? | Yes, plus the dry-run report for sign-off |
| D10 | Rename existing specific keys that only miss a context word (for example keep `CanViewApprovedProducts`)? | No: keep working specific keys; rename only combined, shared or misnamed keys |

## 13. Method and limits

- Backend: a static parser read `PermissionUtils.cs`, both reflection catalogs (`FullProcedurePermissionCatalog`, `QcWorksheetPermissionCatalog`) and every controller. For each action it records route, verb, `[Authorize(key)]` at class and action level, `[ReportHistory]`, `[AllowAnonymous]`, keys referenced in the action body and its local helpers, and keys referenced in the injected repository/service method it calls (two hops). An action reported as "sign-in only" may still be checked deeper in a call chain the parser did not follow, or by a non-key rule such as the password-reset account allow-list (`POST /auth/admin/user-password`). It should be treated as "no visible permission check" and confirmed when the endpoint is rewired.
- Desktop: manifests were evaluated with Bun (exact rules, not text matching). Key usage is every `"Can…"`/known-key string literal outside generated code. Endpoint ↔ desktop links go through the generated RTK endpoints' URL and method; 331 backend actions have no generated hook (not used by the desktop). "Frontend keys" for an endpoint are the keys in the calling files and the permission-constant files they import, so they can include keys of neighbouring actions; the "Proposed key" column is a starting point, and the domain tables above are the proposal.
- The scripts are in the session scratchpad; phase 1 moves them to `scripts/permission-audit/` so the appendices can be regenerated after each phase.
- Nothing was run against a database; role contents (for example whether role `super` exists in production) were not inspected.

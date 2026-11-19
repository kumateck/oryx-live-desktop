# Production material request follow-ups

Pending approval shows the production batch and allocated material batch numbers with quantities in their physical units. Reject requires the matching raw or packaging permission, a reason, unchanged reviewed evidence and current assignment. The reason and rejection stay in history; production can raise a fresh request. Issued requests stay protected by the backend.

Deploy the companion backend and `GrantProductionStockRequisitionRejection` migration first. New `CanRejectRawMaterialStockRequisition` and `CanRejectPackagingMaterialStockRequisition` keys live under Quality Assurance / Pending Approvals and inherit matching access types from existing `CanRejectPendingApproval` roles. Other roles receive no grants.

Stock-by-batch displays optional server-converted warehouse quantities, retaining physical values for stock actions. Without both optional fields it displays the original quantity/unit pair. Product packaging saves refresh loaded BMR and production packaging requirements. Reads never reserve stock or replace an adopted snapshot; the first authorized request adopts previously absent packaging in the backend.

The bounded importer `scripts/import-production-material-followups.ts` adds only two rejection POST operations, their request DTO and two optional shelf read fields. Reviewed contract digest `ba3863c627fb90398277863658833e9876b26678c7f1c8c7a4527cdde854c12a` strips exactly those additions to reproduce predecessor `e9f0e6838046b0db5121ed1611371bd6f8096c611c37a2eb22c0a9649e4bdcaa`. Existing security and release fingerprints remain intact.

Warehouse notification routing and tablet procedure variants await client clarification and are excluded.

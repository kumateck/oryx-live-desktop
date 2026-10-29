# Legacy Stock approval warning

The customer supplied a read-only query result on 2026-10-28 for workflow
`01994fb8-24c7-7d47-a289-f3d92ea7717a`, document key `Stock`. It has three stages,
all at order 0, all with null user and role assignments. Their required flags are
false, true, false. These records fail the existing stage validation; the warning
does not establish a server outage or a timing dependency.

The companion backend's disabled historical `ApprovalSeeder` contains the same
three-stage pattern under `RequisitionType.Stock.ToString()`, omits stage orders,
and uses nullable user lookups. This matches the observed legacy record. Current
`ApprovalDocumentPolicy` maps raw and packaging stock requisitions to
`StockRequisition`, not `Stock`. The active configuration remains separate.

The settings warning no longer tells a person to recreate a configuration
blindly. It names validation checks and distinguishes legacy Stock from Stock
Requisition routing. A repair action is shown only with `CanEditApprovalWorkflow`
when the stored document, delay and stages can be read without discarding data.
The repair editor retains all required flags and leaves empty approvers for an
explicit choice. It refuses ambiguous user-plus-role assignments and unreadable
delays. The document key is locked, and stages are numbered from 1 in the displayed
order when saved. The source is reread before a repair; changed evidence, identity
or access prevents the write. Backend validation rejects missing/deleted roles and
missing/deleted/disabled users, and the update endpoint enforces the existing edit
permission. Updates retain the same policy ID and use normal backend actor audit
fields; existing document approval rows and other policies are not rewritten.

For the reported record, the user selected General Manager Production as an
acceptable approver. The reviewed repair is one retained required stage assigned
to that role, with order 1 and the zero escalation delay retained. Remove the two
empty optional stages explicitly in the editor, select the role from the directory,
and save after review. The application does not embed a customer-specific role ID
or change server configuration just by opening the repair page. Deploy the backend
permission/assignee validation before the frontend repair capability.

Do not rename the row to StockRequisition or silently substitute approvers. A
configuration repair does not rewrite historical document approval stages. If
retirement is preferred instead, first inspect historical references and the
current StockRequisition policy, then prepare an explicitly reviewed, audited
cleanup of this exact row. No customer data or routing was changed locally.

# Service procurement handoff

The existing backend workflow is:

1. Compare quotations and select one.
2. Under **Service proforma requests**, request the chosen provider's invoice,
   record its response, then approve it with the existing approval permission.
3. Under **Service memos → Ready for a memo**, open the approved proforma and
   raise the memo. It then appears in the **Memos** list as a draft.

Quotation selection does not create a service memo. The backend requires the
job order's approved proforma and its selected quotation before accepting a memo.
The comparison confirmation and memo page explain this sequence; the comparison
page links to proforma requests when the person can view that stage. Existing
action permissions and the backend approval gate remain authoritative.

If an approved proforma is absent from **Ready for a memo**, inspect the
`GET /api/v1/service-proforma-invoices?memoPending=true` response for that job order.
The endpoint returns approved proformas whose job order has no linked service memo.

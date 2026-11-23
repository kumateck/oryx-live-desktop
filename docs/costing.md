# Finance costing

Finance & Cashflow → Costing lists division price-list revisions, following the Approved Vendor List document pattern. Each row is a whole division revision. Opening it shows searchable, paged product pack prices. Forms use the existing FormDialog/FormWizard, Select and DatePicker; printing uses PrintPreviewDialog and the shared print sheet.

| Page | Route | Access |
| --- | --- | --- |
| Price-list revisions | `/finance/costing?division=0` or `division=1` | `CanViewCostingPriceList` |
| Revision and its pack prices | `/finance/costing/revisions/:id` | `CanViewCostingPriceList` |
| Customer agreements | `/finance/costing/agreements` and `/:id` | `ManageCosting` |

## Revisions and dates

Prepare a draft for the division, set the document number, revision number, effective date and reason, then set its pack prices. Only one draft or pending revision can exist per division. The revision source and open-state information come from the server independently of the table's current page and search.

Send for review opens the existing document review workflow. A required `CostingPriceList` approval workflow must be configured first. A reviewer may return it for correction; confirmed revisions go to their assigned human approval stages. Approved and rejected revisions are immutable. “New revision” copies the latest approved document, including an approved future revision, and requires a later number and effective date.

An approved revision becomes current only when its effective date and approval time have both arrived. Dates are calendar dates at midnight UTC. Approval after the effective date takes effect at approval time. Earlier approved revisions remain current until then; historical rows are retained as superseded. No scheduled job or rewrite of product master prices is required.

## Packing styles and currency

Every line is one **product + packing style**, priced per complete pack. A 100 ml bottle and a carton of 24 bottles have separate amounts; one style never borrows another's price. “Priced in” chooses the line's configured currency. Amounts are stored exactly as entered, without conversion. The saved currency name and symbol are snapshots and appear beside current/previous amounts and in print.

The initial draft includes active packing styles in the division. Legacy product prices seed only a product with exactly one active style; styles on multi-style products start unpriced. Subsequent revisions copy the predecessor. Add a newly introduced style with “Add product pack”, whose choices search product name, code and style within the revision's division. Mark unwanted styles “Leave this packing style unpriced”.

Customer-specific agreements still take precedence. Once a division has an effective approved list, an absent or unpriced style cannot fall back to a different style or old product price. Before the first approved revision becomes effective, legacy pricing remains available. New quotation/order lines retain their chosen amount and revision reference. Orders with a saved amount/currency carry them into fulfilment; migrated historical invoices retain their prior amounts.

The product details link to pack prices in Finance instead of showing a potentially stale product-level amount. Older direct price-setting endpoints refuse price changes once a division has revision documents.

## Printing

The Print action has its own permission and requests only the selected document when opened. The landscape sheet shows document/revision/effective-date/status, product code/name, packing style, amount with currency, and prepared/checked/approved signatures. Draft, scheduled and superseded documents show their status rather than being presented as current.

## Permissions and deployment

All ten keys are under Finance → Costing: `CanViewCostingPriceList`, `CanCreateCostingPriceList`, `CanEditCostingPriceList`, `CanReviseCostingPriceList`, `CanSubmitCostingPriceList`, `CanReviewCostingPriceList`, `CanReturnCostingPriceList`, `CanApproveCostingPriceList`, `CanRejectCostingPriceList`, `CanPrintCostingPriceList`.

Deploy the backend and additive migrations before this desktop change. Existing `ManageCosting` roles receive view/create/edit/revise/submit/print grants with the same access types. Review/return/approve/reject are new oversight tasks granted to nobody by the migration; configure these and the required approval stages through the existing access/workflow settings. Customer agreement management keeps its existing permission and behavior.

The list reads are scalar projections with server search and pagination. They do not fetch warehouse, equipment, inventory or BOM graphs. Only explicit print loads all snapshot lines of the selected revision. The legacy product price lookup also now uses a narrow projection, stable ordering, search, department/currency and optional division filters.

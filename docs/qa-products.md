# QA products

QA → Products (`/qa/products`) starts with a production-department selector.
Choose a department and Load products. Search/paging use that department; opening
a product retains the selection through details, edit sections and back/cancel
links. The user's session department never changes. Production → Products keeps
its existing active-department access and creation flow.

The QA route uses `CanViewPlannedProducts`. Edit also requires
`CanEditProductionPlan`; verification uses `CanVerifyProduct`. Existing separate
specification and ARD grants remain in force. No roles are assigned by this change.
QA reuses the same nine product edit sections, detail tabs and print workflow.
A product that does not belong to the selected department cannot mount its
editors. If Info moves a product to another department, return to Products and
select its new department before continuing.

The existing material list and unit endpoints accept optional `productId` query
context. The backend requires live product view and edit grants, then derives the
production department from the active product. Material pickers, unit lookups
and the final BOM unit preflight use that context. Without it, existing callers
continue reading their own department's linkage. No database migration is needed;
deploy the matching backend before activating the QA editors.

The OpenAPI change adds only those two optional parameters. The reviewed typed
contract digest is `d09fee761aad8d543b42a10bc0f661d9b7a31a6606a1d7b3bcd829da3c8fe747`;
previous approved digests, operations, schemas and security stay intact.

The Product readiness report's responsive grid now resets all inherited column
widths, including the more-specific product-matrix widths. Status labels wrap at
words. All fields/checks remain visible and print retains table column widths.
Local browser validation was unavailable because browser use was disabled in Work
settings; target-size and Windows display-scaling acceptance remain outstanding.

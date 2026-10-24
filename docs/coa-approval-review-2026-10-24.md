# Certificate of analysis approval review — 2026-10-24

The pending-approval detail for the existing `Response` document now presents
its certificate of analysis directly on the page. The detailed worksheet is
available in a separate print-preview dialog.

## Display and printing

- `Response` is labelled “Certificate of analysis” in the queue cards, list title,
  breadcrumbs, request facts, and detail labels. Its key, position in the document
  registry, routes, API identifiers, and permissions are unchanged.
- The on-page certificate includes batch facts, results, specifications,
  compliance, and the existing signature lines.
- **Print COA** opens the existing certificate print-preview dialog using the
  same document component as the on-page certificate.
- **Print Worksheet** opens a print-preview dialog containing the specification
  summary and detailed readings, observations, tables, and formulas.
- Document content uses scoped black-on-white tokens in both application themes.
- Each dialog uses the shared print preview with a scrolling body, fixed footer,
  Close, and Print. Only that dialog's document is placed in the print portal;
  closing removes its print copy.

## Integrity boundaries

Existing response selection, section ordering, formula calculation/display,
authoritative results, approval/rejection, OOS initiation, and approved COA
creation gates are retained. Opening and printing previews neither creates a
certificate nor saves, approves, or releases results. Endpoint and audit payloads
are unchanged.

## Verification

27 focused approval and print tests pass, covering inline COA, both preview dialogs,
worksheet evidence, selected print content, cleanup on Close, and absence of
save/approval requests during printing. Existing OOS and approved-generation
checks are included. The production web build, including strict TypeScript validation, passes.
The UI detector found no issues. Cached React Doctor completed an app-wide scan;
no errors were reported in the changed modules. Existing findings outside this
change were left intact.
Local browser visual verification could not run because browser use is disabled
in Work settings; no deployed application or production record was changed.

Documentation updated: this note and the pending-approval section of
`docs/workflows.md`. Service and setup contracts are unchanged.

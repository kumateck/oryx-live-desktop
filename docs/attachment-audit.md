# Attachment entry-point audit — 2026-10-20

## Shipment preview diagnosis

The running desktop was inspected on the testing site at `http://164.90.142.68:3011`. Reloading the read-only shipment detail still loaded the legacy **Attached file / Open in browser** dialog. The served `attachment-list-aAzIr9um-g2.js` embeds the file URL directly in an iframe; it does not contain the new renderer.

The reported shipment invoice returns HTTP 200, `application/pdf`, 85,715 bytes and `Content-Disposition: attachment`. It is a valid one-page PDF. That response is unsuitable for relying on an embedded browser PDF plugin. The new host fetches and validates the bytes, so attachment disposition does not prevent preview.

The site's PDFCraft WASM URL returned HTML from the SPA fallback instead of WASM. The testing site has not received the new viewer build. A local loopback-only acceptance page used the actual shared viewer, isolated engine and exact downloaded PDF: the invoice rendered visibly. No server record or attachment was changed. This verifies that PDF locally, not all formats or the installed Windows client.

## Source coverage

The audit scanned **867 non-test TSX sources**, including **227 route pages**. It found **23 files exposing or composing the shared attachment controls**. The only iframe/object/embed location is the sandboxed host in `shared/attachments/craft-preview.tsx`; no page retains a direct file iframe in the current local source. `tests/attachment-entry-points.test.ts` enforces that boundary, including React `createElement` calls.

| Page family / entry point | Shared integration |
| --- | --- |
| Shipment document and waybill details | `modules/shipment-documents/components/shipment-detail.tsx` → AttachmentList |
| Billing sheet details | `modules/billing-sheets/components/billing-sheet-detail.tsx` → AttachmentList |
| Purchase-order details | `modules/purchase-orders/components/order-detail.tsx` → AttachmentList |
| Finished-goods invoice attachments | `modules/fg-dispatch/components/invoice-pages.tsx` → AttachmentList |
| Material and product ARD details/edit dialogs | shared ARD detail and domain dialogs → AttachmentList |
| Product ARD section | `modules/products/components/ard/ard-dialog.tsx` → AttachmentList |
| STP details, versions, summaries and edit dialogs | shared STP views/version controls and product STP status → shared opener |
| Supplier certification evidence | `modules/suppliers/relationship/certification-files.tsx` → AttachmentList |
| Purchase-order, shipment, billing, leave and job approval evidence | pending-approval detail components → AttachmentList |
| QC/ARD recorded answer attachments | shared question attachment renderer → shared opener/preview action |
| Persisted and new form uploads/images throughout the app | shared FormWizard field renderers → shared opener/preview action |
| File links in saved rich text throughout the app | RichTextView → shared opener; ordinary website/mail/phone links retain navigation |

This is a source-wide audit, with focused route tests and one real PDF rendering check. It is not a claim that every route was manually opened. Explicit export/download actions continue to download files.

## Release correction

- Nginx serves `/viewers/` as immutable static files and returns 404 for missing engines, instead of HTML.
- `deploy/keep-assets.sh` validates the JS/WASM for all three engines before copying a release, checks WASM magic bytes and retains current/earlier engine versions and notices on the existing persistent asset volume.
- Missing or HTML-instead-of-WASM engines fail startup visibly. No TLS, sandbox, authentication or permission setting was weakened.
- New tests exercise shipment/waybill PDF detail opens, attachment-disposition responses, the source-wide renderer boundary, release retention and rejected incomplete releases.

The corrected build and deployment configuration still need to be deployed to port 3011. The running site was not changed during this audit.

## Verification result

- 93 web tests pass across 21 suites, plus three source-boundary/release-retention tests.
- Production web build and root TypeScript checks pass; the asset retention script also passes shell syntax checking and a copy/validation smoke run against the real built engines.
- The exact reported PDF rendered in the local browser; proof is `/tmp/oryx-shipment-pdf-preview.jpg`. The temporary server ran on loopback only and was stopped after verification.
- Documentation updated: this audit, `attachment-viewers.md`, `deployment.md`, `services.md`, `workflows.md` and README.

## Local desktop follow-up

With the desktop connected to `http://127.0.0.1:5173/`, the real `009 Xzole susp.docx` and reported shipment invoice PDF both rendered visibly in Electron. The PDF was rechecked after **Open original** was removed; the dialog exposes only Close preview in its footer. The updated single-viewer behavior passes 49 focused web tests and a production build. Excel remains without a real desktop rendering check in this run. This supersedes the earlier browser-only acceptance limit for these two tested documents, not the installed Windows/scaling acceptance limits.

The earlier engine capability review found that save rejection alone did not lock temporary editing. It is superseded by the reviewed `readonly-v1` source patches and viewer-only adapters described in `attachment-viewers.md`. Each renderer now enforces its viewing policy inside Rust/WASM, and the parent fails closed on any unexpected save/dirty notification.

Read-only desktop acceptance (2026-10-20): rebuilt Word/PDF/Excel engines rendered local synthetic files in the packaged Electron shell at local port 5173. Typing/paste/delete/save did not change Word text, Excel cells or the PDF form. Word/Excel search, Excel sheet tabs and PDF fit-to-page remained usable. Temporary test fixtures were removed; no upload, server record change or deployment occurred. See `attachment-viewers.md` for policy and validation details.

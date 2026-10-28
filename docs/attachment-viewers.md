# Attachment viewers built into Oryx Live

Oryx includes its own PDF, DOCX and XLSX attachment viewer UI and locally hosted rendering engines. It does **not** connect to Dodo Workspace, Artcraft, Office Online, Google Docs, or a separate document service. MinIO remains the source of the attachment bytes, through Oryx's existing file API or the file's existing signed link. No document is uploaded, converted remotely, replaced, approved, or modified by previewing.

## User flow

**The attachment filename** and **View** both open a near-full-window Oryx preview with a fixed heading and footer. The engine loads only for the selected file type. **Close preview** releases the frame, validation worker and outstanding fetches. Images open in the same preview dialog. Every valid attachment, including an unsupported format, enters this common flow; filenames no longer open a browser tab. The viewer reads the attached file itself; there is no separate **Open original** or browser link. Unknown formats, legacy DOC/XLS, encrypted documents, unsupported packages and large files show a clear in-viewer explanation.

This is a read-only attachment viewer. The bundled engines use a host-set session policy, display only viewing controls and refuse document-changing commands. No editing, saving, sharing, export, autosave or checkpoint controls are exposed in the viewer. The parent independently rejects saves and treats an unexpected dirty/save report as a viewer error. No write/upload bridge or endpoint is provided. A preview is not a signature-verification service or proof of Microsoft Office layout equivalence. The original bytes stay unchanged, including signed originals.

The shared list covers shipping documents, billing evidence, dispatch purchase orders, STP/ARD records and existing callers. Purchase-order attachments; leave, job, shipment, purchase-order and billing approval evidence; supplier certifications; saved product/material ARD attachments; persisted and newly selected form files/images; rich-text file links; and controlled STP version history/summaries/edit dialogs use this viewer. Ordinary website, email and phone links retain their navigation. Explicit export/download actions retain their download behavior. QC printouts omit interactive controls.

Protected STP version filenames read through the existing authenticated version endpoint, retain audit headers and enter the viewer with local bytes. Refused reads show an error, slow reads time out after 90 seconds, and closing the owning view cancels pending work. Only locally selected files and authorized internal reads can supply Blob sources. Owned object URLs are created only for protected reads and image display, then revoked when their read or preview ends; they are not persisted to records. Opening a preview neither submits nor changes a form.

## Pinned implementation references

Dodo Workspace's implementation documentation and reviewed binary bundles were inspected and vendored into **this repository**; no Dodo paths or services are used by normal builds or at runtime.

| Format | Local engine | Upstream revision |
| --- | --- | --- |
| DOCX | WordCraft | `eae242176108d328c5dd81fbc10370c51ab90706` |
| PDF | PDFCraft | `53a5880386789fc3531e54f6e6ffdef9a8e41f1a` |
| XLSX | GridCraft | `d9d09f0baa912e88c5111107903fc8c640214b57` |

References: [WordCraft](https://github.com/storytold/wordcraft), [PDFCraft](https://github.com/storytold/pdfcraft), [GridCraft](https://github.com/storytold/gridcraft). These are Rust/WASM rendering applications; their engines are not reimplemented as a React text extractor or table approximation. Reviewed source patches, Oryx read-only adapters and archive provenance are under `viewers/<engine>/adapter` and `provenance.json`. Its encrypted offline library, user identity, synchronization, editor windows and Electron preloads are not imported into Oryx.

Each checked-in `vendor.bundle.zip` includes the engine/glue, resolved Cargo lock, MIT/Apache licenses, notices, attribution and dependency/font notices. Preserve these on redistribution. Oryx uses no Artcraft service or proprietary wordmark. The host uses the assigned-file subset of the existing WASM boundary; original Dodo HTML/bootstrap scripts are not served.

## Build and deployment

`bun run dev:web` and `bun run build:web` run `scripts/prepare-viewers.ts` automatically. It verifies each archive against the pinned SHA-256 in `shared/attachments/engines.ts`, rejects unsafe archive paths and extracts the engine and notices into ignored `apps/web/public/viewers/<engine>-<revision>-<bundle-hash>/`. Vite copies those files into the production build. Rust and a network connection are not required for this step.

Deploy the entire `apps/web/dist`, including `viewers/`. The nginx configuration serves versioned viewer directories as static assets with 404 for missing files. Startup validates each engine and retains previous revisions and notices on the existing persistent asset volume for active clients, as with hashed SPA assets. A missing engine file shows a retryable preview error. Engine JS/WASM is fetched only after a filename or View is selected; a fresh client downloads about 16–37 MB of uncompressed WASM for that format, plus its glue (transfer compression depends on the server). Browser caching reuses those versioned assets. This is not part of initial shell or route loading.

Engine upgrades are explicit dependency changes: review/pin an upstream revision and adapter, rebuild with its isolated Rust 1.95.0/wasm-bindgen 0.2.129 toolchain as described in the source snapshots, regenerate notices and provenance, replace the archive and SHA, then run the format/fidelity/isolation checks. Never silently download the latest engine during a normal build. Updating only adapter source does not update the compiled archive.

## File access and isolation

- Record URLs accept only valid HTTP(S) file links without embedded credentials; local Blob sources are supplied by internal code. Oryx backend links at `/api/v1/file/...` use the existing same-origin API proxy, avoiding the backend resolver's hardcoded HTTP URL on an HTTPS site. Existing signed MinIO URLs are preserved exactly.
- Public file-link and local-engine fetches use `credentials: omit`, no authorization header and no referrer. The existing file GET controller is anonymous; this change does not create a new access bypass, alter permissions, or expose MinIO access keys. Parent record routes remain permission-guarded. If private-file authorization is added to that controller, this transport must be updated to match it.
- Parsing runs in a dedicated module worker with a 15-second timeout. Streams are bounded even without reliable Content-Length. The file limit is 16 MiB, ZIP expansion 64 MiB/2000 parts, XLSX 64 sheets/250,000 cells, PDF 500 pages/30,000 indirect objects. Malformed XML, entities, unsafe paths, format confusion, executable embeddings, macros and external data relationships are rejected.
- Each renderer is an opaque-origin iframe with only `allow-scripts`. It has no same-origin, forms, top-level navigation, popup, download, camera, microphone or clipboard privileges. Its CSP denies network, nested frames and objects, and grants only nonced host/glue execution plus WASM compilation. No global Electron/CSP security setting is weakened.
- The bridge accepts initialization once, from the exact parent origin/window with a per-preview channel. Only the assigned bytes, name and pinned WASM bytes enter the frame. The URL, cookies, bearer token, MinIO credentials and Oryx native bridge do not. Parent messages require the current frame, opaque origin and matching channel. PDF document JavaScript remains disabled by the pinned engine.
- Loading or rendering failures stay inside the viewer with retry when applicable. Retrying creates a new isolated preview. A save or dirty report is an invariant failure: the host shows an error and disposes of the frame. It never marks the attachment as saved.

## Verification and remaining acceptance

Focused tests cover generated PDF/DOCX/XLSX bytes, original-byte preservation, malicious/unsupported packages, expansion and streaming limits, assigned-file messaging, save rejection, credential omission, cancellation/retry and attachment UI interactions. Relevant purchase-order, QC/form and approval regressions are included.

A subsequent read-only shipment audit verified the exact reported PDF with the real isolated PDFCraft engine in a local browser; see [attachment-audit.md](attachment-audit.md). Other document formats, visual checks at Windows scaling and installed Windows acceptance remain unverified. Unit tests use jsdom and a simulated frame. The reported PDF was downloaded solely for local verification; no document or server record was changed and no deployment was performed.

Final local checks are recorded in [workflows.md](workflows.md). Coverage includes filename/keyboard activation, unsupported formats, local files and object URL cleanup, form preservation, approval/supplier entry points, protected-version audit/authentication/refusal, cancellation and retry. The build includes strict TypeScript checking. These checks do not substitute for the pending real GPU/visual and installed-client acceptance noted above.

## Local desktop verification and file-viewing behavior

At the user's request, the running desktop was switched to `http://127.0.0.1:5173/`. The attached `009 Xzole susp.docx` rendered visibly inside the actual Electron app. The viewer displays the stored attachment bytes; the redundant **Open original** action was removed across all callers. Unsupported formats and validation/load errors no longer direct users to an unavailable external action. Explicit download/export actions elsewhere remain unchanged. Local file/source bytes are never replaced or saved by viewing.

## Enforced read-only components

The earlier capability review identified that save rejection alone did not prevent temporary editing. The replacement `readonly-v1` builds enforce viewing inside each Rust/WASM engine:

- **WordCraft:** command allowlist for selection, search and zoom; the UI also refuses editor/dialog commands. Canvas keyboard handling accepts only navigation/selection, and pointer handling skips object/table manipulation, content-control changes, ink and edit menus. The original paginated renderer remains in use.
- **GridCraft:** command allowlist for cell selection, sheet activation, search and zoom. Cell editing and paste entry points return immediately; the grid retains its renderer, scrolling and selection while bypassing fill/resize/drawing/filter/edit menus and cell editors. Only visible sheet tabs appear. Zoom and sheet activation change viewing state without marking a workbook dirty.
- **PDFCraft:** the host sets the policy before opening bytes, disables document JavaScript and discards the editable COS model after extracting display/form/signature information. Edit, form-value changes, undo/redo, save and signing-result adoption are refused. The canvas disables form filling, annotations and modification; only navigation, zoom, find and selection remain. PDF source bytes are preserved.

Viewer-only adapters provide no save callbacks, autosave or checkpoint modules. Reading layouts alone are not the lock: the command policy and disabled editing paths enforce it. Host save rejection and opaque-origin/network isolation remain separate safeguards. The UI says **Read-only attachment**; there is no separate Open original action.

## Rebuilding an engine

Normal web builds need only the checked-in verified ZIPs. For an engine rebuild, install Rust **1.95.0** with `wasm32-unknown-unknown` and `wasm-bindgen-cli` **0.2.129**. In a separate disposable build directory, provide clean `<engine>-source` Git checkouts at the revisions above. Then run `bun scripts/build-readonly-viewers.ts /absolute/build-directory <engine>`. Custom toolchain/cache locations can be supplied through `RUSTUP_HOME`, `CARGO_HOME` and `PATH`.

The script verifies each source revision and clean tree, applies the reviewed inherited and `readonly-*.patch` files, uses the archive's Cargo lock and builds a viewer-only adapter. Output is `<engine>-host/vendor.bundle.zip`; the application repository is not overwritten by this rebuild command. Review the generated JS/WASM, preserve all licenses/notices, update archive/artifact/patch hashes in provenance and `engines.ts`, then run bundle, policy, attachment and build checks. Every archive contains a canonical `read-only.json` declaration. Asset preparation refuses bundles without that declaration. Asset URLs include the archive hash so changed adapters never reuse an immutable cached editor.

Rust policy regressions are included in the patches: Word/Grid test refused content/file/undo commands and permitted viewing commands; PDF tests original bytes and form values after refused edits/saves. The build verification compares the patch-applied clean source with the compiled source. Desktop rendering and keyboard checks are recorded below.

## Read-only verification (2026-10-20)

All three replacement WASM engines rendered synthetic PDF, DOCX and XLSX files in both the local browser and the actual packaged Electron shell connected to `http://127.0.0.1:5173/`. In Electron, typing, paste, Backspace and Save shortcuts left the Word text, Excel cells and PDF form value unchanged. Excel also refused F2 editing. Word search selected the original text; Excel search and visible worksheet tabs worked; PDF Fit page changed the view without changing its form. The test page and public sample files were removed afterward. No files were uploaded and no ERP records were submitted.

Three native Rust engine policy regressions, six bundle/provenance/asset-boundary checks and 35 focused web regressions passed. The production web build, including strict TypeScript, passed. Reviewed patches applied cleanly to the pinned upstream checkouts and exactly reproduced the source compiled here. React Doctor's remaining three errors are existing form/formula issues outside this viewer change (`use-answer-form`, `useVariable`, `useVariableExtraction`); it reported no new error in the shared viewer host. Installed Windows and scaling acceptance remain pending. No deployment was performed.

Documentation updated: this guide, `attachment-audit.md`, `services.md`, `workflows.md` and the README viewer/rebuild overview.

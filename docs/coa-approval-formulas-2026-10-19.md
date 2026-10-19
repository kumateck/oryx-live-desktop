# COA and approval rendering — 2026-10-19

Compared `oryx-next`'s QA approval `ArdTemplateBody`, COA preview, `getResponsesForSection`, and formula viewers with the desktop routes. The desktop approval now uses the shared Next-derived specification summary and detailed worksheet. The COA uses compact results instead of embedding the detailed worksheet in the certificate table.

The shared reader handles JSON strings nested inside value envelopes and lowercase response input keys. It preserves authoritative governed results on every surface. Missing values no longer become an average of zero. Unsupported or unanswered variables produce an explicit unavailable result; the screenshot's empty `spltwt` is not replaced with a guessed input binding.

The issued commercial/routine COA page and print preview now format saved rich text and stored results. Historical snapshots holding input readings without a final result show that limitation and their recorded inputs. Their frozen data is not modified or recalculated against current configuration.

Validation covers the actual QA approval route and its COA dialog, the issued commercial certificate route and print preview, the material/product COA component, legacy wrappers/aliases, real zero versus missing results, missing sample-weight evidence, and governed results. Browser verification mounts the actual approval page with synthetic API responses and disables writes. No live result was approved or certificate generated. Production TypeScript/build and focused tests are run before delivery.

Documentation updated: `docs/pending-approvals-migration.md`, `docs/quality-migration.md`, and this note. API endpoints, setup commands, service responsibilities, approval transitions, formula arithmetic/bindings, permissions, and audit events did not change.

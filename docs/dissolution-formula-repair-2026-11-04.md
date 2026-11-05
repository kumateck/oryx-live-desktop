# Dissolution formula repair — 4 November 2026

The user confirmed this expression for question
`019b5052-0048-7c51-a365-42e93645fdc8` and requested repair of ATR
`01a1a8ad-8c32-7cd6-9862-456570ca67e1`:

```text
((:avgsamplepeakarea/:avgstandardpeakarea)*(:standardAvg/ :sampleAvg))*:purity
```

Applied at `2026-11-04T22:55:59.720464Z` to the configured demo database,
`164.90.142.68:5433/entrancedb`. The user selected Isaac A. Aidoo
(`ma-qc@entrancepharmaceuticals.com`,
`019bd60d-3453-751b-9eea-bc4e7a93e25c`) as the audit operator. The existing
transactional repair checked his active `CanEditQuestions` permission.

The [existing Dissolution recipe](../scripts/repairs/formula-config/recipes/atr-01a1886d-dissolution.json)
matched the live definition hash. It replaces `:stdconc` with `:standardAvg`
and `:splconc` with `:sampleAvg`, and removes the two obsolete manual-variable
labels. All other settings and the legacy JSON wrapping are preserved.

The question occurs in 242 field placements across 187 forms. Inspection and
the guarded apply found no saved answers to this question, no closed responses
using it, and no governance links. The linked ATR's open response
`01a1a8b8-36fc-7bce-aec2-562bb93601b9` has no Dissolution answer, so updating
the shared definition repairs its worksheet without changing entered data.

Verification after commit confirmed:

- Exact corrected expression and no other settings changes beyond the two labels.
- Definition SHA-256 changed from
  `f6857962804ae0a944d6e8a335b2e78280f9ce22c661a91b7f4c7c2b9a056682`
  to `f7ac29ef58df959449b96dbd4d2c74707eec463ad40234bccb059ab5c45f1198`.
- Audit repair `52c6cd91-f42d-409c-bcf4-cea644c10954` records Isaac, the
  reason, recipe, and exact before/after definitions; zero answer changes.
- ATR stage `1` and status `3` remain unchanged. The response remains unchecked,
  unapproved and unrejected. Hashes of both previously saved formula answers
  (Uniformity and Disintegration) remain unchanged.

Eight repair unit tests passed; the optional PostgreSQL integration test was
skipped because no isolated test database was configured. The live guarded
preview, apply and post-write verification succeeded. No application source
or deployment changed. The browser reached sign-in, so authenticated visual
acceptance remains: reload the linked test page after signing in, then enter
the actual Dissolution readings. No calculation, submission or approval was run.

Private before-state, preview, apply and verification evidence is stored under
`/Users/gigisiri/.codex/visualizations/2026/11/04/01a1a8bf-537e-7ea2-bb72-9a0db10ecd2e/outputs/formula-repair`.

See [formula configuration repairs](formula-config-repairs.md) for safeguards
and the preview/apply commands. This recipe now refuses replay because its
expected before-definition hash no longer matches.

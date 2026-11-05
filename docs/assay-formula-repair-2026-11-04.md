# Assay Dry powders formula repair — 4 November 2026

The user confirmed the following expression for question
`019af455-024a-76f0-823c-8ec2e065cbe2` on the same active ATR
`01a1a8ad-8c32-7cd6-9862-456570ca67e1`, including a separate `ml` input:

```text
(:sampleAvg/:standardAvg)*(:standardInput.wt/:sampleInput.wt)*(:wt/:ml*5*1000/:cl)*:purity
```

Applied at `2026-11-04T23:06:21.232665Z` to
`164.90.142.68:5433/entrancedb` under the user-selected audit operator
Isaac A. Aidoo (`019bd60d-3453-751b-9eea-bc4e7a93e25c`,
`ma-qc@entrancepharmaceuticals.com`). The guarded transaction rechecked his
active `CanEditQuestions` permission, the original definition hash, governance
links and response state before writing.

The [repair recipe](../scripts/repairs/formula-config/recipes/atr-01a1a8ad-assay-dry-powders.json)
sets the expression and adds manual-variable labels for `ml` and `purity`.
All other settings and legacy JSON wrapping are preserved. No numeric values
were supplied or invented. The question is shared by 207 forms; inspection
and apply found no saved answers or closed responses using it.

Post-write verification confirmed the exact expression, only the intended
settings changes, and audit record `fb7bfd2d-a2d4-4b84-b8f9-fef1c0db5410`.
Its stored before/after definitions match the private snapshots, and it records
zero answer changes. Definition SHA-256 changed from
`cd3f2557736c7b9d25f51110f319884ee86d5e941fc0869891d3c8cb7f73d1fa`
to `e3e1e2f78bb1782b6c69d8a8f7da15773ddc51b7bf9440cd0a84a07bea4f7179`.
The entire ATR row, response row and every saved answer row compare exactly
equal before and after. No submission, approval or live result calculation ran.

Eight repair unit tests passed; the optional isolated PostgreSQL integration
test was skipped. A synthetic check through the application's calculation
function confirmed that the selected expression resolves the separate weights
for both sample columns and produces the expected numerical results. The live
guarded preview, apply and post-write checks passed. Authenticated browser
verification was not performed; reload the linked ATR test after signing in.

Private before/after evidence and the apply report are in
`/Users/gigisiri/.codex/visualizations/2026/11/04/01a1a8bf-537e-7ea2-bb72-9a0db10ecd2e/outputs/formula-repair`
under the `assay-` filenames. See [formula configuration repairs](formula-config-repairs.md)
for the maintenance procedure and [the earlier Dissolution repair](dissolution-formula-repair-2026-11-04.md)
for the other question repaired on this ATR.

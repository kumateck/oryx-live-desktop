# Certificate of analysis: reading specification limits

When QC previews a product's certificate, each test is pre-marked Complies or Does not comply from its result and its specification (`shared/ard-view/raw-data/coa-compliance.ts`). The analyst confirms or changes every choice before generating the certificate.

## What the check understands (desktop #262, 17 November 2026)

| Specification | Rule |
| --- | --- |
| `NMT 120.0%`, `Not more than 2.0%`, `max 5`, `≤ 5`, `<= 5` | The result must not exceed the limit |
| `NLT 85%`, `Not less than 90.0%`, `min 1`, `≥ 1`, `>= 1` | The result must not fall below the limit |
| `NLT 90.0% and NMT 110.0%` | Both limits apply |
| `4.0 to 7.0`, `2 - 4` (no limit words) | The result must fall within the range |
| A result written as Complies / Does not comply | Taken as written |
| Anything else, such as a specification with no number | Marked "Review required: result cannot be assessed automatically" and left to the analyst |

Before this change, one-sided limits were not understood. They fell back to "Does not comply" with a review note, so the Amoximed assays (99.96 / 99.97 against NMT 120.0%, 91.68 / 90.15 against NLT 85%) showed as failing.

## Every sample counts

A formula with several samples (Sample 1, Sample 2, …) complies only when **every** sample's stored result meets the specification. Previously only the first sample was checked.

Results come from the stored, server-calculated values. A repaired field uses its recalculated result.

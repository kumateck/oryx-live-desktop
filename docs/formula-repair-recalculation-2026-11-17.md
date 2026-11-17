# Formula repair, recalculation and submission — 16–17 November 2026

What changed in repairing a test's formula, recalculating it and submitting the worksheet, found on ATR
`01a1cb57-d546-7a5c-98b3-6424818fd9c3` (Amoximed 125mg Suspension, bulk) on the testing server.

## Repair takes the approved revision

A repair loads the question's **approved, effective formula revision**, never the old definition or a hand-typed one.

- The approved revision always overrides what the test had: every structural change takes effect.
- The readings of the repaired fields are **cleared**, and the analyst enters them again. The repair evidence keeps the old readings.
- One repair fixes every field on the worksheet that uses the same question, for example both assay sections.

Backend: `QuestionFormulaRepairService` (`Context`, `Build`, `Apply`). Desktop: `modules/questions` repair form and `atr-formula-actions.tsx`.

## Recalculation works from what is saved

- Saving readings on a field that needs recalculation **recalculates it automatically**. The analyst does not press anything (desktop #248).
- Recalculation reads every input from the saved answer and replaces any earlier result. It stops only when an input truly has no value, and then names it: "Enter and save these readings, then recalculate: …" (backend #1848).
- Typed manual readings are sent as the **calculated number** (`evaluated`), as the normal formula runtime does. Before, the repair sent the text the analyst typed, which can be an expression such as `25 x 4` or carry separators, and the engine refused it (backend #1852).
- When the engine still refuses, the message names the reading, the value sent and the reason: missing, not a number, or divide by zero. It used to be one generic 409 (backend #1852).

## Simple formulas stored inside their expression

The question editor stores a Simple formula as `{"type":0,"expression":"<builder settings JSON>"}`.

The worksheet unwrapped this format, but the submit completeness check, on both the desktop and the server, did not. It read `:2`, `:false` and `:0` out of the JSON text as variables, so a filled and saved answer such as **pH of sample** `(:ph1+:ph2)/2` could never be submitted.

Both checks now merge the inner settings: desktop `evaluationSettings` (#258), backend `FormAnswerCompleteness.Unwrap` (#1855).

A formula with no sample or standard columns also no longer requires a readings table. That was already the server's rule (backend #1845, desktop #255).

## Repaired results become final on submission

A recalculated repair result shows "Stored authoritative draft result — not finalized" until the worksheet is submitted (backend #1858).

- On submission, `SubmitFormResponseFinal` records, in the new append-only table `LegacyFormulaRepairFinalizations`, which repair evaluation each repaired field's result came from.
- The result is then shown as final.
- A retried submission adds nothing.
- Worksheets submitted before this was deployed have no record and keep the "not finalized" note.
- The table has the same database triggers as the other repair tables, so rows can never be updated, deleted or truncated.
- Deploy with migration `20261117040009_AddLegacyFormulaRepairFinalizations`.

## Progress page

Section names are saved as rich text. The Test progress page now shows them formatted through the sanitised `RichTextView`, instead of raw HTML (desktop #263).

## Save and submit do everything (17 November 2026, later)

Found on ATR QCD/BP/26/0006 (Assay: Paracetamol) on the client server: Submit stayed disabled, and the field said "No readings are saved for this field yet" although the analyst had entered and saved every reading.

- **No separate recalculation step.** Saving a repaired field's readings recalculates it on the server in the same request. Submitting first recalculates any repaired field still pending, then finalizes every result. The **Recalculate saved readings** action and the "needs recalculation" warning are gone. Submission stops only when a reading the formula uses has no value, and it names that reading.
- **Only the inputs the worksheet shows are required.** The approved Paracetamol revision still lists a standard Weight input in its settings, with standard inputs switched off, so the worksheet never shows that box. The completeness check on both the desktop and the server required it anyway, so the answer could never be complete. A standard input now counts only when standard inputs are on and in the table, and a sample input only when sample inputs are on.
- **The save writes the answer the server reads.** A response can hold more than one answer row for a field, because there is no unique index. The draft save updated the first row it found, while recalculation, submission and the worksheet read the newest row, which the repair had emptied. The save now writes the newest row.

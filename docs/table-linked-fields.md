# Table questions: linked fields

Date: 2026-11-27.

A table cell can be a **Linked field**. It shows a property of the record chosen in another cell of the same row, and the analyst never types it.

Example: a "Reagents used" table. Column 1 is a choice from the *Reagents* record list, and column 2 is a linked field that shows the reagent's code. When the analyst picks "Soyabean-Casein Digest Agar", column 2 fills in with `QCD/RGT/SCDA-013`. It changes when the choice changes and clears when the choice is cleared.

## Setting it up (Settings → Questions → table question → configure a cell)

| Setting | Value |
| --- | --- |
| Cell type | Linked field |
| Source cell | A column of the same row whose cell is a choice from a record list (only those are offered) |
| Record property | Code or Name |
| Apply to | This cell, a range of rows or the whole column. The source is a column, so every row follows its own source cell. |

If the row has no record-list cell yet, the dialog asks for one first.

## Behaviour

- The value is stored in the answer like any other cell, so prints, approvals and read-back tables show it.
- The cell is read only and shown with a dashed border and the placeholder "Automatic".
- It is not a required cell. The server's completeness check requires only text-input and choice cells, and the linked cell follows its source.
- **Record list labels:**
  - Both record lists read the QC equipment list.
  - *QC equipment* options show the equipment ID, as before.
  - *Reagents* options now show the reagent's name with its code ("Soyabean-Casein Digest Agar (QCD/RGT/SCDA-013)").
- The source cell still stores the record's id, as before. Use a linked **Name** column where the read-back should show the name.

## Code

- `shared/questions/table-question.ts`: the `linked` cell type, `linkSource` / `linkProperty`, `withLinkedValues` and `linkSourceColumns`.
- `shared/questions/use-record-options.ts`: one stable loader per record list, and a lookup of records offered.
- `shared/questions/cell-config-dialog.tsx` and `table-grid.tsx`: the configuration and the read-only cell.

No backend or contract change.

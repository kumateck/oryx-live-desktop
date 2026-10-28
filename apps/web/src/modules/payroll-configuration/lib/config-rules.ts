import type { ConfigCommand, PayGrade, TaxBand, PensionRate } from "../schemas/contracts";
const periodOverlaps = (a: TaxBand, b: TaxBand): boolean =>
  Date.parse(a.effectiveFrom) < (b.effectiveTo ? Date.parse(b.effectiveTo) : Infinity) &&
  Date.parse(b.effectiveFrom) < (a.effectiveTo ? Date.parse(a.effectiveTo) : Infinity);
export function newGradeProblem(body: Extract<ConfigCommand, { kind: "grade" }>, rows: readonly PayGrade[]): string | null {
  return rows.some((row) => row.id !== body.id && row.name.trim().toLocaleLowerCase() === body.body.name.trim().toLocaleLowerCase())
    ? "A pay grade with this name already exists. Review that grade instead."
    : null;
}
export function newBandProblem(body: Extract<ConfigCommand, { kind: "band" }>, rows: readonly TaxBand[]): string | null {
  const candidate: TaxBand = { id: "new", ...body.body };
  return rows.some(
    (row) => periodOverlaps(row, candidate) && row.lowerBound < (candidate.upperBound ?? Infinity) && candidate.lowerBound < (row.upperBound ?? Infinity),
  )
    ? "This band overlaps an existing income range during the same effective period. The server can charge both bands. Review and reconcile the schedule before adding it."
    : null;
}
export function newPensionProblem(body: Extract<ConfigCommand, { kind: "pension" }>, rows: readonly PensionRate[]): string | null {
  return rows.some((row) => Date.parse(row.effectiveFrom) === Date.parse(body.body.effectiveFrom))
    ? "A SSNIT rate with this effective start already exists; the server cannot choose between equal start dates reliably."
    : null;
}

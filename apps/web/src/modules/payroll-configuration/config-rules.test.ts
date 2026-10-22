import { expect, it } from "vitest";
import { bandEditorSchema, gradeEditorSchema, pensionEditorSchema, bandCommand, gradeCommand } from "./schemas/editor-schema";
import { gradesSchema, bandsSchema } from "./schemas/contracts";
import { newBandProblem, newPensionProblem } from "./lib/config-rules";
const id = "258da105-a506-44a9-8ff5-8d005a54f294";
it("preserves zero rates and junior level while requiring an ordered salary range", () => {
  const values = { name: "Junior", minSalary: 0, maxSalary: 100, level: { value: "0" as const, label: "Junior" } };
  expect(gradeEditorSchema.safeParse(values).success).toBe(true);
  expect(gradeCommand(values, null)).toMatchObject({ body: { level: 0, minSalary: 0 } });
  expect(gradeEditorSchema.safeParse({ ...values, minSalary: 101 }).success).toBe(false);
});
it("keeps a blank band ceiling null and treats an explicit zero as a real invalid upper bound", () => {
  const values = { lowerBound: 0, upperBound: null, rate: 0, from: new Date(2026, 0, 1), to: null };
  expect(bandEditorSchema.safeParse(values).success).toBe(true);
  expect(bandEditorSchema.parse({ ...values, upperBound: Number.NaN }).upperBound).toBeNull();
  expect(bandCommand(values)).toMatchObject({ body: { upperBound: null, rate: 0 } });
  expect(bandEditorSchema.safeParse({ ...values, upperBound: 0 }).success).toBe(false);
  expect(pensionEditorSchema.safeParse({ employeeRate: 0, employerRate: 0, tier2Rate: 0, ceiling: 0, from: values.from, to: null }).success).toBe(true);
});
it("accepts server-local ISO timestamps but rejects duplicate row identities", () => {
  const row = { id, name: "Junior", minSalary: 0, maxSalary: 100, level: 0 };
  expect(gradesSchema.safeParse([row, row]).success).toBe(false);
  expect(bandsSchema.safeParse([{ id, lowerBound: 0, upperBound: null, rate: 0, effectiveFrom: "2026-01-01T00:00:00", effectiveTo: null }]).success).toBe(true);
});
it("refuses overlapping tax bands but permits adjacent brackets or separate effective periods", () => {
  const existing = { id, lowerBound: 0, upperBound: 100, rate: 0, effectiveFrom: "2026-01-01T00:00:00Z", effectiveTo: null };
  const command = { kind: "band" as const, body: { lowerBound: 50, upperBound: 150, rate: 5, effectiveFrom: existing.effectiveFrom, effectiveTo: null } };
  expect(newBandProblem(command, [existing])).toContain("overlaps");
  expect(newBandProblem({ ...command, body: { ...command.body, lowerBound: 100 } }, [existing])).toBeNull();
  expect(newBandProblem(command, [{ ...existing, effectiveTo: "2025-12-31T00:00:00Z" }])).toBeNull();
});
it("rejects ambiguous SSNIT rates with equal effective starts", () => {
  const body = { employeeRate: 1, employerRate: 2, tier2Rate: 1, insurableEarningsCeiling: 100, effectiveFrom: "2026-01-01T00:00:00Z", effectiveTo: null };
  expect(newPensionProblem({ kind: "pension", body }, [{ id, ...body }])).not.toBeNull();
});

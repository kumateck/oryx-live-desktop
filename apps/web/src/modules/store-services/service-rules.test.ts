import { expect, it } from "vitest";
import { serviceEditorSchema } from "./schemas/editor";
import { service } from "./service-fixture";
import { serviceNamingProblem, readServiceRegister } from "@/shared/services/read-register";
const values = { name: service.name, code: service.code ?? "", start: new Date("2026-10-01"), end: new Date("2027-10-01"), description: "", files: [] };
it("validates service periods and accepted attachment types", () => {
  expect(serviceEditorSchema.safeParse(values).success).toBe(true);
  expect(serviceEditorSchema.safeParse({ ...values, end: new Date("2026-09-30") }).success).toBe(false);
  expect(serviceEditorSchema.safeParse({ ...values, files: [new File(["executable"], "bad.exe")] }).success).toBe(false);
});
it("rejects duplicate names or codes across active and inactive services", () => {
  expect(serviceNamingProblem([service], service.name, "other")).toMatch(/already/);
  expect(serviceNamingProblem([service], "Other", service.code ?? "")).toMatch(/already/);
  expect(serviceNamingProblem([service], service.name, service.code ?? "", service.id)).toBeNull();
});
it("reads both status partitions without relying on the endpoint default of active-only", async () => {
  const calls: boolean[] = [];
  const result = await readServiceRegister(async (active) => {
    calls.push(active);
    return { data: active ? [service] : [], pageIndex: 1, pageCount: 1, totalRecordCount: active ? 1 : 0 };
  }, new AbortController().signal);
  expect(calls).toEqual([true, false]);
  expect(result).toEqual([service]);
});
it("refuses cross-status and partial register responses", async () => {
  await expect(
    readServiceRegister(async () => ({ data: [service], pageIndex: 1, pageCount: 1, totalRecordCount: 1 }), new AbortController().signal),
  ).rejects.toThrow(/status/);
  await expect(readServiceRegister(async () => ({ data: [] }), new AbortController().signal)).rejects.toBeInstanceOf(Error);
});

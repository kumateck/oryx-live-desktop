import { expect, it } from "vitest";
import { absentFinalPacking } from "./packing-record-absence";

it("recognizes only an absent final-packing record, preserving authorization, server and other validation failures", () => {
  expect(absentFinalPacking({ status: 404, data: null })).toBe(true);
  expect(absentFinalPacking({ status: 400, data: { errors: [{ code: "Error.NullValue" }] } })).toBe(true);
  for (const status of [401, 403, 409, 500]) expect(absentFinalPacking({ status, data: { errors: [{ code: "Error.NullValue" }] } })).toBe(false);
  expect(absentFinalPacking({ status: 400, data: { errors: [{ code: "Packing.Invalid" }] } })).toBe(false);
  expect(absentFinalPacking({ status: 400, data: { errors: [{ code: "Error.NullValue" }, { code: "Packing.Invalid" }] } })).toBe(false);
  expect(absentFinalPacking({ status: "FETCH_ERROR", error: "Offline" })).toBe(false);
});

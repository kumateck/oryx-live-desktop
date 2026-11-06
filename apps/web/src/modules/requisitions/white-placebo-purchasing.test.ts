import { expect, it } from "vitest";
import { pickRowsSchema } from "./schemas/requisition-schema";

it("keeps White Placebo out of purchase choices while preserving ordinary material choices", () => {
  const placebo = { material: { id: "white-placebo", name: "White Placebo", isWhitePlacebo: true } };
  const ordinary = { material: { id: "excipient", name: "Excipient", isWhitePlacebo: false } };
  expect(pickRowsSchema.parse([placebo, ordinary]).map((row) => row.id)).toEqual(["excipient"]);
});

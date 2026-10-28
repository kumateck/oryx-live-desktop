import { expect, it } from "vitest";
import { addTags } from "./add-tags";

it("keeps an endpoint's generated tags and adds the module's own, whether either is a list or a function", () => {
  const generated = (_result: number | undefined, _error: string | undefined, arg: string) => [{ type: "warehouse/grn" as const, id: arg }];
  const merged = addTags<"warehouse/grn" | "QcGrns", number, string, string, undefined>(generated, [{ type: "QcGrns", id: "all" }]);
  expect(typeof merged === "function" ? merged(1, undefined, "g-1", undefined) : merged).toEqual([{ type: "warehouse/grn", id: "g-1" }, { type: "QcGrns", id: "all" }]);
  const extraOnly = addTags<"QcGrns", number, string, string, undefined>(undefined, [{ type: "QcGrns", id: "all" }]);
  expect(extraOnly).toEqual([{ type: "QcGrns", id: "all" }]);
});

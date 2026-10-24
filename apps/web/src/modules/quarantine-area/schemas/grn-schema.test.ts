import { expect, it } from "vitest";
import { grnSchema, grnRowsSchema } from "./grn-schema";
import { grnFixture, ids } from "../lib/distribution-fixtures";
import { approvedMaterials, distributionPlan } from "../lib/distribution-plan";

function parse(fixture: object) {
  const grn = grnSchema.parse(fixture);
  if (!grn) throw new Error("Expected a GRN");
  return grn;
}

it.each([0, 1])("resolves kind %s from the matching checklist with CollectionItemDto batch materials", (kind) => {
  const fixture = grnFixture(8, kind);
  expect(fixture.materialBatches[0]?.material).not.toHaveProperty("kind");
  const grn = parse(fixture);
  expect(grn.batches.map((batch) => batch.materialKind)).toEqual([kind, kind]);
  expect(approvedMaterials(grn, kind === 0 ? 0 : 1)).toHaveLength(1);
  expect(distributionPlan(grn, ids.material, kind === 0 ? 0 : 1).problem).toBeNull();
  expect(grnRowsSchema.parse([fixture])[0]?.batches[0]?.materialKind).toBe(kind);
});

it("matches checklists by material id, including case differences, rather than their order", () => {
  const fixture = grnFixture();
  const list = fixture.checkLists[0];
  if (!list) throw new Error("Expected checklist");
  const mixed = { ...fixture, materialBatches: fixture.materialBatches.map((batch) => ({ ...batch,
    material: { ...batch.material, id: "ABCDEFAB-1234-4234-8234-ABCDEFABCDEF" },
  })), checkLists: [list, { ...list, material: { ...list.material, id: "abcdefab-1234-4234-8234-abcdefabcdef", kind: 1 } }] };
  expect(parse(mixed).batches.map((batch) => batch.materialKind)).toEqual([1, 1]);
});

it("never infers the material kind from a missing or unrelated checklist", () => {
  const fixture = grnFixture();
  expect(parse({ ...fixture, checkLists: [] }).batches[0]?.materialKind).toBeNull();
  const unrelated = { ...fixture, checkLists: fixture.checkLists.map((list) => ({ ...list,
    material: { ...list.material, id: "22222222-2222-4222-8222-222222222223" },
  })) };
  expect(approvedMaterials(parse(unrelated), 0)).toEqual([]);
});

it("accepts repeated matching evidence and refuses contradictory material kinds", () => {
  const fixture = grnFixture();
  const list = fixture.checkLists[0];
  if (!list) throw new Error("Expected checklist");
  expect(parse({ ...fixture, checkLists: [list, list] }).batches[0]?.materialKind).toBe(0);
  const conflicting = { ...fixture, checkLists: [list, { ...list, material: { ...list.material, kind: 1 } }] };
  expect(approvedMaterials(parse(conflicting), 0)).toEqual([]);
  expect(approvedMaterials(parse(conflicting), 1)).toEqual([]);
  const richer = { ...fixture, materialBatches: fixture.materialBatches.map((batch) => ({ ...batch,
    material: { ...batch.material, kind: 1 },
  })) };
  expect(parse(richer).batches.every((batch) => batch.materialKind === null)).toBe(true);
});

it("retains an explicit batch kind for compatible richer responses and rejects unsupported checklist kinds", () => {
  const fixture = grnFixture();
  const richer = { ...fixture, checkLists: [], materialBatches: fixture.materialBatches.map((batch) => ({ ...batch,
    material: { ...batch.material, kind: 1 },
  })) };
  expect(parse(richer).batches.map((batch) => batch.materialKind)).toEqual([1, 1]);
  expect(approvedMaterials(parse(grnFixture(8, 99)), 0)).toEqual([]);
});

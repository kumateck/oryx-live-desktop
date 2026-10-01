import { expect, it } from "vitest";
import { formatDate } from "@/shared/format/dates";
import { sentenceCase } from "@/shared/format/words";
import { ardListSchema, productDetailSchema, routeListSchema, stpListSchema } from "../schemas/product-detail-schema";
import { batchQuantity, operationActionLabel, packageTotal, testStageLabel } from "./product-detail";

it("scales a material to a full batch and refuses to divide by a missing composition size", () => {
  expect(batchQuantity(250, 5, 3000)).toBe(150000);
  expect(batchQuantity(250, 0, 3000)).toBeNull();
  expect(batchQuantity(250, null, 3000)).toBeNull();
  expect(batchQuantity(null, 5, 3000)).toBeNull();
});

it("labels stages and actions, and totals packaging quantities", () => {
  expect(testStageLabel(1)).toBe("Bulk");
  expect(testStageLabel(9)).toBeNull();
  expect(operationActionLabel(0)).toBe("BMR and BPR requisition or issue");
  expect(operationActionLabel(7)).toBe("Analytical test request");
  expect(operationActionLabel(null)).toBeNull();
  expect(packageTotal(100, 5)).toBe(105);
  expect(packageTotal(100, null)).toBe(100);
  expect(packageTotal(null, null)).toBeNull();
  expect(sentenceCase("FullReturn")).toBe("Full return");
});

it("treats the backend's unset date as no date", () => {
  expect(formatDate("0001-01-01T00:00:00")).toBeNull();
  expect(formatDate("not a date")).toBeNull();
  expect(formatDate("2026-10-02T09:00:00Z")).toContain("2026");
});

it("reads a product with missing sections without failing", () => {
  const product = productDetailSchema.parse({ id: "658da105-a506-44a9-8ff5-8d005a54f294", name: " Wormee ", baseQuantity: 5, baseUoM: { symbol: "ml" },
    currentBillOfMaterial: { version: 2, isActive: true, billOfMaterial: { items: [{ order: 1, material: { name: "Sugar", code: "RM-1" }, baseQuantity: 2, baseUoM: { symbol: "g" } }] } },
    outdatedBillOfMaterials: null, packages: null });
  expect(product.name).toBe("Wormee");
  expect(product.currentBillOfMaterial?.items[0]?.material?.code).toBe("RM-1");
  expect(product.outdatedBillOfMaterials).toEqual([]);
  expect(product.packings).toEqual([]);
  expect(product.equipment).toBeNull();
});

it("orders procedure steps and merges responsible users and roles", () => {
  const routes = routeListSchema.parse([
    { id: "758da105-a506-44a9-8ff5-8d005a54f294", order: 2, operation: { name: "Filling" }, workCenters: [{ workCenter: { name: "Line 1" } }],
      responsibleRoles: [{ role: { name: "Operator" }, action: 4 }] },
    { id: "858da105-a506-44a9-8ff5-8d005a54f294", order: 1, operation: { name: "Mixing" }, isCritical: true,
      responsibleUsers: [{ user: { name: "Ada" }, action: 7, productAnalyticalRawData: { productStandardTestProcedure: { stpNumber: "STP-9" } } }] },
  ]);
  expect(routes.map((route) => route.operation)).toEqual(["Mixing", "Filling"]);
  expect(routes[0]?.personnel).toEqual([{ kind: "user", name: "Ada", action: 7, stpNumber: "STP-9" }]);
  expect(routes[1]?.workCenters).toEqual(["Line 1"]);
});

it("accepts one STP, a list, or nothing, and finds an ARD's STP number", () => {
  const stp = { id: "958da105-a506-44a9-8ff5-8d005a54f294", stpNumber: "STP-1", createdBy: { firstName: "Ada", lastName: "Mensah" } };
  expect(stpListSchema.parse(stp)).toHaveLength(1);
  expect(stpListSchema.parse(null)).toEqual([]);
  expect(stpListSchema.parse([stp])[0]?.createdBy).toBe("Ada Mensah");
  expect(ardListSchema.parse([{ id: stp.id, stage: 2, productStandardTestProcedure: { stpNumber: "STP-1" } }])[0]?.stpNumber).toBe("STP-1");
});

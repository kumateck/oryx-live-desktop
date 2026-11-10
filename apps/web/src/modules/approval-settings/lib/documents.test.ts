import { describe, expect, it } from "vitest";
import { approvalDocumentLabel, approvalDocuments, documentOptions } from "./documents";

describe("approval documents", () => {
  // The backend refuses to raise these until an approval with required stages is configured for them.
  it.each([
    ["ShipmentDiscrepancy", "Shipment Discrepancy"],
    ["StockDiscrepancy", "Stock Discrepancy"],
    ["QcMaterialRetest", "QC Material Retest"],
    ["Response", "Test results (Response)"],
  ])("offers %s for configuration", (value, label) => {
    expect(approvalDocuments.map((option) => option.value)).toContain(value);
    expect(approvalDocumentLabel(value)).toBe(label);
  });
});

it("keeps legacy names visible on saved workflows without offering them for new workflows", () => {
  expect(approvalDocuments.some((item) => item.value === "ResponseMaterial")).toBe(false);
  expect(documentOptions("ResponseMaterial").find((item) => item.value === "ResponseMaterial")?.label).toContain("(legacy)");
});

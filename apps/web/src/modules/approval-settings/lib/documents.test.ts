import { describe, expect, it } from "vitest";
import { approvalDocumentLabel, approvalDocuments } from "./documents";

describe("approval documents", () => {
  // The backend refuses to raise these until an approval with required stages is configured for them.
  it.each([
    ["ShipmentDiscrepancy", "Shipment Discrepancy"],
    ["StockDiscrepancy", "Stock Discrepancy"],
    ["QcMaterialRetest", "QC Material Retest"],
  ])("offers %s for configuration", (value, label) => {
    expect(approvalDocuments.map((option) => option.value)).toContain(value);
    expect(approvalDocumentLabel(value)).toBe(label);
  });
});

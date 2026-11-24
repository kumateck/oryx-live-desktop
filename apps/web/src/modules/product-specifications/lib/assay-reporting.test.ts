import { expect, it } from "vitest";
import { assayRows, replaceAssayRule, type AssayConfiguration } from "./assay-reporting";

const configuration: AssayConfiguration = { specificationId: "spec-a", productId: "product-a", productName: "Product A", testStage: 2,
  specificationNumber: "SHARED", token: "token", rules: [], fields: ["field-a", "field-b"].map(formFieldId => ({
    formFieldId, testName: "Assay", label: "Average content", specification: "2.32–2.52% w/v", definitionHash: "definition",
    outputs: [{ key: "average", label: "Average" }, { key: "secondary", label: "Secondary active" }],
  })) };
it("identifies same-named assays and multiple outputs independently", () => {
  const rows = assayRows(configuration);
  expect(new Set(rows.map(row => row.key)).size).toBe(4);
  const first = rows[0];
  if (!first) throw new Error("Expected an assay output.");
  const rules = replaceAssayRule(configuration, first, { enabled: true, nominalConcentration: 2.4, minimum: 2.32, maximum: 2.52, decimalPlaces: 4, reason: "Approved basis" });
  expect(rules).toMatchObject([{ formFieldId: "field-a", resultKey: "average", nominalConcentration: 2.4 }]);
  expect(assayRows({ ...configuration, rules }).filter(row => row.rule).map(row => row.key)).toEqual(["field-a:average"]);
  expect(replaceAssayRule({ ...configuration, rules }, first, { enabled: false, nominalConcentration: 2.4, minimum: 2.32, maximum: 2.52, decimalPlaces: 4, reason: "Retain original basis" })).toEqual([]);
});
it("keeps removed outputs visible so stale rules can be disabled", () => {
  const rows = assayRows({ ...configuration, fields: [], rules: [{ formFieldId: "old-field", resultKey: "old-output", definitionHash: "old", nominalConcentration: 2.4,
    minimum: 2.32, maximum: 2.52, decimalPlaces: 4 }] });
  expect(rows).toHaveLength(1);
  expect(rows[0]?.unavailable).toMatch(/no longer/);
  expect(rows[0]?.rule).not.toBeNull();
});

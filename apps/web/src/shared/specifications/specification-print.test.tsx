// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { formatDate } from "@/shared/format/dates";
import { SpecificationPrint } from "./specification-print";
import { specificationSchema } from "./specification-schema";

afterEach(cleanup);

const specification = specificationSchema.parse({
  id: "s1", specificationNumber: "NMP/B/SPC/144", revisionNumber: "03", supersedesNumber: "02", reference: "In House", description: null,
  effectiveDate: "2026-11-10T00:00:00Z", reviewDate: "2029-11-10T00:00:00Z", dueDate: "2026-06-11T00:00:00Z", createdAt: "2026-06-10T16:41:00Z",
  isVerified: false, testStage: 1, form: { id: "f1", name: "VITAL X SYRUP - Bulk" }, createdBy: { firstName: "Winfred", lastName: "Gadah", department: { name: "Quality Assurance" } },
  product: { id: "p1", name: "Vital-X Syrup", code: "NL-037" },
});

it("heads a product specification like the master copy and lists one row per revision", () => {
  render(<SpecificationPrint title="Product specification" kind="product" specification={specification} sections={[]} history={{
    revisedBy: "Winfred Gadah", revisedAt: "2026-11-12T15:12:00Z", historyAvailableFrom: null,
    revisions: [{ specificationNumber: "NMP/B/SPC/144", revisionNumber: "03", supersedesNumber: "02", recordedBy: "Winfred Gadah",
      occurredAt: "2026-11-12T15:12:00Z", event: "Revised", reason: "Folic acid assay added.", effectiveDate: "2026-11-10T00:00:00Z" }],
  }} />);

  // The master copy's bordered header: five rows, the product name and code merged down the middle.
  const header = screen.getByRole("table", { name: "Specification header" });
  const rows = [...header.querySelectorAll("tr")].map((row) => [...row.querySelectorAll("td")].map((cell) => cell.textContent));
  expect(rows).toEqual([
    ["Quality Assurance Department"],
    ["Bulk Product Specification"],
    ["Specification No.: NMP/B/SPC/144", "Vital-X Syrup(NL-037)", ""],
    ["Revision No.: 03", `Effective Date: ${formatDate("2026-11-10T00:00:00Z") ?? ""}`],
    ["Supersedes: 02", `Review Date: ${formatDate("2029-11-10T00:00:00Z") ?? ""}`],
  ]);
  expect(header.querySelector("td[rowspan='3']")?.textContent).toBe("Vital-X Syrup(NL-037)");
  const history = within(screen.getByRole("table", { name: "Revision History" }));
  expect(history.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["1", "03", formatDate("2026-11-10T00:00:00Z"), "Folic acid assay added."]);
});

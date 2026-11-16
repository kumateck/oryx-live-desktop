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
  isVerified: false, testStage: 1, form: { id: "f1", name: "VITAL X SYRUP - Bulk" }, createdBy: { firstName: "Winfred", lastName: "Gadah" },
  product: { id: "p1", name: "Vital-X Syrup", code: "NL-037" },
});

it("heads a product specification with its number, revision, product, stage and dates, and lists one row per revision", () => {
  render(<SpecificationPrint title="Product specification" subject="Product" specification={specification} sections={[]} history={{
    revisedBy: "Winfred Gadah", revisedAt: "2026-11-12T15:12:00Z", historyAvailableFrom: null,
    revisions: [{ specificationNumber: "NMP/B/SPC/144", revisionNumber: "03", supersedesNumber: "02", recordedBy: "Winfred Gadah",
      occurredAt: "2026-11-12T15:12:00Z", event: "Revised", reason: "Folic acid assay added.", effectiveDate: "2026-11-10T00:00:00Z" }],
  }} />);

  const header = [...document.querySelectorAll(".print-facts dt")].map((term) => term.textContent);
  expect(header).toEqual(["Spec No.", "Revision No.", "Supersedes", "Product", "Product Code", "Stage", "Effective Date", "Review Date"]);
  expect(screen.getByText("Bulk")).toBeTruthy();
  expect(screen.getByText("NL-037")).toBeTruthy();
  const history = within(screen.getByRole("table", { name: "Revision History" }));
  expect(history.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["1", "03", formatDate("2026-11-10T00:00:00Z"), "Folic acid assay added."]);
});

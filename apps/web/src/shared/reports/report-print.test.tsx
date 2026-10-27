import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { reportCatalog } from "@/modules/reports/lib/catalog";
import { ReportPrint } from "./report-print";

it("prints every report section and column group, including the final row, applied filters and warnings", () => {
  const output = renderToStaticMarkup(<ReportPrint book={{ title: "Reports", generatedAt: "2026-10-27T12:00:00Z", filters: [{ label: "Category", value: "Excipient, Solvent" }], warnings: ["Recorded state as of 2026-10-26"],
    sheets: reportCatalog.map((definition) => ({ name: definition.title, columns: ["A", "B", "C", "D", "E", "F", "Final field"], rows: Array.from({ length: 31 }, (_, row) => ({ id: String(row), cells: [0, false, null, "Long material name", 1, 2, `LAST:${definition.key}:${row}`] })) })),
  }} />);
  for (const definition of reportCatalog) expect(output).toContain(`LAST:${definition.key}:30`);
  expect(output).toContain("Category: Excipient, Solvent"); expect(output).toContain("Recorded state as of 2026-10-26");
  expect(output).toContain("Final field"); expect(output).toContain(">0</td>"); expect(output).toContain(">No</td>"); expect(output).toContain(">–</td>");
});

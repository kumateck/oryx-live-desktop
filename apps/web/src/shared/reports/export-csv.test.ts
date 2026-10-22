import { expect, it } from "vitest";
import { reportCsv } from "./export-csv";
it("keeps CSV zero and boolean values, escapes quotes/newlines and protects formula-like text", () => {
  const csv = reportCsv({ name: "Rows", columns: ["Text", "Zero", "Missing", "False"], rows: [{ id: "0", cells: ['=HYPERLINK("url")', 0, null, false] }, { id: "1", cells: ['line 1\nline 2', -2, "value,quoted", true] }] });
  expect(csv).toContain("\"'=HYPERLINK(\"\"url\"\")\",\"0\",\"\",\"false\"");
  expect(csv).toContain('"line 1\nline 2","-2","value,quoted","true"');
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderTablePreview } from "./raw-data/print/question-renderers/table-preview";
import { TableReadOnly } from "@/shared/questions/table-read-only";
import { TableValue } from "./response/table-value";
import { getTableConfig } from "./response/table-config";
import { tableConfig, tableOptions } from "./__fixtures__/table-preview";

const renderValue = (value: unknown) =>
  renderToStaticMarkup(
    <TableValue
      value={value}
      response={{ formField: { question: { options: tableOptions } } }}
    />,
  );

const expectLayout = (markup: string) => {
  expect(markup).toContain("MacConkey Broth");
  expect(markup).toContain("MacConkey Agar");
  expect(markup).toContain("QCD/25/006/0000456693");
  expect(markup).toContain("Medium Batch no:");
  expect(markup).toContain('colSpan="3"');
  expect(markup.match(/<tr>/g)).toHaveLength(4);
  expect(markup.match(/<td /g)).toHaveLength(10);
  expect(markup).not.toContain("cellConfigs");
  expect(markup).not.toContain("Col 3");
};

describe("configured test table previews", () => {
  it("renders the screenshot layout and puts results in their original cells", () => {
    const markup = renderValue(
      JSON.stringify({ "3-1": "complies", "3-2": "fails" }),
    );
    expectLayout(markup);
    expect(markup).toContain("Complies</td><td");
    expect(markup).toContain("Does not comply</td>");
  });

  it("keeps the full layout for blank print previews without selecting results", () => {
    const markup = renderToStaticMarkup(renderTablePreview(tableOptions));
    expectLayout(markup);
    expect(markup).not.toContain("Complies");
    expect(markup).not.toContain("Does not comply");
    expect(markup).not.toContain("<input");
    expectLayout(renderValue(""));
  });

  it("unwraps stored response values and double-encoded configuration", () => {
    expectLayout(renderValue({ value: JSON.stringify({ "3-1": "complies" }) }));
    expectLayout(
      renderValue(JSON.stringify(JSON.stringify({ "3-1": "complies" }))),
    );
    expect(
      getTableConfig([{ name: JSON.stringify(tableOptions[0]!.name) }]),
    ).toEqual(tableConfig);
  });

  it("preserves row merges, zero readings, and saved select labels", () => {
    const markup = renderToStaticMarkup(
      <TableReadOnly
        config={{
          rows: 2,
          cols: 2,
          cellConfigs: {
            "0-0": { type: "label", label: "Reading", rowspan: 2 },
            "0-1": { type: "input" },
            "1-0": { type: "empty", isMerged: true },
            "1-1": { type: "select" },
          },
        }}
        values={{
          "0-1": 0,
          "1-1": { value: "equipment-id", label: "Balance 1" },
        }}
      />,
    );
    expect(markup).toContain('rowSpan="2"');
    expect(markup.match(/<td /g)).toHaveLength(3);
    expect(markup).toContain(">0</td>");
    expect(markup).toContain("Balance 1</td>");
  });

  it("keeps legacy headers/data tables readable", () => {
    const markup = renderToStaticMarkup(
      <TableValue
        value={JSON.stringify({
          headers: ["Reading", "Result"],
          data: [["Sample", 0]],
        })}
      />,
    );
    expect(markup).toContain("Reading");
    expect(markup).toContain("Sample");
    expect(markup).toContain(">0</div>");
    expect(
      renderValue(
        JSON.stringify({ headers: ["Reading"], data: [["Saved value"]] }),
      ),
    ).toContain("Saved value");
  });

  it("handles malformed configuration without displaying serialized settings", () => {
    for (const name of [
      "broken JSON",
      "null",
      '{"rows":-1,"cols":3,"cellConfigs":{}}',
    ]) {
      const markup = renderToStaticMarkup(renderTablePreview([{ name }]));
      expect(markup).toContain("Table is not configured.");
      expect(markup).not.toContain(name);
    }
  });
});

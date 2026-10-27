// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { emptyEntry, packingMaterials, type MaterialEntry } from "../../lib/final-packing";
import { MaterialsReconciliation } from "./materials-reconciliation";

afterEach(cleanup);

it("shows small issued weights and remainders in readable units without changing the entry unit", () => {
  const materials = packingMaterials([{ materialId: "film", name: "Film", code: "PM1", unit: "mg", quantity: 50_000 }],
    [{ materialId: "film", quantity: 500 }]);
  function Reconciliation() {
    const [entries, setEntries] = useState<Record<string, MaterialEntry>>({});
    return <MaterialsReconciliation materials={materials} entries={entries} showProblems={false} disabled={false}
      onChange={(id, patch) => setEntries((current) => ({ ...current, [id]: { ...(current[id] ?? emptyEntry), ...patch } }))} />;
  }
  render(<Reconciliation />);
  expect(screen.getAllByText("50.5 g")).toHaveLength(2);
  expect(screen.getByText("incl. 500 mg extra")).toBeTruthy();
  expect(screen.getByText("PM1 · in g")).toBeTruthy();
  expect(screen.queryByText(/< 0.0001 kg/)).toBeNull();
  const packed = screen.getByRole("textbox", { name: "Packed Film" });
  fireEvent.change(packed, { target: { value: "50.25" } });
  fireEvent.blur(packed);
  expect(screen.getByText("250 mg")).toBeTruthy();
  expect(screen.getByText("PM1 · in g")).toBeTruthy();
});

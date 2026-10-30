// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { emptyEntry, packingMaterials, type MaterialEntry } from "../../lib/final-packing";
import { MaterialsReconciliation } from "./materials-reconciliation";

afterEach(cleanup);

function Reconciliation({ materials }: { materials: ReturnType<typeof packingMaterials> }) {
  const [entries, setEntries] = useState<Record<string, MaterialEntry>>({});
  return <MaterialsReconciliation materials={materials} entries={entries} showProblems={false} disabled={false}
    onChange={(id, patch) => setEntries((current) => ({ ...current, [id]: { ...(current[id] ?? emptyEntry), ...patch } }))} />;
}

it("keeps focus in the reason and quantity fields while typing", async () => {
  const user = userEvent.setup();
  render(<Reconciliation materials={packingMaterials([{ materialId: "shipper", name: "Shippers", code: "PMS023", unit: "pack", quantity: 100 }], [])} />);
  await user.click(screen.getByRole("textbox", { name: "Packed Shippers" }));
  await user.keyboard("90");
  expect(screen.getByRole("textbox", { name: "Packed Shippers" })).toHaveProperty("value", "90");
  await user.tab();
  const rejected = screen.getByRole("textbox", { name: "Rejected Shippers" });
  expect(document.activeElement).toBe(rejected);
  await user.keyboard("10");
  expect(document.activeElement).toBe(rejected);
  await user.tab();
  const sampled = screen.getByRole("textbox", { name: "Sampled Shippers" });
  expect(document.activeElement).toBe(sampled);
  await user.keyboard("0");
  expect(document.activeElement).toBe(sampled);
  await user.tab();

  const reason = screen.getByRole("textbox", { name: "Reason for the loss of Shippers" });
  await user.click(reason);
  const sentence = "Cartons crushed in transit";
  await user.keyboard(sentence);
  expect(document.activeElement).toBe(reason);
  expect(screen.getByRole("textbox", { name: "Reason for the loss of Shippers" })).toBe(reason);
  expect(reason).toHaveProperty("value", sentence);
});

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

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { SessionProvider } from "../auth/session-provider";
import { forgetSession, stubBackend } from "../../test/backend";
import { PrintButton } from "./print-button";
import { PrintPreviewDialog } from "./print-preview-dialog";
import { PrintFacts, PrintHeader, PrintTable } from "./print-sheet";

afterEach(() => { cleanup(); forgetSession(); });
const show = (ui: ReactNode) => { stubBackend(); return render(<SessionProvider>{ui}</SessionProvider>); };

const rows = [{ id: "a", name: "Maize starch", quantity: "25 kg" }];
const document_ = <>
  <PrintHeader title="Requisition" reference="PR-0007" />
  <PrintFacts facts={[{ label: "Department", value: "Production" }, { label: "Needed by", value: null }]} />
  <PrintTable columns={[{ id: "name", header: "Material", cell: (row: typeof rows[number]) => row.name }, { id: "quantity", header: "Quantity", cell: (row) => row.quantity, align: "right" }]}
    rows={rows} rowKey={(row) => row.id} empty="Nothing to show" />
</>;

it("previews a document and prints it only when Print is pressed", () => {
  show(<PrintButton preview={(close) => <PrintPreviewDialog title="Requisition PR-0007" onClose={close}>{document_}</PrintPreviewDialog>} />);
  const print = vi.fn();
  vi.stubGlobal("print", print);
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Print" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("PR-0007")).toBeTruthy();
  expect(within(dialog).getByText("Production")).toBeTruthy();
  // A fact with no value is left out rather than printed blank.
  expect(within(dialog).queryByText("Needed by")).toBeNull();
  expect(print).not.toHaveBeenCalled();
  // The printer's copy sits outside the dialog, directly under the page body.
  const portal = document.body.querySelector(":scope > .print-portal");
  expect(portal?.textContent).toContain("Maize starch");
  fireEvent.click(within(dialog).getByRole("button", { name: "Print" }));
  expect(print).toHaveBeenCalledTimes(1);
  fireEvent.click(within(dialog).getAllByRole("button", { name: "Close" })[0] as HTMLElement);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.body.querySelector(".print-portal")).toBeNull();
});

it("says so when a table has nothing in it, and holds printing until the document is ready", () => {
  show(<PrintPreviewDialog title="Bin card" ready={false} note="Loading every entry…" onClose={() => {}}>
    <PrintTable columns={[{ id: "name", header: "Material", cell: () => "" }]} rows={[]} rowKey={(_row, index) => String(index)} empty="No entries" /></PrintPreviewDialog>);
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("No entries")).toBeTruthy();
  expect(within(dialog).getByText("Loading every entry…")).toBeTruthy();
  expect(within(dialog).getByRole("button", { name: "Print" }).hasAttribute("disabled")).toBe(true);
});

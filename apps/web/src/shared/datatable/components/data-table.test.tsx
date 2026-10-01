// @vitest-environment jsdom
import { useState } from "react";
import { createPortal } from "react-dom";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  ClientDataTable, DraggableDataTable, EditableComboboxCell, EditableMultiSelectCell, EditableNumberCell, ListDataTable, ServerDataTable,
  dataTableColumns, updateRowById,
} from "../index";

afterEach(cleanup);

interface Item { id: string; name: string; qty: number }
const items = (count: number, offset = 0): Item[] => Array.from({ length: count }, (_, index) => ({
  id: `item-${offset + index + 1}`, name: `Item ${String(offset + index + 1).padStart(3, "0")}`, qty: offset + index + 1,
}));
const itemId = (item: Item) => item.id;
const column = dataTableColumns<Item>();
const columns = column.columns([
  column.accessor("name", { header: "Name" }),
  column.accessor("qty", { header: "Quantity" }),
]);
const bodyRows = () => screen.getAllByRole("row").slice(1);
const names = () => bodyRows().map((row) => within(row).getAllByRole("cell").map((cell) => cell.textContent).find((text) => text?.startsWith("Item")));

it("shows placeholders only before the first rows arrive, then keeps rows during a refresh", () => {
  const view = render(<ClientDataTable label="Items" columns={columns} rows={undefined} getRowId={itemId} loading />);
  expect(screen.queryByText("Nothing to show")).toBeNull();
  expect(screen.getByRole("table").closest("[aria-busy='true']")).toBeTruthy();
  view.rerender(<ClientDataTable label="Items" columns={columns} rows={items(3)} getRowId={itemId} refreshing />);
  expect(names()).toEqual(["Item 001", "Item 002", "Item 003"]);
  expect(screen.getByRole("status").textContent).toContain("Updating");
});

it("tells a failed load apart from an empty list and offers a retry", () => {
  const retry = vi.fn();
  const view = render(<ClientDataTable label="Items" columns={columns} rows={[]} getRowId={itemId} error="Cannot reach the server." onRetry={retry} />);
  expect(screen.getByRole("alert").textContent).toContain("could not be loaded");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledOnce();
  view.rerender(<ClientDataTable label="Items" columns={columns} rows={[]} getRowId={itemId} emptyTitle="No items yet" />);
  expect(screen.getByText("No items yet")).toBeTruthy();
  view.rerender(<ClientDataTable label="Items" columns={columns} rows={items(2)} getRowId={itemId} error="Cannot reach the server." />);
  expect(names()).toEqual(["Item 001", "Item 002"]);
  expect(screen.getByRole("alert").textContent).toContain("last loaded rows");
});

it("sorts, pages, and stays on a valid page when the list shrinks", () => {
  const view = render(<ClientDataTable label="Items" columns={columns} rows={items(45)} getRowId={itemId} initialPageSize={20} />);
  fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
  expect(names()).toEqual(["Item 041", "Item 042", "Item 043", "Item 044", "Item 045"]);
  expect(screen.getByRole("status").textContent).toContain("41–45 of 45");
  view.rerender(<ClientDataTable label="Items" columns={columns} rows={items(25)} getRowId={itemId} initialPageSize={20} />);
  expect(names()).toEqual(["Item 021", "Item 022", "Item 023", "Item 024", "Item 025"]);
  fireEvent.click(screen.getByRole("button", { name: /Quantity/ }));
  fireEvent.click(screen.getByRole("button", { name: /Quantity/ }));
  expect(names()[0]).toBe("Item 025");
  expect(screen.getByRole("columnheader", { name: /Quantity/ }).getAttribute("aria-sort")).toBe("descending");
});

function ServerHarness({ onPageChange }: { onPageChange: (page: number) => void }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  return <ServerDataTable label="Items" columns={columns} rows={items(2, (page - 1) * 2)} getRowId={itemId} page={page} pageSize={2}
    totalRows={6} onPageChange={(next) => { setPage(next); onPageChange(next); }} onPageSizeChange={() => {}}
    selection={{ selected, onChange: setSelected }} />;
}

it("keeps a selection tied to its rows when the server page changes", () => {
  render(<ServerHarness onPageChange={() => {}} />);
  fireEvent.click(within(bodyRows()[0]!).getByRole("checkbox", { name: "Select row" }));
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(names()).toEqual(["Item 003", "Item 004"]);
  expect(bodyRows().every((row) => within(row).getByRole("checkbox").getAttribute("aria-checked") === "false")).toBe(true);
  expect(screen.getByRole("status").textContent).toContain("1 selected");
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
  expect(screen.getByRole("status").textContent).toContain("3 selected");
  fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
  expect(within(bodyRows()[0]!).getByRole("checkbox").getAttribute("aria-checked")).toBe("true");
  expect(screen.getByRole("checkbox", { name: "Select all rows on this page" }).getAttribute("aria-checked")).toBe("mixed");
});

it("returns to the last real page when the requested page no longer exists", () => {
  const onPageChange = vi.fn();
  render(<ServerDataTable label="Items" columns={columns} rows={[]} getRowId={itemId} page={5} pageSize={20} totalRows={41}
    onPageChange={onPageChange} onPageSizeChange={() => {}} />);
  expect(onPageChange).toHaveBeenCalledWith(3);
});

it("does not offer sorting the endpoint cannot perform, and shows an unusual page size", () => {
  render(<ServerDataTable label="Items" columns={columns} rows={items(5)} getRowId={itemId} page={1} pageSize={5} totalRows={5}
    onPageChange={() => {}} onPageSizeChange={() => {}} />);
  expect(screen.queryByRole("button", { name: /Quantity/ })).toBeNull();
  expect(screen.getByRole("combobox", { name: "Rows per page" }).textContent).toContain("5");
});

it("opens a row on click or Enter, but not from controls or menus inside it", () => {
  const open = vi.fn();
  const withActions = column.columns([
    column.accessor("name", { header: "Name" }),
    column.display({ id: "actions", header: "Actions", cell: ({ row }) => <>
      <button type="button">Edit {row.original.name}</button>
      {createPortal(<button type="button">Delete {row.original.name}</button>, document.body)}
    </> }),
  ]);
  render(<ListDataTable label="Items" columns={withActions} rows={items(1)} getRowId={itemId} onRowOpen={open} />);
  fireEvent.click(screen.getByRole("button", { name: "Edit Item 001" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete Item 001" }));
  expect(open).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Item 001"));
  fireEvent.keyDown(bodyRows()[0]!, { key: "Enter" });
  expect(open).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByText("Item 001"), { ctrlKey: true });
  expect(open).toHaveBeenCalledTimes(2);
});

function EditableHarness() {
  const [rows, setRows] = useState(items(2));
  const editable = column.columns([
    column.accessor("name", { header: "Name" }),
    column.display({ id: "qty", header: "Quantity", cell: ({ row }) => <EditableNumberCell label={`Quantity for ${row.original.name}`}
      value={row.original.qty} min={0} onCommit={(qty) => setRows((current) => updateRowById(current, itemId, row.original.id, { qty: qty ?? 0 }))} /> }),
  ]);
  return <ListDataTable label="Lines" columns={editable} rows={rows} getRowId={itemId} sortable
    footer={<tr><td colSpan={2}>Total {rows.reduce((sum, row) => sum + row.qty, 0)}</td></tr>} />;
}

it("commits an edited cell to the right row and shows a list without paging", () => {
  render(<EditableHarness />);
  expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
  const input = screen.getByRole("textbox", { name: "Quantity for Item 002" });
  fireEvent.change(input, { target: { value: "40" } });
  expect(screen.getByText("Total 3")).toBeTruthy();
  fireEvent.blur(input);
  expect(screen.getByText("Total 41")).toBeTruthy();
  fireEvent.change(input, { target: { value: "nonsense" } });
  fireEvent.keyDown(input, { key: "Escape" });
  expect(screen.getByText("Total 41")).toBeTruthy();
});

it("gives each draggable row a reorder handle and locks reordering when row IDs repeat", () => {
  const view = render(<DraggableDataTable label="Steps" columns={columns} rows={items(2)} getRowId={itemId}
    onReorder={() => {}} describeRow={(item) => item.name} />);
  expect(screen.getByRole("button", { name: "Reorder Item 001" }).hasAttribute("disabled")).toBe(false);
  expect(screen.queryByRole("button", { name: /Name/ })).toBeNull();
  view.rerender(<DraggableDataTable label="Steps" columns={columns} rows={[...items(1), ...items(1)]} getRowId={itemId}
    onReorder={() => {}} describeRow={(item) => item.name} />);
  expect(screen.getAllByRole("button", { name: "Reorder Item 001" }).every((button) => button.hasAttribute("disabled"))).toBe(true);
});

it("hides and restores columns but never the last one, and keeps the header fixed in a height-limited table", () => {
  render(<ClientDataTable label="Items" columns={columns} rows={items(2)} getRowId={itemId} columnToggle maxHeight="12rem" />);
  expect(screen.getByRole("columnheader", { name: /Quantity/ }).className).toContain("sticky");
  fireEvent.pointerDown(screen.getByRole("button", { name: "Columns" }), { button: 0, ctrlKey: false });
  fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Quantity" }));
  expect(screen.queryByRole("columnheader", { name: /Quantity/ })).toBeNull();
  expect(screen.getByRole("menuitemcheckbox", { name: "Name" }).getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Show all" }));
  expect(screen.getByRole("columnheader", { name: /Quantity/ })).toBeTruthy();
});

function PickerHarness() {
  const [unit, setUnit] = useState<string | null>("kg");
  const [tags, setTags] = useState<string[]>([]);
  const units = [{ value: "kg", label: "Kilogram" }, { value: "l", label: "Litre" }];
  return <>
    <EditableComboboxCell label="Unit" value={unit} options={units} onCommit={setUnit} clearable />
    <EditableMultiSelectCell label="Tags" values={tags} options={units} onCommit={setTags} />
    <output>{unit ?? "none"}|{tags.join("+")}</output>
  </>;
}

it("picks searchable single and multiple options", () => {
  render(<PickerHarness />);
  fireEvent.click(screen.getByRole("combobox", { name: "Unit" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Search Unit" }), { target: { value: "lit" } });
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Search Unit" }), { key: "Enter" });
  expect(screen.getByRole("status").textContent).toBe("l|");
  fireEvent.click(screen.getByRole("combobox", { name: "Tags" }));
  fireEvent.click(screen.getByRole("option", { name: "Kilogram" }));
  fireEvent.click(screen.getByRole("option", { name: "Litre" }));
  expect(screen.getByRole("status").textContent).toBe("l|kg+l");
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(screen.getByRole("status").textContent).toBe("l|");
});

// Development-only page for checking the shared data tables by hand with local sample rows.
// Open /datatable-preview.html while `bun run dev:web` is running. Not part of the application.
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import {
  ClientDataTable, DraggableDataTable, EditableComboboxCell, EditableMultiSelectCell, EditableNumberCell, EditableSelectCell,
  EditableTextCell, ListDataTable, ServerDataTable, dataTableColumns, updateRowById, useServerTable,
} from "@/shared/datatable";
import { ThemeProvider } from "@/shared/theme/theme-provider";
import "../styles.css";

interface Material { id: string; code: string; name: string; category: string; stock: number; unit: string; tags: string[] }
const categories = ["Raw material", "Packaging", "Excipient", "Active ingredient"];
const units = [{ value: "kg", label: "Kilogram" }, { value: "g", label: "Gram" }, { value: "l", label: "Litre" }, { value: "pcs", label: "Pieces" }];
const tagOptions = [{ value: "cold", label: "Cold chain" }, { value: "haz", label: "Hazardous" }, { value: "qc", label: "QC hold" }];
const materials: Material[] = Array.from({ length: 137 }, (_, index) => ({
  id: `material-${index + 1}`,
  code: `MAT-${String(index + 1).padStart(4, "0")}`,
  name: index === 3 ? "Microcrystalline cellulose pharmaceutical grade with an unusually long descriptive name to test wrapping"
    : `Material ${index + 1}`,
  category: categories[index % categories.length] ?? "Raw material",
  stock: (index * 37) % 500,
  unit: units[index % units.length]?.value ?? "kg",
  tags: index % 5 === 0 ? ["qc"] : [],
}));
const materialId = (material: Material) => material.id;
const column = dataTableColumns<Material>();
const readColumns = column.columns([
  column.accessor("code", { header: "Code", size: 120 }),
  column.accessor("name", { header: "Name" }),
  column.accessor("category", { header: "Category" }),
  column.accessor("stock", { header: "Stock", size: 100 }),
  column.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, size: 110, enableSorting: false, enableHiding: false,
    cell: ({ row }) => <Button size="sm" variant="ghost" onClick={() => toast(`Edit ${row.original.code}`)}>Edit</Button> }),
]);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-2"><h2 className="text-base font-semibold">{title}</h2>{children}</section>;
}

function ClientExample() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState("");
  const rows = useMemo(() => materials.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(search.toLowerCase())), [search]);
  return <ClientDataTable label="Materials (client paged)" columns={readColumns} rows={rows} getRowId={materialId}
    selection={{ selected, onChange: setSelected, isSelectable: (item) => item.stock > 0 }}
    onRowOpen={(item) => toast(`Opened ${item.code}`)}
    toolbar={<Input aria-label="Search materials" placeholder="Search materials" className="max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} />} />;
}

function ServerExample() {
  const table = useServerTable({ pageSize: 10 });
  const [state, setState] = useState<{ rows: Material[]; total: number; loading: boolean; error: string | null }>({ rows: [], total: 0, loading: true, error: null });
  const [fail, setFail] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const sort = table.sorting[0];
  useEffect(() => {
    setState((current) => ({ ...current, loading: true }));
    const timer = setTimeout(() => {
      if (fail) { setState((current) => ({ ...current, loading: false, error: "Cannot reach the customer server. Check the connection and retry." })); return; }
      const ordered = sort ? [...materials].sort((a, b) => (sort.desc ? -1 : 1) * String(a[sort.id as "code"]).localeCompare(String(b[sort.id as "code"]), undefined, { numeric: true })) : materials;
      const start = (table.page - 1) * table.pageSize;
      setState({ rows: ordered.slice(start, start + table.pageSize), total: ordered.length, loading: false, error: null });
    }, 500);
    return () => clearTimeout(timer);
  }, [table.page, table.pageSize, sort, fail, attempt]);
  return <ServerDataTable label="Materials (server paged)" columns={readColumns} rows={state.rows} getRowId={materialId}
    page={table.page} pageSize={table.pageSize} totalRows={state.total} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
    sorting={table.sorting} onSortingChange={table.onSortingChange} loading={state.loading && state.rows.length === 0}
    refreshing={state.loading && state.rows.length > 0} error={state.error} onRetry={() => { setFail(false); setAttempt((value) => value + 1); }}
    toolbar={<Button size="sm" variant="outline" onClick={() => setFail((value) => !value)}>{fail ? "Server failing" : "Simulate failure"}</Button>} />;
}

function ListExample() {
  const [rows, setRows] = useState(() => materials.slice(0, 4));
  const patch = (id: string, change: Partial<Material>) => setRows((current) => updateRowById(current, materialId, id, change));
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Code", size: 110 }),
    column.display({ id: "name", header: "Name", cell: ({ row }) =>
      <EditableTextCell label={`Name of ${row.original.code}`} value={row.original.name} onCommit={(name) => patch(row.original.id, { name })} /> }),
    column.display({ id: "stock", header: "Quantity", size: 120, cell: ({ row }) =>
      <EditableNumberCell label={`Quantity of ${row.original.code}`} value={row.original.stock} min={0} onCommit={(stock) => patch(row.original.id, { stock: stock ?? 0 })} /> }),
    column.display({ id: "unit", header: "Unit", size: 130, cell: ({ row }) =>
      <EditableSelectCell label={`Unit of ${row.original.code}`} value={row.original.unit} options={units} onCommit={(unit) => patch(row.original.id, { unit })} /> }),
    column.display({ id: "category", header: "Category", size: 170, cell: ({ row }) =>
      <EditableComboboxCell label={`Category of ${row.original.code}`} value={row.original.category} clearable
        options={categories.map((value) => ({ value, label: value }))} onCommit={(category) => patch(row.original.id, { category: category ?? "" })} /> }),
    column.display({ id: "tags", header: "Handling", size: 170, cell: ({ row }) =>
      <EditableMultiSelectCell label={`Handling of ${row.original.code}`} values={row.original.tags} options={tagOptions} onCommit={(tags) => patch(row.original.id, { tags })} /> }),
  ]), []);
  return <ListDataTable label="Requisition lines (list)" columns={columns} rows={rows} getRowId={materialId}
    footer={<tr><td colSpan={2} className="p-2 font-medium">Total</td><td className="p-2 text-right font-medium tabular-nums">{rows.reduce((sum, row) => sum + row.stock, 0)}</td><td colSpan={3} /></tr>} />;
}

function DraggableExample() {
  const [rows, setRows] = useState(() => materials.slice(0, 6));
  const columns = useMemo(() => readColumns.slice(0, 3), []);
  return <DraggableDataTable label="Processing steps (draggable)" columns={columns} rows={rows} getRowId={materialId}
    describeRow={(item) => item.code} maxHeight="16rem"
    onReorder={(next, move) => { setRows(next); toast(`Moved ${move.id} from ${move.from + 1} to ${move.to + 1}`); }} />;
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
function DialogExample() {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant="outline" onClick={() => setOpen(true)}>Open long dialog</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Long dialog</DialogTitle><DialogDescription>The header and footer stay in view; only the rows scroll.</DialogDescription></DialogHeader>
      <DialogBody><ListDataTable label="Materials" columns={readColumns.slice(0, 3)} rows={materials.slice(0, 40)} getRowId={(row) => row.id} /></DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}

createRoot(root).render(<StrictMode><ThemeProvider>
  <main className="mx-auto max-w-5xl space-y-8 p-6 text-foreground">
    <h1 className="text-xl font-semibold">Data table preview</h1>
    {/* A fixed-height flex column stands in for a workspace page using the page-fill class. */}
    <Section title="Client paged, filling a 420px page"><div style={{ display: "flex", flexDirection: "column", height: 420 }}><ClientExample /></div></Section>
    <Section title="Server paged"><ServerExample /></Section>
    <Section title="List with editable cells"><ListExample /></Section>
    <Section title="Draggable"><DraggableExample /></Section>
    <Section title="Dialog with fixed header and footer"><DialogExample /></Section>
  </main>
  <Toaster position="bottom-right" closeButton />
</ThemeProvider></StrictMode>);

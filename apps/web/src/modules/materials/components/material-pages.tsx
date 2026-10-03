import { permissionDeniedMessage } from "@/shared/auth/use-permission-action";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eraser, Eye, Link2, Link2Off, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { EditableNumberCell, EditableSelectCell, ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { unitPageSchema, useGetUnitsPageQuery } from "@/modules/units-of-measure/units";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { materialKindLabels, useKindTabs } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useDeleteApiV1MaterialByMaterialIdMutation, useDeleteApiV1MaterialDepartmentMutation, useGetApiV1MaterialByMaterialIdQuery, useGetApiV1MaterialDepartmentNotLinkedQuery, useGetApiV1MaterialDepartmentQuery, useGetApiV1MaterialQuery, usePostApiV1MaterialDepartmentMutation } from "../api/material-api";
import { draftIsEmpty, draftIssue, emptyDraft, readyLinks, unitTypesFor, type LinkDraft } from "../lib/bulk-link";
import { audit, levelUnit, deleteBlock, materialPath, materialPermissions, materialsPath, showStock, standingLabels, stockStanding, unlinkBlock } from "../lib/materials";
import { linkRowsSchema, materialRowsSchema, materialSchema, type Material, type MaterialLink } from "../schemas/material-schema";
import { LinkDialog } from "./link-dialog";
import { MaterialDialog } from "./material-dialog";

const column = dataTableColumns<Material>();

/** The master list of materials, raw or packaging. */
export function MaterialListPage() {
  const { has } = useAccess();
  const navigate = useNavigate();
  const { kind, select, tabs } = useKindTabs(materialPermissions.view);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("materials", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}` });
  const query = useGetApiV1MaterialQuery({ ...audit, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? materialRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<Material | "new" | null>(null);
  const [removing, setRemoving] = useState<Material | null>(null);
  const [remove] = useDeleteApiV1MaterialByMaterialIdMutation();
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.code || "No code"}</div></div> }),
    column.accessor((row) => row.category?.name ?? "", { id: "category", header: "Category", cell: ({ row }) => row.original.category?.name ?? "–" }),
    ...(kind === 0 ? [column.accessor((row) => row.pharmacopoeia ?? "", { id: "pharmacopoeia", header: "Pharmacopoeia", size: 160, cell: ({ row }) => row.original.pharmacopoeia ?? "–" })] : []),
    column.accessor((row) => row.description ?? "", { id: "description", header: "Description", cell: ({ row }) => <span className="line-clamp-2 break-words">{row.original.description ?? "–"}</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const block = deleteBlock(row.original);
      return <TableMenu label={`Actions for ${row.original.name}`} items={[
        { id: "view", label: "View", icon: Eye, to: materialPath(row.original.id, row.original.kind) },
        { id: "edit", label: "Edit", icon: Pencil, require: materialPermissions.edit[row.original.kind], onSelect: () => setEditing(row.original) },
        { id: "delete", label: "Delete", icon: Trash2, destructive: true, require: materialPermissions.remove[row.original.kind], onSelect: () => setRemoving(row.original), ...(block ? { disabled: true, disabledReason: block } : {}) },
      ]} />; } }),
  ]), [kind]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Materials</h1></div>
      <div className="flex flex-wrap items-center gap-2"><KindSwitch tabs={tabs} kind={kind} onSelect={select} />
        {kind !== null && has(materialPermissions.create[kind]) ? <Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add material</Button> : null}</div>
    </div>
    <ServerDataTable label="Materials" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(materialPath(row.id, row.kind))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned materials the app could not read." : null}
      emptyTitle={search.trim() ? "No materials match this search" : "No materials"} emptyDescription={search.trim() ? "Search by name or code." : "Add the materials the company buys and uses."} />
    {editing && kind !== null ? <MaterialDialog key={editing === "new" ? "new" : editing.id} kind={editing === "new" ? kind : editing.kind} {...(editing === "new" ? {} : { material: editing })} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={materialPermissions.remove[removing.kind]} title={`Delete ${removing.name}?`} description="The material is removed from the master list and can no longer be bought, linked or put in a formula." confirmLabel="Delete material" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...audit, materialId: removing.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success(`${removing.name} deleted`);
        return null; }} /> : null}
  </section>;
}

function Detail({ id }: { id: string }) {
  const { has } = useAccess();
  const query = useGetApiV1MaterialByMaterialIdQuery({ ...audit, materialId: id });
  const material = useMemo(() => { const parsed = materialSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  const [editing, setEditing] = useState(false);
  if (query.isLoading) return <DetailPageSkeleton label="Loading material" groups={3} />;
  if (!material) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Material unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a material the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={materialsPath}>Materials</Link></Button></div></div>;
  // The material says which kind it is; the permission for that kind is the one checked, whatever the address says.
  if (!has(materialPermissions.view[material.kind])) return <NoAccess />;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={material.name} crumbs={[{ label: "Materials", to: `${materialsPath}?type=${material.kind}` }, { label: material.name }]}
      actions={has(materialPermissions.edit[material.kind]) ? <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil />Edit</Button> : null} />
    <div className="flex flex-wrap gap-2"><Badge variant="secondary">{materialKindLabels[material.kind]} material</Badge>{material.unlimited ? <Badge variant="outline">Unlimited stock</Badge> : null}</div>
    <KeyFacts>
      <KeyFact label="Code" value={material.code || "–"} />
      <KeyFact label="Category" value={material.category?.name ?? "–"} />
      <KeyFact label="Specification" value={material.specification ?? "None linked"} />
      <KeyFact label="Suppliers" value={material.suppliers.length} note={`${material.manufacturers.length} ${material.manufacturers.length === 1 ? "manufacturer" : "manufacturers"}`} />
    </KeyFacts>
    <div className="grid gap-3 lg:grid-cols-2">
      <DetailGroup title="Material"><DetailItem label="Name" value={material.name} />{material.kind === 0 ? <DetailItem label="Pharmacopoeia" value={material.pharmacopoeia} /> : null}<DetailItem label="Description" value={material.description} /></DetailGroup>
      <DetailGroup title="Approved sources"><DetailItem label="Suppliers" value={material.suppliers.join(", ")} /><DetailItem label="Manufacturers" value={material.manufacturers.join(", ")} /></DetailGroup>
    </div>
    {editing ? <MaterialDialog kind={material.kind} material={material} onClose={() => setEditing(false)} /> : null}
  </article>;
}
export function MaterialDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : null;
}

const linkColumn = dataTableColumns<MaterialLink>();
/** Materials the user's department keeps, with its stock levels and where its stock stands against them. */
export function LinkedMaterialsPage() {
  const { kind, select, tabs } = useKindTabs(materialPermissions.viewLinked);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("linked materials", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}` });
  const query = useGetApiV1MaterialDepartmentQuery({ ...audit, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? linkRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<MaterialLink | null>(null);
  const [unlinking, setUnlinking] = useState<MaterialLink | null>(null);
  const [unlink] = useDeleteApiV1MaterialDepartmentMutation();
  const columns = useMemo(() => linkColumn.columns([
    linkColumn.accessor((row) => row.material.name, { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.material.name}</div><div className="text-xs text-muted-foreground">{row.original.material.code || "No code"}</div></div> }),
    linkColumn.display({ id: "levels", header: "Stock levels", cell: ({ row }) => row.original.maximum > 0 ? <dl className="text-sm"><div><dt className="inline text-muted-foreground">Minimum </dt><dd className="inline">{showStock(row.original.minimum, row.original.unit)}</dd></div>
      <div><dt className="inline text-muted-foreground">Re-order </dt><dd className="inline">{showStock(row.original.reorder, row.original.unit)}</dd></div><div><dt className="inline text-muted-foreground">Maximum </dt><dd className="inline">{showStock(row.original.maximum, row.original.unit)}</dd></div></dl>
      : <span className="text-muted-foreground">Not set</span> }),
    linkColumn.accessor("stock", { header: "In your store", size: 190, cell: ({ row }) => <div><div className="font-medium">{showStock(row.original.stock, row.original.unit)}</div>
      <div className="text-xs text-muted-foreground">{row.original.reserved > 0 ? `${showStock(row.original.reserved, row.original.unit)} reserved` : "None reserved"}{row.original.expired > 0 ? ` · ${showStock(row.original.expired, row.original.unit)} expired` : ""}</div></div> }),
    linkColumn.display({ id: "standing", header: "Standing", size: 170, cell: ({ row }) => { const standing = stockStanding(row.original);
      return <Badge variant={standing === "below-minimum" ? "destructive" : standing === "reorder" || standing === "above-maximum" ? "secondary" : "outline"}>{standingLabels[standing]}</Badge>; } }),
    linkColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const block = unlinkBlock(row.original); const itemKind = row.original.material.kind;
      return <TableMenu label={`Actions for ${row.original.material.name}`} items={[
        { id: "levels", label: "Change stock levels", icon: SlidersHorizontal, require: materialPermissions.editLinked[itemKind], onSelect: () => setEditing(row.original) },
        { id: "unlink", label: "Unlink", icon: Link2Off, destructive: true, require: materialPermissions.unlink[itemKind], onSelect: () => setUnlinking(row.original), ...(block ? { disabled: true, disabledReason: block } : {}) },
      ]} />; } }),
  ]), []);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Linked materials</h1><p className="text-sm text-muted-foreground">What your department keeps, and the levels its stock should stay between.</p></div>
      <KindSwitch tabs={tabs} kind={kind} onSelect={select} />
    </div>
    <ServerDataTable label="Linked materials" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned materials the app could not read." : null}
      emptyTitle={search.trim() ? "No materials match this search" : "No linked materials"} emptyDescription={search.trim() ? "Search by name or code." : "Link materials from the unlinked list to start keeping stock of them."} />
    {editing ? <LinkDialog key={editing.id} material={editing.material} link={editing} onClose={() => setEditing(null)} /> : null}
    {unlinking ? <ConfirmActionDialog require={materialPermissions.unlink[unlinking.material.kind]} title={`Unlink ${unlinking.material.name}?`} description="Your department stops keeping this material and its stock levels are removed. It can be linked again later." confirmLabel="Unlink" busyLabel="Unlinking…" onClose={() => setUnlinking(null)}
      onConfirm={async () => { const result = await unlink({ ...audit, materialId: unlinking.material.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success(`${unlinking.material.name} unlinked`);
        return null; }} /> : null}
  </section>;
}

const unlinkedColumn = dataTableColumns<Material>();
/** Materials the department does not keep yet. Each can be linked on its own, or several filled in on the list and linked together. */
export function UnlinkedMaterialsPage() {
  const { kind, select, tabs } = useKindTabs(materialPermissions.viewUnlinked);
  const { has, allowsNow } = useAccess();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("unlinked materials", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}` });
  const query = useGetApiV1MaterialDepartmentNotLinkedQuery({ ...audit, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? materialRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [linking, setLinking] = useState<Material | null>(null);
  const mayLink = kind !== null && has(materialPermissions.link[kind]);
  const units = useGetUnitsPageQuery({ page: 1, pageSize: 200, searchQuery: "", types: unitTypesFor(kind ?? 0) }, { skip: !mayLink });
  const unitOptions = useMemo(() => { const result = unitPageSchema.safeParse(units.data ?? {}); return result.success ? result.data.rows.map((unit) => ({ value: unit.id, label: unit.symbol || unit.name })) : []; }, [units.data]);
  // What has been filled in, by material. Kept while paging and searching; cleared when the kind of material changes.
  const [drafts, setDrafts] = useState<ReadonlyMap<string, LinkDraft>>(new Map());
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { setDrafts(new Map()); setChecked(false); setMessage(""); }, [kind]);
  const [save, saving] = usePostApiV1MaterialDepartmentMutation();
  const change = useCallback((material: Material, patch: Partial<LinkDraft>) => setDrafts((current) => { const next = new Map(current); const draft = { ...(current.get(material.id) ?? emptyDraft(material.name)), ...patch };
    if (draftIsEmpty(draft)) next.delete(material.id); else next.set(material.id, draft); return next; }), []);
  const ready = useMemo(() => readyLinks(drafts), [drafts]);
  const linkAll = async () => {
    if (kind === null || !allowsNow(materialPermissions.link[kind])) { setMessage(permissionDeniedMessage); return; }
    setMessage(""); setChecked(true);
    if (ready.length === 0) return;
    const result = await save({ ...audit, body: ready });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    // The linked ones leave the list; anything still incomplete stays filled in.
    setDrafts((current) => { const next = new Map(current); for (const link of ready) next.delete(link.materialId); return next; });
    setChecked(drafts.size > ready.length);
    toast.success(ready.length === 1 ? "1 material linked" : `${ready.length} materials linked`);
  };
  const columns = useMemo(() => { const level = (key: "minimum" | "reorder" | "maximum", header: string) => unlinkedColumn.display({ id: key, header, size: 130, cell: ({ row }) => { const draft = drafts.get(row.original.id); const unit = draft?.unit ? ` (${levelUnit(draft.unit)})` : "";
      return <EditableNumberCell label={`${header} of ${row.original.name}${unit}`} value={draft?.[key] ?? null} min={0} disabled={saving.isLoading} invalid={checked && Boolean(draft) && (draft?.[key] ?? 0) <= 0} placeholder={draft?.unit ? levelUnit(draft.unit) : ""} onCommit={(value) => change(row.original, { [key]: value })} />; } });
    return unlinkedColumn.columns([
    unlinkedColumn.accessor("name", { header: "Material", cell: ({ row }) => { const draft = drafts.get(row.original.id); const issue = draft && checked ? draftIssue(draft) : null;
      return <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.code}</div>{issue ? <div role="alert" className="text-xs text-destructive">{issue}</div> : null}</div>; } }),
    unlinkedColumn.accessor((row) => row.category?.name ?? "", { id: "category", header: "Category", cell: ({ row }) => row.original.category?.name ?? "–" }),
    ...(mayLink ? [
      unlinkedColumn.display({ id: "unit", header: "Counted in", size: 150, cell: ({ row }) => { const draft = drafts.get(row.original.id);
        return <EditableSelectCell label={`Unit of ${row.original.name}`} value={draft?.unitId ?? null} options={unitOptions} disabled={saving.isLoading} invalid={checked && Boolean(draft) && !draft?.unitId} placeholder={units.isLoading ? "Loading…" : "Unit"}
          onCommit={(value) => change(row.original, { unitId: value, unit: unitOptions.find((option) => option.value === value)?.label ?? null })} />; } }),
      level("minimum", "Minimum"), level("reorder", "Re-order"), level("maximum", "Maximum"),
    ] : [unlinkedColumn.display({ id: "description", header: "Description", cell: ({ row }) => <span className="line-clamp-2 break-words">{row.original.description ?? "–"}</span> })]),
    unlinkedColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "link", label: "Link to my department", icon: Link2, require: materialPermissions.link[row.original.kind], onSelect: () => setLinking(row.original) },
      ...(drafts.has(row.original.id) ? [{ id: "clear", label: "Clear what is filled in", icon: Eraser, onSelect: () => change(row.original, emptyDraft(row.original.name)) }] : [])]} /> }),
  ]); }, [drafts, checked, mayLink, unitOptions, units.isLoading, saving.isLoading, change]);
  const waiting = drafts.size - ready.length;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Unlinked materials</h1><p className="text-sm text-muted-foreground">Materials your department does not keep yet.{mayLink ? " Fill in the unit and levels of as many as you like, then link them together." : ""}</p></div>
      <KindSwitch tabs={tabs} kind={kind} onSelect={select} />
    </div>
    {drafts.size > 0 ? <div role="status" aria-label="Materials filled in" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
      <span><span className="font-medium">{drafts.size} filled in</span> · {ready.length} ready to link{waiting > 0 ? ` · ${waiting} incomplete` : ""}{checked && waiting > 0 ? ". The incomplete ones are marked in the list, on whichever page they are." : ""}</span>
      <span className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={saving.isLoading} onClick={() => { setDrafts(new Map()); setChecked(false); setMessage(""); }}>Clear all</Button>
        <Button type="button" size="sm" disabled={saving.isLoading || !mayLink} onClick={() => { void linkAll(); }}>{saving.isLoading ? "Linking…" : ready.length === 1 ? "Link 1 material" : `Link ${ready.length} materials`}</Button></span>
    </div> : null}
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    {units.error ? <p role="alert" className="text-sm text-destructive">The units could not be loaded: {apiErrorMessage(units.error)}</p> : null}
    <ServerDataTable label="Unlinked materials" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned materials the app could not read." : null}
      emptyTitle={search.trim() ? "No materials match this search" : "Every material is linked"} emptyDescription={search.trim() ? "Search by name or code." : "Your department already keeps every material of this kind."} />
    {linking ? <LinkDialog key={linking.id} material={linking} onClose={() => setLinking(null)} /> : null}
  </section>;
}

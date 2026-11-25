import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useCreateVendorListMutation, useReviseVendorListMutation, useSaveVendorListDraftMutation, useUpdateVendorListMutation, useVendorListQuery, useVendorListsQuery, useVendorOptionsQuery } from "../api/avl-api";
import { ListStatus, ReviewStatus, detailSchema, draftFromLine, lineProblem, lineRequest, monthLabel, summariesSchema, type DraftLine, type ListDetail } from "../lib/avl";
import { avlAudit, avlKeys, avlRoot } from "../lib/keys";
import { LineDialog } from "./avl-line-dialog";
import { randomId } from "@/shared/ids/random-id";

export type EditorMode = "new" | "revise" | "edit" | "draft";
const column = dataTableColumns<DraftLine>();
const titles: Record<EditorMode, string> = { new: "Prepare approved vendor list", revise: "New revision", edit: "Correct list", draft: "Edit draft" };
const keyFor: Record<EditorMode, string> = { new: avlKeys.create, revise: avlKeys.revise, edit: avlKeys.edit, draft: avlKeys.editDraft };

/** The list being edited: for a revision, the current list; for a correction, the list itself. */
function useSource(mode: EditorMode, id: string) {
  const lists = useVendorListsQuery({ ...avlAudit }, { skip: mode !== "revise" });
  const currentId = mode === "revise" ? (summariesSchema.safeParse(lists.data ?? []).data ?? []).find((l) => l.status === ListStatus.Approved)?.id ?? "" : id;
  const detail = useVendorListQuery({ ...avlAudit, id: currentId }, { skip: mode === "new" || !currentId, refetchOnMountOrArgChange: true });
  const parsed = detail.data ? detailSchema.safeParse(detail.data) : null;
  const loading = lists.isLoading || detail.isLoading;
  const missing = mode !== "new" && !loading && !currentId ? "There is no approved list to revise." : null;
  return { source: parsed?.success ? parsed.data : null, loading, error: detail.error ?? lists.error ?? null, missing };
}

/** Prepares and edits vendor-list drafts and corrects submitted lists in review. */
export function VendorListEditorPage({ mode }: { mode: EditorMode }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const options = useVendorOptionsQuery({ ...avlAudit });
  const { source, loading, error, missing } = useSource(mode, id);
  const [annexure, setAnnexure] = useState("QAD/SOP/007/A03-06");
  const [revision, setRevision] = useState("");
  const [supersedes, setSupersedes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [editing, setEditing] = useState<DraftLine | "new" | null>(null);
  const [loaded, setLoaded] = useState<ListDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const permission = usePermissionAction(keyFor[mode]);
  const [create] = useCreateVendorListMutation();
  const [revise] = useReviseVendorListMutation();
  const [update] = useUpdateVendorListMutation();
  const [saveDraft] = useSaveVendorListDraftMutation();
  useEffect(() => {
    if (!source || loaded?.id === source.id) return;
    setLoaded(source);
    setAnnexure(source.annexureNumber ?? "");
    setRevision(String(mode === "revise" ? source.revisionNumber + 1 : source.revisionNumber));
    setSupersedes(mode === "revise" ? String(source.revisionNumber) : source.supersedesRevision === null ? "" : String(source.supersedesRevision));
    setLines(source.lines.map((line) => mode === "revise" ? { ...draftFromLine(line), key: randomId() } : draftFromLine(line)));
  }, [source, loaded, mode]);
  const menu = (line: DraftLine) => [
    { id: "edit", label: "Change", icon: Pencil, require: keyFor[mode], onSelect: () => setEditing(line) },
    { id: "remove", label: "Remove", icon: Trash2, destructive: true, require: keyFor[mode], onSelect: () => setLines((all) => all.filter((l) => l.key !== line.key)) },
  ];
  const columns = useMemo(() => column.columns([
    column.accessor("materialLabel", { header: "Material" }),
    column.accessor((r) => r.manufacturer.name, { id: "manufacturer", header: "Manufacturer", cell: ({ row }) => <span>{row.original.manufacturer.name}{row.original.manufacturer.id ? "" : " (new)"}</span> }),
    column.accessor((r) => r.supplier.name, { id: "supplier", header: "Supplier", cell: ({ row }) => <span>{row.original.supplier.name}{row.original.supplier.id ? "" : " (new)"}</span> }),
    column.accessor("quantityPerPack", { header: "Qty/Pack (kg)", size: 110 }),
    column.accessor("approvalMonth", { header: "Approved", size: 130, cell: ({ row }) => monthLabel(row.original.approvalMonth) }),
    column.accessor("validityMonth", { header: "Valid until", size: 130, cell: ({ row }) => monthLabel(row.original.validityMonth) }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.materialLabel}`} items={menu(row.original)} /> }),
  ]), [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const crumbs = [{ label: "Approved vendor list", to: avlRoot }];
  if (options.isLoading || loading) return <FormPageSkeleton label="Loading approved vendor list" />;
  const wrongStatus = mode === "draft" && (source?.status !== ListStatus.Draft || source.draftVersion === undefined)
    ? "This revision is no longer an editable draft."
    : mode === "edit" && (source?.status !== ListStatus.Pending || (source.reviewStatus !== ReviewStatus.AwaitingReview && source.reviewStatus !== ReviewStatus.Returned))
      ? "This revision is no longer open for correction." : null;
  const failure = missing ?? (error || options.error ? apiErrorMessage(error ?? options.error) : wrongStatus);
  if (failure || (mode !== "new" && !source) || !options.data) return <article className="space-y-4"><PageHeader title={titles[mode]} crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{failure ?? "The list could not be loaded."}</p></article>;

  const save = async () => {
    setMessage(null);
    const revisionNumber = Number(revision);
    if (!annexure.trim()) return setMessage("Enter the annexure number.");
    if (!revision.trim() || !Number.isInteger(revisionNumber) || revisionNumber < 0) return setMessage("Enter the revision number.");
    if (mode === "new" && supersedes.trim() && Number(supersedes) >= revisionNumber) return setMessage("The revision number must be higher than the revision it supersedes.");
    if (mode === "edit" && lines.length === 0) return setMessage("Add at least one material.");
    const bad = lines.map((line) => lineProblem(line, lines)).find(Boolean);
    if (bad) return setMessage(bad);
    const denied = permission.check(); if (denied) return setMessage(denied);
    setSaving(true);
    const body = { annexureNumber: annexure.trim(), revisionNumber, lines: lines.map(lineRequest) };
    const supersedesRevision = source?.previousRevisionId ? null : supersedes.trim() ? Number(supersedes) : null;
    const result = mode === "draft" ? await saveDraft({ ...avlAudit, id, domainEntitiesApprovedVendorListsSaveApprovedVendorListDraftRequest: { ...body, supersedesRevision, draftVersion: source?.draftVersion ?? null } })
      : mode === "new" ? await create({ ...avlAudit, domainEntitiesApprovedVendorListsSaveApprovedVendorListRequest: { ...body, supersedesRevision: supersedes.trim() ? Number(supersedes) : null } })
      : mode === "revise" ? await revise({ ...avlAudit, domainEntitiesApprovedVendorListsReviseApprovedVendorListRequest: body })
      : await update({ ...avlAudit, id, domainEntitiesApprovedVendorListsSaveApprovedVendorListRequest: { ...body, supersedesRevision: source?.previousRevisionId ? null : supersedes.trim() ? Number(supersedes) : null, reviewVersion: source?.reviewVersion ?? null } });
    setSaving(false);
    if ("error" in result) return setMessage(apiErrorMessage(result.error));
    toast.success(mode === "edit" ? "List corrected" : "Draft saved");
    void navigate(`${avlRoot}/${typeof result.data === "string" ? result.data : id}/details`);
  };
  const fixedSupersedes = mode === "revise" || Boolean(source?.previousRevisionId);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={titles[mode]} crumbs={[...crumbs, { label: titles[mode] }]} />
    <section aria-label="Header" className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-3">
      <div className="space-y-1.5"><Label htmlFor="avl-annexure">Annexure No.</Label><Input id="avl-annexure" value={annexure} onChange={(e) => setAnnexure(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="avl-revision">Revision No.</Label><Input id="avl-revision" inputMode="numeric" value={revision} onChange={(e) => setRevision(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="avl-supersedes">Supersedes</Label><Input id="avl-supersedes" inputMode="numeric" value={supersedes} disabled={fixedSupersedes} onChange={(e) => setSupersedes(e.target.value)} />
        {fixedSupersedes ? <p className="text-xs text-muted-foreground">The revision this one replaces.</p> : null}</div>
    </section>
    <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Materials</h2>
      <Button size="sm" variant="outline" onClick={() => setEditing("new")}><Plus />Add material</Button></div>
    <ClientDataTable label="Materials on the list" columns={columns} rows={lines} getRowId={(r) => r.key} fill={false} emptyTitle="No materials yet" />
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => void navigate((mode === "edit" || mode === "draft") ? `${avlRoot}/${id}/details` : avlRoot)}>Cancel</Button>
      <Button disabled={saving || !permission.allowed} onClick={() => void save()}>{saving ? "Saving…" : mode === "edit" ? "Save correction" : "Save draft"}</Button></div>
    {editing ? <LineDialog line={editing === "new" ? null : editing} others={lines} options={options.data} onClose={() => setEditing(null)}
      onSave={(line) => { setLines((all) => all.some((l) => l.key === line.key) ? all.map((l) => l.key === line.key ? line : l) : [...all, line]); setEditing(null); }} /> : null}
  </article>;
}

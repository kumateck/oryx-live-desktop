import { useMemo, useState, type ReactNode } from "react";
import { GitBranchPlus, Pencil, Printer, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { TableMenu, type ActionItem } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { ReviewPanel } from "@/shared/reviews/review-panel";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useVendorListPrintQuery, useVendorListQuery } from "../api/avl-api";
import { ListStatus, ReviewStatus, detailSchema, monthLabel, stageLabel, type ListDetail, type ListLine, type Signatory } from "../lib/avl";
import { avlAudit, avlKeys, avlModelType, avlRoot } from "../lib/keys";
import { avlActionPermissions } from "../manifest";
import { stageVariant } from "./avl-list-page";
import { VendorListPrint } from "./avl-print";
import { DeleteVendorListDialog } from "./avl-delete-dialog";

const column = dataTableColumns<ListLine>();

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm">{children}</dd></div>;
}
function Signed({ label, person }: { label: string; person: Signatory | null }) {
  return <Fact label={label}>{person ? <>{person.name}{person.designation ? <span className="block text-xs text-muted-foreground">{person.designation}</span> : null}
    <span className="block text-xs text-muted-foreground">{formatDate(person.signedAt) ?? ""}</span></> : "–"}</Fact>;
}

/** Fetches the list through the print endpoint (its own key) and shows the paper layout. */
function PrintFromServer({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useVendorListPrintQuery({ ...avlAudit, id });
  const parsed = query.data ? detailSchema.safeParse(query.data) : null;
  if (!parsed?.success) return null;
  return <VendorListPrint list={parsed.data} onClose={onClose} />;
}

function useActions(list: ListDetail | null, onPrint: () => void, onDelete: () => void): ActionItem[] {
  const navigate = useNavigate();
  if (!list) return [];
  const inReview = list.status === ListStatus.Pending && (list.reviewStatus === ReviewStatus.AwaitingReview || list.reviewStatus === ReviewStatus.Returned);
  const items: ActionItem[] = [{ id: "print", label: "Print", icon: Printer, require: avlKeys.print, onSelect: onPrint }];
  if (inReview) items.push({ id: "correct", label: "Correct list", icon: Pencil, require: avlKeys.edit, onSelect: () => void navigate(`${avlRoot}/${list.id}/edit`) });
  if (list.status === ListStatus.Approved) items.push({ id: "revise", label: "New revision", icon: GitBranchPlus, require: avlKeys.revise, onSelect: () => void navigate(`${avlRoot}/revise`) });
  items.push({ id: "delete", label: "Delete revision", icon: Trash2, destructive: true, separated: true,
    require: avlActionPermissions.delete, onSelect: onDelete });
  return items;
}

/** One revision: its header, its lines (lapsed ones marked), its review and its signatures. */
export function VendorListDetailPage() {
  const { id = "" } = useParams();
  const query = useVendorListQuery({ ...avlAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const parsed = useMemo(() => query.data ? detailSchema.safeParse(query.data) : null, [query.data]);
  const [printing, setPrinting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const list = parsed?.success ? parsed.data : null;
  const actions = useActions(list, () => setPrinting(true), () => setDeleting(true));
  const columns = useMemo(() => column.columns([
    column.accessor((r) => r.materialCode ?? "", { id: "code", header: "Item code", size: 110 }),
    column.accessor((r) => r.materialName ?? "", { id: "material", header: "Material" }),
    column.accessor((r) => r.manufacturerName ?? "", { id: "manufacturer", header: "Manufacturer", cell: ({ row }) => <span className="break-words">{row.original.manufacturerName}
      {row.original.manufacturerAddress ? <span className="block text-xs text-muted-foreground">{row.original.manufacturerAddress}</span> : null}</span> }),
    column.accessor((r) => r.supplierName ?? "", { id: "supplier", header: "Supplier" }),
    column.accessor("quantityPerPack", { header: "Qty/Pack (kg)", size: 110 }),
    column.accessor("approvalDate", { header: "Approved", size: 130, cell: ({ row }) => monthLabel(row.original.approvalDate) }),
    column.accessor("validityDate", { header: "Valid until", size: 150, cell: ({ row }) => <span className="flex flex-wrap items-center gap-1">{monthLabel(row.original.validityDate)}
      {row.original.lapsed ? <Badge variant="destructive">Lapsed</Badge> : null}</span> }),
  ]), []);
  const crumbs = [{ label: "Approved vendor list", to: avlRoot }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading approved vendor list" />;
  if (query.error || !list) return <article className="space-y-4"><PageHeader title="Approved vendor list" crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The server returned a list the app could not read."}</p></article>;
  const title = `Revision ${list.revisionNumber}`;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={[...crumbs, { label: title }]} actions={<TableMenu label={`Actions for ${title}`} items={actions} />} />
    <section aria-label="List" className="space-y-3 rounded-lg border bg-card p-4">
      <Badge variant={stageVariant(list)}>{stageLabel(list.status, list.reviewStatus)}</Badge>
      <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Fact label="Annexure No.">{list.annexureNumber ?? "–"}</Fact><Fact label="Revision No.">{list.revisionNumber}</Fact>
        <Fact label="Supersedes">{list.supersedesRevision ?? "–"}</Fact>
        <Signed label="Prepared by" person={list.preparedBySignatory} /><Signed label="Checked by" person={list.checkedBy} /><Signed label="Approved by" person={list.approvedBy} />
      </dl>
      {list.status === ListStatus.Superseded ? <p className="text-sm text-muted-foreground">Superseded {formatDate(list.supersededAt) ?? ""}. It no longer restricts procurement.</p> : null}
    </section>
    <ClientDataTable label="Materials" columns={columns} rows={list.lines} getRowId={(r) => r.id} fill={false} emptyTitle="No materials on this list" />
    {/* The "Checked by" step; Correct list edits it while it is in review. */}
    <ReviewPanel record={{ modelType: avlModelType, modelId: list.id }} label="approved vendor list"
      keys={{ confirm: avlKeys.review, return: avlKeys.return, resubmit: avlKeys.edit }} onChanged={() => void query.refetch()} />
    {printing ? <PrintFromServer id={list.id} onClose={() => setPrinting(false)} /> : null}
    {deleting ? <DeleteVendorListDialog list={list} onClose={() => setDeleting(false)} onDeleted={() => void navigate(avlRoot)} /> : null}
  </article>;
}

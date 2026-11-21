import { lazy, Suspense, useMemo, useState } from "react";
import { Pencil, Printer, Send } from "lucide-react";
import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { TableMenu, type ActionItem } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { ReviewPanel } from "@/shared/reviews/review-panel";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { usePriceListPrintQuery, usePriceListQuery, useSubmitPriceListMutation } from "../api/price-list-api";
import { divisionLabel, editablePriceList, listStatus, priceListAudit, priceListDetailSchema, priceListKeys, priceListModel,
  priceListPrintSchema, priceListRoot, priceListTone } from "../lib/price-lists";
import { PriceListHeaderDialog } from "./price-list-header-dialog";
import { PriceListLines } from "./price-list-lines";
const PriceListPrintView = lazy(() => import("./price-list-print").then((module) => ({ default: module.PriceListPrintView })));

function PrintFromServer({ id, onClose }: { id: string; onClose: () => void }) {
  const query = usePriceListPrintQuery({ ...priceListAudit, id });
  const parsed = query.data ? priceListPrintSchema.safeParse(query.data) : null;
  if (query.error) return <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)}</p>;
  if (parsed && !parsed.success) return <p role="alert">The print document could not be read.</p>;
  return parsed?.success ? <Suspense fallback={<DetailPageSkeleton label="Loading print preview" />}><PriceListPrintView data={parsed.data} onClose={onClose} /></Suspense>
    : <DetailPageSkeleton label="Loading print document" />;
}

export function PriceListDetailPage({ recordId, evidence = false }: { recordId?: string; evidence?: boolean } = {}) {
  const params = useParams();
  const id = recordId ?? params.id ?? "";
  const query = usePriceListQuery({ ...priceListAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const parsed = useMemo(() => query.data ? priceListDetailSchema.safeParse(query.data) : null, [query.data]);
  const revision = parsed?.success ? parsed.data : null;
  const [printing, setPrinting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [submit, submitting] = useSubmitPriceListMutation();
  const permission = usePermissionAction(priceListKeys.submit);
  const refresh = () => { void query.refetch(); };
  const send = async () => {
    if (!revision) return;
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    setMessage("");
    const result = await submit({ ...priceListAudit, id, domainEntitiesCostingSubmitCostingPriceListRequest: { version: revision.version } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    refresh();
  };
  const actions: ActionItem[] = [
    { id: "print", label: "Print", icon: Printer, require: priceListKeys.print, onSelect: () => setPrinting(true) },
    ...(revision && editablePriceList(revision) && !evidence ? [
      { id: "correct", label: "Correct header", icon: Pencil, require: priceListKeys.edit, onSelect: () => setEditing(true) },
    ] : []),
    ...(revision?.status === listStatus.draft && !evidence ? [
      { id: "submit", label: "Send for review", icon: Send, require: priceListKeys.submit, disabled: submitting.isLoading, onSelect: () => void send() },
    ] : []),
  ];
  const crumbs = [{ label: "Price-list revisions", to: priceListRoot }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading price-list revision" />;
  if (query.error || !revision) return <article className="space-y-4"><PageHeader title="Price-list revision" crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The price-list revision could not be read."}</p></article>;
  const title = `Revision ${revision.revisionNumber}`;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={[...crumbs, { label: title }]} actions={<TableMenu label={`Actions for ${title}`} items={actions} />} />
    <section aria-label="Revision" className="space-y-3 rounded-lg border bg-card p-4">
      <Badge variant={priceListTone(revision.stage)}>{revision.stage}</Badge>
      <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[{ label: "Document No.", value: revision.documentNumber }, { label: "Division", value: divisionLabel(revision.division) },
          { label: "Supersedes", value: revision.supersedesRevision ?? "–" }, { label: "Effective from", value: formatDate(revision.effectiveFrom) },
          { label: "Prepared by", value: revision.preparedBy ?? "–" }, { label: "Approved", value: formatDate(revision.approvedAt) ?? "–" }]
          .map((fact) => <div key={fact.label} className="min-w-0"><dt className="text-xs text-muted-foreground">{fact.label}</dt><dd className="text-sm">{fact.value}</dd></div>)}
      </dl>
      <p className="text-sm">{revision.revisionReason}</p>
      {revision.stage === "Scheduled" ? <p className="text-sm text-muted-foreground">Approved. The current price list remains in force until this revision's effective date.</p> : null}
    </section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <PriceListLines revision={revision} onChanged={refresh} />
    {revision.status !== listStatus.draft ? <ReviewPanel record={{ modelType: priceListModel, modelId: id }} label="price-list revision"
      keys={{ confirm: priceListKeys.review, return: priceListKeys.return, resubmit: priceListKeys.submit }} onChanged={refresh} /> : null}
    {editing ? <PriceListHeaderDialog division={revision.division} source={revision} editing onClose={() => setEditing(false)} onSaved={refresh} /> : null}
    {printing ? <PrintFromServer id={id} onClose={() => setPrinting(false)} /> : null}
  </article>;
}

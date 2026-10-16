import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useMemo } from "react";
import { qcGrnWarehouseApi } from "../api/qc-grn-api";
import { grnListAudit, qcGrnPath, qcPermissions } from "../lib/qc-grn";
import { qcGrnSchema } from "../schemas/grn-schema";
import { BatchTable } from "./batch-table";

function QcGrnDetail({ id }: { id: string }) {
  const { kind } = useKindTabs(qcPermissions.view);
  const query = qcGrnWarehouseApi.useGetApiV1WarehouseGrnByIdQuery({ ...grnListAudit, id });
  const grn = useMemo(() => { const parsed = qcGrnSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading goods receipt note" />;
  if (!grn || kind === null) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Note unavailable</h1>
    <p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a note the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={qcGrnPath}>Goods receipt notes</Link></Button></div></div>;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`GRN ${grn.number}`} crumbs={[{ label: "Goods receipt notes", to: `${qcGrnPath}?type=${String(kind)}` }, { label: grn.number }]} />
    <KeyFacts>
      <KeyFact label="Received" value={formatDate(grn.receivedAt) ?? "–"} />
      <KeyFact label="Carrier" value={grn.carrier ?? "–"} note={grn.vehicle ?? undefined} />
      <KeyFact label="Declaration number" value={grn.declaration ?? "–"} />
      <KeyFact label="Batches" value={grn.batches.length} />
    </KeyFacts>
    {grn.remarks ? <section aria-label="Remarks" className="rounded-lg border bg-card p-3 text-sm"><h2 className="mb-1 font-semibold">Remarks</h2><RichTextView html={grn.remarks} /></section> : null}
    <BatchTable grnId={grn.id} kind={kind} batches={grn.batches} />
  </article>;
}

export function QcGrnDetailPage() {
  const { id } = useParams();
  return id ? <QcGrnDetail id={id} /> : null;
}

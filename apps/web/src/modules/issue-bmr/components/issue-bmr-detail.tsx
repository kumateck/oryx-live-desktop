import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { toLargestUnit } from "@/shared/units/quantity";
import { useIssueBmr } from "../hooks/use-issue-bmr";
import { issueBmrPath } from "../lib/issue-bmr";
import { BmrMaterials } from "./bmr-materials";
import { IssueForm } from "./issue-form";

function IssueBmrDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const page = useIssueBmr(id);
  const { bmr, query } = page;
  if (query.isLoading || (bmr && !bmr.issuedAt && !page.suggestion)) return <DetailPageSkeleton label="Loading batch record" />;
  if (!bmr) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Batch record unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a record the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={issueBmrPath}>BMR and BPR requests</Link></Button></div></div>;
  const title = bmr.productName ?? "Batch record";
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={[{ label: "Issue BMR/BPR", to: issueBmrPath }, { label: bmr.batchNumber ?? title }]} />
    <KeyFacts>
      <KeyFact label="Product code" value={bmr.productCode ?? "–"} />
      <KeyFact label="Schedule" value={bmr.schedule ?? "–"} />
      <KeyFact label="Department" value={bmr.department ?? "–"} />
      <KeyFact label="Requested" value={formatDate(bmr.requestedAt) ?? "–"} />
      <KeyFact label="Status" value={bmr.issuedAt ? <Badge>Issued</Badge> : <Badge variant="outline">Awaiting issue</Badge>} note={bmr.issuedAt ? formatDate(bmr.issuedAt) ?? undefined : undefined} />
    </KeyFacts>
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <section aria-label="Batch details" className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">Batch details</h2>
        {bmr.issuedAt ? <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {[["Batch number", bmr.batchNumber], ["Batch size", toLargestUnit(bmr.quantity, bmr.unit)?.text], ["Manufactured", formatMonthYear(bmr.made)], ["Expires", formatMonthYear(bmr.expires)], ["Packing style", bmr.packing]]
            .map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value ?? "–"}</dd></div>)}
        </dl> : <IssueForm bmr={bmr} suggestion={page.suggestion ?? { value: null, note: null }} saving={page.saving} saved={page.saved} onIssue={page.submit} onDone={() => void navigate(issueBmrPath)} />}
        {page.message ? <p role="alert" className="text-sm text-destructive">{page.message}</p> : null}
      </section>
      <div className="min-w-0 space-y-4">
        <BmrMaterials title="Raw materials" rows={page.raw.rows} loading={page.raw.loading} error={page.raw.error} onRetry={page.raw.retry} />
        <BmrMaterials title="Packaging materials" rows={page.packaging.rows} loading={page.packaging.loading} error={page.packaging.error} onRetry={page.packaging.retry} />
      </div>
    </div>
  </article>;
}

export function IssueBmrDetailPage() {
  const { id } = useParams();
  return id ? <IssueBmrDetail id={id} /> : null;
}

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StockAdjustmentDetails } from "@/modules/pending-approvals/components/details/production-details";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { adjustmentFormSchema, adjustmentPath, adjustmentPermissions, adjustmentRequest, adjustmentRowsSchema, adjustmentsPathFor, audit, emptyLine, emptyRecordLine, materialTarget, newAdjustmentPathFor, parseTarget,
  recordAdjustmentFormSchema, recordAdjustmentRequest, suggestedNumber, targetLabel, targetTabs, type Adjustment, type AdjustmentFormValues, type AdjustmentTarget, type RecordAdjustmentFormValues } from "../adjustments";
import { AdjustmentLines } from "./adjustment-lines";
import { RecordLines } from "./record-lines";
import { addTags } from "@/shared/api/add-tags";

const tag = { type: "StockAdjustments" as const, id: "all" };
const { useGetApiV1StockAdjustmentQuery, usePostApiV1StockAdjustmentMutation } = warehouseApi.enhanceEndpoints({ endpoints: { getApiV1StockAdjustment: (definition) => { definition.providesTags = addTags(definition.providesTags, [tag]); }, getApiV1StockAdjustmentById: (definition) => { definition.providesTags = addTags(definition.providesTags, [tag]); },
  // An adjustment with no approval workflow is applied at once, so shelves may change; otherwise it joins the approvers' queue.
  postApiV1StockAdjustment: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [tag, "StockOnShelves", "PendingApprovals"]); } } });

const column = dataTableColumns<Adjustment>();
const columns = column.columns([
  column.accessor("number", { header: "Adjustment", cell: ({ row }) => <span className="break-words font-medium">{row.original.number}</span> }),
  column.accessor((row) => row.date ?? "", { id: "date", header: "Counted on", size: 170, cell: ({ row }) => formatDate(row.original.date) ?? "–" }),
  column.accessor("lines", { header: "Lines", size: 110 }),
  column.accessor("approved", { header: "Status", size: 200, cell: ({ row }) => row.original.approved ? <Badge>Approved and applied</Badge> : <Badge variant="outline">Awaiting approval</Badge> }),
]);

const descriptions: Record<AdjustmentTarget, { list: string; empty: string }> = {
  1: { list: "Material counts that differed from the system, batch by batch on each shelf.", empty: "Record one when a count on the shelves differs from the system." },
  0: { list: "General store item counts that differed from the system.", empty: "Record one when a count in the general store differs from the system." },
  2: { list: "Finished product counts that differed from what a transfer note records.", empty: "Record one when a count in the finished goods store differs from the system." },
};

/** The kind of stock a page is about, from the address; switching it keeps the address in step. */
function useTarget(): [AdjustmentTarget, (target: AdjustmentTarget) => void] {
  const [params, setParams] = useSearchParams();
  return [parseTarget(params.get("target")), (target) => setParams((current) => { const next = new URLSearchParams(current); next.set("target", String(target)); return next; }, { replace: true })];
}

/** Counts that disagreed with the system, for materials, general store items or finished products, and whether each has been approved. */
export function AdjustmentListPage() {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [target, setTarget] = useTarget();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("stock adjustments", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1StockAdjustmentQuery({ ...audit, targetType: target, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? adjustmentRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Stock adjustments</h1><p className="text-sm text-muted-foreground">{descriptions[target].list} Stock changes only once an adjustment is approved.</p></div>
      {has(adjustmentPermissions.create) ? <Button asChild size="sm"><Link to={newAdjustmentPathFor(target)}><Plus />New adjustment</Link></Button> : null}
    </div>
    <div role="group" aria-label="Stock counted" className="flex flex-wrap gap-1">{targetTabs.map((tab) =>
      <Button key={tab.value} type="button" size="sm" variant={target === tab.value ? "default" : "outline"} aria-pressed={target === tab.value} onClick={() => setTarget(tab.value)}>{tab.label}</Button>)}</div>
    <ServerDataTable label="Stock adjustments" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(adjustmentPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned adjustments the app could not read." : null}
      emptyTitle={search.trim() ? "No adjustments match this search" : "No stock adjustments"} emptyDescription={search.trim() ? "Search by adjustment number." : descriptions[target].empty} />
  </section>;
}

const kinds = [{ value: 0 as const }, { value: 1 as const }];
const fields: WizardField<AdjustmentFormValues>[] = [
  { type: InputTypes.TEXT, name: "number", label: "Adjustment number", required: true },
  { type: InputTypes.DATE, name: "date", label: "Date of the count", required: true, maxDate: new Date() },
];

/** Records a count that differs from the system and sends it for approval. Nothing changes until it is approved. */
export function NewAdjustmentPage() {
  const [target] = useTarget();
  return target === materialTarget ? <NewMaterialAdjustment /> : <NewRecordAdjustment key={target} target={target} />;
}

function NewMaterialAdjustment() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<MaterialKind>(0);
  const [create, creating] = usePostApiV1StockAdjustmentMutation();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const form = useForm<AdjustmentFormValues>({ resolver: zodResolver(adjustmentFormSchema), defaultValues: { number: suggestedNumber(), date: new Date(), lines: [emptyLine()] } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await create({ ...audit, domainEntitiesStockAdjustmentsCreateStockAdjustmentRequest: adjustmentRequest(values) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    const applied = result.data?.approved === true;
    toast.success("Adjustment recorded", { description: applied ? "No approval is set up for adjustments, so the stock was changed at once." : "It is waiting for approval; the stock changes once it is approved." });
    setSaved(true);
    void navigate(result.data?.id ? adjustmentPath(result.data.id) : adjustmentsPathFor(materialTarget));
  });
  const busy = creating.isLoading;
  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !busy && !saved} />
    <PageHeader title="New stock adjustment · materials" crumbs={[{ label: "Stock adjustments", to: adjustmentsPathFor(materialTarget) }, { label: "New" }]}
      actions={<><Button type="button" variant="outline" disabled={busy} onClick={() => void navigate(adjustmentsPathFor(materialTarget))}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : "Send for approval"}</Button></>} />
    <section className="space-y-3 rounded-lg border bg-card p-4"><FormWizard form={form} fields={fields} className="md:grid-cols-2" />
      <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">Materials offered on the lines:</span><KindSwitch tabs={kinds} kind={kind} onSelect={setKind} /></div></section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <AdjustmentLines form={form} kind={kind} />
  </form>;
}

const recordFields: WizardField<RecordAdjustmentFormValues>[] = [
  { type: InputTypes.TEXT, name: "number", label: "Adjustment number", required: true },
  { type: InputTypes.DATE, name: "date", label: "Date of the count", required: true, maxDate: new Date() },
];

/** A count of general store items, or of finished products against their transfer notes. */
function NewRecordAdjustment({ target }: { target: 0 | 2 }) {
  const navigate = useNavigate();
  const [create, creating] = usePostApiV1StockAdjustmentMutation();
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [schema] = useState(() => recordAdjustmentFormSchema(target));
  const form = useForm<RecordAdjustmentFormValues>({ resolver: zodResolver(schema), defaultValues: { number: suggestedNumber(), date: new Date(), lines: [emptyRecordLine()] } });
  // Read here so the form re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const back = adjustmentsPathFor(target);
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await create({ ...audit, domainEntitiesStockAdjustmentsCreateStockAdjustmentRequest: recordAdjustmentRequest(values, target) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Adjustment recorded", { description: result.data?.approved === true ? "No approval is set up for adjustments, so the stock was changed at once." : "It is waiting for approval; the stock changes once it is approved." });
    setSaved(true);
    void navigate(result.data?.id ? adjustmentPath(result.data.id) : back);
  });
  const busy = creating.isLoading;
  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !busy && !saved} />
    <PageHeader title={`New stock adjustment · ${targetLabel(target).toLowerCase()}`} crumbs={[{ label: "Stock adjustments", to: back }, { label: "New" }]}
      actions={<><Button type="button" variant="outline" disabled={busy} onClick={() => void navigate(back)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : "Send for approval"}</Button></>} />
    <section className="space-y-3 rounded-lg border bg-card p-4"><FormWizard form={form} fields={recordFields} className="md:grid-cols-2" />
      {target === 2 ? <p className="text-sm text-muted-foreground">Each line is counted against a transfer note the finished goods store has received; approving it changes the quantity that note records.</p> : null}</section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <RecordLines form={form} target={target} />
  </form>;
}

export function AdjustmentDetailPage() {
  const { id } = useParams();
  if (!id) return null;
  return <article className="min-w-0 space-y-4">
    <PageHeader title="Stock adjustment" crumbs={[{ label: "Stock adjustments", to: adjustmentsPathFor(materialTarget) }, { label: "Adjustment" }]} />
    <StockAdjustmentDetails id={id} />
  </article>;
}
